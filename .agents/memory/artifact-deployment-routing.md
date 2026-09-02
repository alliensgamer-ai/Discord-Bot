---
name: Artifact deployment routing
description: How this PNPM workspace exposes long-running processes to Replit Publishing.
---

In an artifact-backed PNPM workspace, Publishing discovers deployable applications from registered artifacts; root `.replit` deployment commands alone do not make a package under `bots/` publishable.

**Why:** The workspace can contain working background services and design artifacts while Publishing still reports that there is nothing to publish.

**How to apply:** Represent a long-running product process with one registered deployable artifact and put its production build/run commands in that artifact's `services.production` configuration. Keep the development workflow separate and do not start it as the production process.