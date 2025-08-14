# CleanView

> Hide files matching .gitignore patterns from VS Code Explorer for a cleaner workspace

CleanView automatically hides files and folders that match patterns in your `.gitignore` files, giving you a cleaner, more focused view of your project in the VS Code Explorer.

## Features

- **🔍 Smart Gitignore Parsing**: Uses spec-compliant gitignore pattern matching
- **👁️ Toggle Visibility**: Easily show/hide gitignored files with commands or status bar
- **📁 Nested Support**: Handles nested `.gitignore` files throughout your project
- **⚡ Auto-Updates**: Automatically refreshes when `.gitignore` files change
- **🎛️ Configurable**: Customize behavior with extension settings
- **📊 Status Indicator**: Visual status bar showing active state and pattern count

## Quick Start

1. Install the extension
2. Open a project with a `.gitignore` file
3. Use `Ctrl+Shift+P` → **"CleanView: Toggle Hide Gitignored Files"**
4. Or click the eye icon in the status bar

## Commands

| Command | Description |
|---------|-------------|
| `CleanView: Toggle Hide Gitignored Files` | Show/hide gitignored files |
| `CleanView: Refresh Gitignore Patterns` | Manually refresh patterns |
| `CleanView: Disable CleanView` | Completely disable hiding |

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `cleanview.autoHide` | Automatically hide files on activation | `true` |
| `cleanview.includeNestedGitignore` | Include nested .gitignore files | `true` |
| `cleanview.showStatusBar` | Show status bar indicator | `true` |
| `cleanview.customPatterns` | Additional custom ignore patterns | `[]` |

## Status Bar

The status bar indicator shows:
- `👁️ CleanView` - Inactive (files visible)
- `👁️‍🗨️ CleanView (12)` - Active (files hidden, 12 patterns applied)

Click the indicator to toggle visibility.

## How It Works

CleanView reads your `.gitignore` files and converts the patterns into VS Code's `files.exclude` setting temporarily. When you disable CleanView, it restores your original exclude settings.

### Supported Patterns

- Standard gitignore patterns (`*.log`, `node_modules/`, `/build`)
- Nested `.gitignore` files in subdirectories
- Custom patterns from extension settings
- Negation patterns (`!important.log`) are handled correctly

## Examples

### Basic Usage
```
# .gitignore
node_modules/
*.log
.DS_Store
/build
```

CleanView will hide:
- All `node_modules` folders
- Any `.log` files
- `.DS_Store` files
- The `build` folder in the root

### Custom Patterns
Add custom patterns in VS Code settings:
```json
{
  "cleanview.customPatterns": [
    "*.tmp",
    "cache/",
    ".vscode/settings.json"
  ]
}
```

## Requirements

- VS Code 1.74.0 or higher
- A workspace with `.gitignore` files (recommended)

## Known Issues

- Large projects may take a moment to process complex gitignore patterns
- Pattern changes require manual refresh in some edge cases

## Release Notes

### 1.0.0
- Initial release
- Core gitignore parsing and file hiding
- Status bar integration
- Configuration options
- File system watchers

## Contributing

Found a bug or have a suggestion? Please [open an issue](https://github.com/roxhens/cleanview/issues).

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Enjoy a cleaner workspace with CleanView!** ✨
