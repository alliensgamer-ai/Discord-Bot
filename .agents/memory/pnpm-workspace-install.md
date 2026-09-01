---
name: Workspace package installation
description: A pnpm workspace constraint relevant when adding dependencies to standalone bot packages.
---

Dependencies for a package inside this workspace should be declared in that package's `package.json` and resolved with a workspace install. The generic language-package helper targets the repository root, where pnpm's workspace-root safety check rejects package additions.

**Why:** Installing a package through the generic helper attempted to add it to the workspace root instead of the bot package and failed before changing dependencies.

**How to apply:** For a new package under a workspace glob, edit its manifest first and run the workspace install so the lockfile and package links are updated together.