# DEPRECATION NOTICE

⚠️ **This folder (`lean-format-npm`) is LEGACY and should be removed.**

## Why?

This appears to be an old standalone npm package structure that predates the monorepo organization. The project has now been restructured as a monorepo with proper workspace packages:

- **`packages/core`** - Core LEAN parser/serializer library
- **`packages/cli`** - Command-line interface
- **`packages/vscode`** - VS Code extension
- **`packages/playground`** - Interactive playground
- **`packages/website`** - Documentation website

## What to do?

1. **Verify no unique code** - Check if this folder contains any code not present in `packages/core`
2. **Remove the folder** - If it's truly redundant:
   ```bash
   rm -rf lean-format-npm/
   ```
3. **Update .gitignore** - Ensure it's not tracked if removed

## Migration Checklist

- [ ] Compare src/ with packages/core/src/
- [ ] Check if any dependencies are missing in packages/core
- [ ] Verify no unique tests exist here
- [ ] Confirm no production systems reference this folder
- [ ] Remove folder
- [ ] Update any documentation that references it

---

*Created during comprehensive project review - November 2025*
