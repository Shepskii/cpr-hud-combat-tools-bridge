# CPR Combat HUD - Pneuma Combat Tools Bridge

This Foundry VTT module routes supported, targeted weapon attacks started from CPR Combat HUD through Pneuma Combat Tools' existing `attackFromHUD` dispatcher. That preserves Pneuma's attack/evasion card flow and its deferred 3D dice animation rather than creating a second roll.

## Requirements

- Foundry VTT v12
- Cyberpunk RED Core
- CPR Combat HUD
- Pneuma's Combat Tools
- libWrapper (required by Pneuma's Combat Tools)

Install this folder as `Data/modules/cpr-hud-pneuma-bridge` and enable it with the other modules. No changes to either upstream module are needed.

The bridge only reroutes a supported weapon when exactly one visible, supported target is selected. HUD target-picking settings are honored. Unsupported attacks and attacks without one unambiguous target continue through CPR Combat HUD's native roll pipeline. Ctrl-click and Meta-click continue to skip the confirmation dialog.