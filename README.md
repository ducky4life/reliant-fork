# reliant but mobile

[download](https://github.com/ducky4life/reliant-mobile/releases/latest/download/reliant-release.zip)

no double tap to zoom

changes: added to [css file](https://github.com/ducky4life/reliant-mobile/blob/main/src/css/_main.scss)
```css
  * {
      touch-action: manipulation;
  }
```

## original reliant readme

# Reliant
Reliant is a browser extension for Chromium-based browsers that seeks to make defending easier.
## Quick Start
[Click here for a quick start guide.](documentation/quick-start.md)
## Disclaimer
This tool should not be assumed to be legal. It remains the player's responsibility to ensure any tools they use comply with the [Script Rules](https://forum.nationstates.net/viewtopic.php?p=16394966#p16394966).
## License
This project is licensed under the GNU Affero General Public License v3.0. You may obtain a copy of the License at [https://www.gnu.org/licenses/agpl-3.0.html](https://www.gnu.org/licenses/agpl-3.0.html).
## Contributing
To setup a development environment:
1. Clone the repository.
2. Ensure you have Node.js installed.
3. Run `npm install` in the project directory.
4. Compile TypeScript code using `tsc --watch` for watch mode or `tsc` for a single compilation.
