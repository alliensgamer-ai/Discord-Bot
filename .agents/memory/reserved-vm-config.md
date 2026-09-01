---
name: Reserved VM config
description: Deployment identifier accepted by this workspace's .replit validator.
---

For this workspace, the validated `.replit` deployment target for the persistent Reserved VM-style deployment is `vm`. The documentation may describe the product as Reserved VM or use `reservedvm`, but the local configuration validator rejected `reservedvm` and accepted `vm`.

**Why:** Using the documented product name directly caused schema validation failure, while the API-compatible identifier was accepted without changing the existing workflow sections.

**How to apply:** Keep the production deployment target as `vm`, with an argument-array `build` and `run` command for the bot. Do not infer the identifier from prose when editing `.replit`; validate the full file first.