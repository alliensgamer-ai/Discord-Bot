---
name: Season archive model
description: The non-destructive season strategy for the competitive ranking.
---

The active ranking uses each player's current totals, while closing a season creates an immutable per-season snapshot before resetting those active totals. Point history and source records remain append-only.

**Why:** The existing ranking tables may already contain player data, so seasons must be additive and must never reset by deleting records or discarding historical statistics.

**How to apply:** Future ranking modes should write to the active totals and include the active season on new source records; season close must archive first, then reset only active counters.