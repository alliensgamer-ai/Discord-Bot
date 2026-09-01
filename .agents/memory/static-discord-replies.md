---
name: Static Discord replies
description: The response rule for help and other commands whose content is already in memory.
---

Commands whose response is fully defined in source should build the response and call interaction.reply immediately. Shared aliases should use one response helper, and the interaction event boundary should log both receipt and response failures.

**Why:** Discord interactions have a short acknowledgement window; unnecessary database work or swallowed reply errors can surface to users as “The application did not respond.”

**How to apply:** Keep `/ayuda` and `/help` free of ranking-service calls. If an interaction handler catches an error, attempt the appropriate reply, follow-up, or editReply and log a failure when that fallback cannot be sent.