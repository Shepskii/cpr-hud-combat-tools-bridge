# CPR Combat HUD - Pneuma Combat Tools Bridge

This Foundry VTT module routes supported weapon attacks started from CPR Combat HUD through Pneuma's Combat Tools' existing `attackFromHUD` dispatcher in order to trigger attack animations and sounds. This preserves Pneuma's attack/evasion card flow and its deferred 3D dice animation rather than creating a second roll.

## Installation

Unzip the release folder to the `Data\Modules` folder in your Foundry instance - `Data/modules/cpr-hud-pneuma-bridge`. Enable the module.

Or install through Foundry with the manifest: https://github.com/Shepskii/cpr-hud-pneuma-bridge/releases/latest/download/module.json

While loaded in your World, enable CPR Combat HUD - Pneuma Combat Tools Bridge in the Module Management.

## Requirements

- Foundry VTT v12
- Cyberpunk RED Core
- [CPR Combat HUD](https://github.com/Vec97/cpr-combat-hud)
- [Pneuma's Combat Tools](https://github.com/GMPneuma/PneumaCombatTools)
- libWrapper (required by Pneuma's Combat Tools)

## Features

The bridge reroutes a supported single-target weapon when exactly one visible, supported target is selected, in order to trigger attack animations and sounds from Pneuma's Combat Tools. 

Area-capable and suppressive attacks can also start with no selected target; Pneuma then prompts for area placement, starting from the attacker.

Unsupported attacks and other attacks without one unambiguous target continue through CPR Combat HUD's native roll pipeline. So does an attack the magazine cannot feed (no rounds, or fewer than 10 for autofire or suppressive fire), so the system can say why it cannot fire, and any click while CPR Combat HUD's "Choose Target" is open. If the bridge cannot load the parts of CPR Combat HUD or Pneuma's Combat Tools it uses (after an update that moves them), every attack uses the HUD's native pipeline. Ctrl-click and Meta-click continue to skip the confirmation dialog.

## Unofficial Content

CPR Combat HUD - Pneuma Combat Tools Bridge is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.
