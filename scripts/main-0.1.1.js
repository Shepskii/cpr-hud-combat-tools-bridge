const MODULE_ID = "cpr-hud-pneuma-bridge";
const HUD_ID = "cpr-combat-hud";
const PNEUMA_ID = "pneuma-combattools";
const SYSTEM_ID = "cyberpunk-red-core";
const WRAPPER_TARGET = "cprHudPneumaBridge";
const ATTACK_MODES = new Set(["attack", "aimed", "autofire", "suppressive"]);

// The other modules' own files, relative to this one: they then resolve under any Foundry route
// prefix, and to the same module instances the HUD and Pneuma load themselves (Pneuma keeps state in
// them, such as which actors are mid-attack).
const HUD_TARGETING = "../../cpr-combat-hud/scripts/targeting.js";
const PNEUMA_ATTACKS = "../../pneuma-combattools/scripts/attack-menu.js";
const PNEUMA_AMMO = "../../pneuma-combattools/scripts/weapon-ammo.js";

// The parts of the other modules this bridge uses, or null when they cannot be loaded (a version
// that moved or renamed them); the HUD's own attack is used then.
async function loadModuleParts() {
  try {
    const [targeting, attacks, ammo] = await Promise.all([
      import(HUD_TARGETING),
      import(PNEUMA_ATTACKS),
      import(PNEUMA_AMMO),
    ]);
    const usable =
      typeof targeting.resolveAttackTarget === "function" &&
      typeof targeting.isTargeting === "function" &&
      typeof attacks.attackEntries === "function" &&
      typeof attacks.thrownEntries === "function" &&
      typeof attacks.attackFromHUD === "function" &&
      typeof ammo.ammoBlocks === "function";
    if (usable) return { targeting, attacks, ammo };
    console.warn(`${MODULE_ID} | CPR Combat HUD or Pneuma's Combat Tools has changed; using the HUD's own attacks.`);
  } catch (error) {
    console.error(`${MODULE_ID} | Could not load CPR Combat HUD or Pneuma's Combat Tools; using the HUD's own attacks.`, error);
  }
  return null;
}

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

  const parts = await loadModuleParts();
  if (!parts) return wrapped(event);
  const { targeting, attacks, ammo } = parts;

  // While the HUD's "Choose Target" is open it ignores clicks, so nothing fires until a target is
  // picked or the choice is cancelled; leave the click to it.
  if (targeting.isTargeting()) return wrapped(event);

  try {
    const items = Array.from(actor.items);
    const entry = [
      ...attacks.attackEntries(items),
      ...attacks.thrownEntries(items),
    ].find((candidate) => candidate.id === itemId);
    if (!entry || (["autofire", "suppressive"].includes(mode) && !entry.autofire)) {
      return wrapped(event);
    }

    // Pneuma silently declines an attack the magazine cannot feed; the HUD's own attack lets the
    // system say why instead.
    const item = actor.items.get(itemId);
    if (item && ammo.ammoBlocks(item, mode)) return wrapped(event);

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