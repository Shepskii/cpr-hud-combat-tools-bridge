# CPR Combat HUD - Pneuma Combat Tools Bridge

This Foundry VTT module routes supported weapon attacks started from CPR Combat HUD through Pneuma's Combat Tools' existing `attackFromHUD` dispatcher in order to trigger attack animations and sounds. This preserves Pneuma's attack/evasion card flow and its deferred 3D dice animation rather than creating a second roll.

## Installation

Install this folder as `Data/modules/cpr-hud-pneuma-bridge` and enable it with the other modules.

## Requirements

- Foundry VTT v12
- Cyberpunk RED Core
- [CPR Combat HUD](https://github.com/Vec97/cpr-combat-hud)
- [Pneuma's Combat Tools](https://github.com/GMPneuma/PneumaCombatTools)
- libWrapper (required by Pneuma's Combat Tools)

## Features

The bridge reroutes a supported single-target weapon when exactly one visible, supported target is selected, in order to trigger attack animations and sounds from Pneuma's Combat Tools. 

Area-capable and suppressive attacks can also start with no selected target; Pneuma then prompts for area placement, starting from the attacker.

Unsupported attacks and other attacks without one unambiguous target continue through CPR Combat HUD's native roll pipeline. Ctrl-click and Meta-click continue to skip the confirmation dialog.

## Unofficial Content

CPR Combat HUD - Pneuma Combat Tools Bridge is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.