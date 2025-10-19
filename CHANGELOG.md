# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

- Added: for new features.
- Changed: for changes in existing functionality.
- Deprecated: for soon-to-be removed features.
- Removed: for now removed features.
- Fixed: for any bug fixes.
- Security: in case of vulnerabilities.

## [Unreleased]

## [0.3.4] - 2025-10-20
### Added
- Added `svg2svgfont` function to generate SVG font output.
- Added `ts` (timestamp) parameter to `TtfFontParameters` for reproducible binary TTF generation.

### Changed
- Updated `@lulliecat/svg2ttf` from 6.0.4 to 6.0.5 to fix bugs.

## [0.3.3] - 2025-10-19
### Fixed
- Fixed import statement to use `@lulliecat/svg2ttf` instead of `svg2ttf`.

## [0.3.2] - 2025-10-19
### Changed
- Switched from `svg2ttf` to `@lulliecat/svg2ttf` for security updates.

### Removed
- Removed unused `ttf2svg` development dependency.

## [0.3.1] - 2025-10-19
### Changed
- Updated dependencies to their latest versions.

## [0.3.0] - 2025-04-18
### Added
- default argument value is added.
- viewbox preservation logic is added.

## [0.2.1] - 2025-04-17
### Added
- argument option "vertical_align" is added for css.

## [0.2.0] - 2025-04-13
### Changed
- argument option is changed to generate more accurate font.

## [0.1.1] - 2025-04-12
### Added
- Add Readme.

## 0.1.0 - 2025-04-12
### Added
- First Implementation.

[Unreleased]: https://github.com/osawa-naotaka/svg2woff2/compare/v0.3.4...HEAD
[0.3.4]: https://github.com/osawa-naotaka/svg2woff2/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/osawa-naotaka/svg2woff2/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/osawa-naotaka/svg2woff2/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/osawa-naotaka/svg2woff2/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/osawa-naotaka/svg2woff2/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/osawa-naotaka/svg2woff2/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/osawa-naotaka/svg2woff2/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/osawa-naotaka/svg2woff2/compare/v0.1.0...v0.1.1
