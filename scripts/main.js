const MODULE_ID = "cpr-hud-pneuma-bridge";
const HUD_ID = "cpr-combat-hud";
const PNEUMA_ID = "pneuma-combattools";
const SYSTEM_ID = "cyberpunk-red-core";
const WRAPPER_TARGET = "cprHudPneumaBridge";
const ATTACK_MODES = new Set(["attack", "aimed", "autofire", "suppressive"]);

function selectedAttacker(hud, actor) {
  const tokens = canvas.tokens;
  if (!tokens) return undefined;

  if (hud._tokenDoc) {
    const token = tokens.get(hud._tokenDoc.id);
    if (token?.actor?.uuid === actor.uuid && token.can(game.user, "control")) {
      return token;
    }
    return undefined;
  }

  const candidates = tokens.placeables.filter(
    (token) => token.actor?.uuid === actor.uuid && token.can(game.user, "control")
  );
  return candidates.length === 1 ? candidates[0] : undefined;
}

async function routeHudAttack(wrapped, event) {
  const button = event.target?.closest?.("#cpr-combat-hud [data-action='attack']");
  if (!button) return wrapped(event);

  const hudModule = game.modules.get(HUD_ID);
  const pneumaModule = game.modules.get(PNEUMA_ID);
  if (!hudModule?.active || !pneumaModule?.active) return wrapped(event);

  const actor = this._actor;
  const itemId = button.dataset.itemId;
  if (!actor || !itemId) return wrapped(event);

  const mode = actor.getFlag(SYSTEM_ID, `firetype-${itemId}`) || "attack";
  if (!ATTACK_MODES.has(mode)) return wrapped(event);

  try {
    const [targeting, attacks] = await Promise.all([
      import("/modules/cpr-combat-hud/scripts/targeting.js"),
      import("/modules/pneuma-combattools/scripts/attack-menu.js"),
    ]);
    const items = Array.from(actor.items);
    const entry = [
      ...attacks.attackEntries(items),
      ...attacks.thrownEntries(items),
    ].find((candidate) => candidate.id === itemId);
    if (!entry || (["autofire", "suppressive"].includes(mode) && !entry.autofire)) {
      return wrapped(event);
    }

    const attacker = selectedAttacker(this, actor);
    if (!attacker) return wrapped(event);

    const currentTargets = () => Array.from(game.user.targets ?? []);
    const areaAttack = entry.area || mode === "suppressive";
    const targetlessAreaAttack = areaAttack && currentTargets().length === 0;
    const targetMode = game.settings.get(HUD_ID, "targetMode");
    const shouldPick =
      !targetlessAreaAttack &&
      (targetMode === "always" || (targetMode === "ifNone" && currentTargets().length === 0));

    if (shouldPick && !(await targeting.resolveAttackTarget())) return;

    const targets = currentTargets();
    if (targetlessAreaAttack && targets.length === 0) {
      if (!attacker.isVisible) return wrapped(event);

      event.preventDefault();
      try {
        await attacks.attackFromHUD(attacker, attacker, itemId, mode, {
          shiftKey: !!(event.ctrlKey || event.metaKey),
        });
      } finally {
        attacker.setTarget(false);
      }
      return;
    }

    if (targets.length !== 1) return wrapped(event);

    const target = targets[0];
    const supportedTarget =
      target?.actor &&
      target.isVisible &&
      !["container", "blackIce", "demon"].includes(String(target.actor.type)) &&
      canvas.tokens.get(target.id) === target;
    if (!supportedTarget) {
      if (shouldPick) {
        ui.notifications.warn("Choose a visible combatant for this Pneuma attack.");
        return;
      }
      return wrapped(event);
    }

    event.preventDefault();
    await attacks.attackFromHUD(attacker, target, itemId, mode, {
      shiftKey: !!(event.ctrlKey || event.metaKey),
    });
  } catch (error) {
    console.error(`${MODULE_ID} | Pneuma attack routing failed`, error);
    ui.notifications.error(
      error instanceof Error ? error.message : "Pneuma attack routing failed."
    );
  }
}

Hooks.once("ready", () => {
  const hud = game.modules.get(HUD_ID)?.api;
  const prototype = hud?.constructor?.prototype;
  if (typeof prototype?._onClick !== "function") {
    console.error(`${MODULE_ID} | CPR Combat HUD click handler is unavailable.`);
    ui.notifications.warn("CPR Combat HUD - Pneuma bridge could not attach.");
    return;
  }

  if (!globalThis.libWrapper?.register) {
    console.error(`${MODULE_ID} | libWrapper is unavailable.`);
    ui.notifications.warn("CPR Combat HUD - Pneuma bridge requires libWrapper.");
    return;
  }

  globalThis[WRAPPER_TARGET] = { prototype };
  libWrapper.register(
    MODULE_ID,
    `${WRAPPER_TARGET}.prototype._onClick`,
    routeHudAttack,
    "MIXED"
  );
});