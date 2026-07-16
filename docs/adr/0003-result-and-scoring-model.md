# 0003 — Result & scoring model

Status: accepted

## Context

Five forced-choice questions map to five Love Styles (answers A–E). With only 5 questions, ties are common (~29% two-way, ~4% five-way) and 3-/4-way ties are mathematically impossible. Family results and community counters must stay honest at small N.

## Decision

### Individual result

- Each answer adds 1 to its style; the **primary Love Style** is the top style.
- **Two-way tie (2+2+1)** → "X, with a bit of Y", where X is the tied style **answered earliest**.
- **Five-way tie (1×5)** → **Rojak Love** ("you love in every way").
- Every Participant resolves to exactly **one primary Love Style**; a Rojak individual's counted primary is the earliest-answered style.

### Aggregation

- **Only the primary counts** toward the community dashboard and the family mix. Hybrid/Rojak are display-only. Keeps the five counters integer and summing to the participant total.

### Family Love Mix (N ≥ 2)

- Live **count** of members by primary style, rendered as counts + a proportional bar. **No numeric percentages at family scale** — percentages are a community-scale concept only.

### Family Archetype (headline over the mix) — first match wins

1. **Dominant Family** — one style holds the strict max *and* ≥ half the members → "The {Name} Family is a {X} Family."
2. **Parent-Child Contrast** — ≥1 parent-figure *and* ≥1 child, and the groups' dominant styles differ → "Parents lean towards {X}; children lean towards {Y}." (Group-dominant ties broken by earliest-joined member.)
3. **Rojak Love Family** — ≥3 distinct styles present → "A Rojak Love Family."
4. **Two-Way (fallback)** — exactly two styles, tied → "loves in two ways: {X} and {Y}."

## Consequences

- Precedence favors the clearest legible story (a real majority) first, then the Parents-Day-thematic contrast, then charming spread, then a safe two-way fallback. Every N≥2 family lands in exactly one archetype.
- Percentages never appear at family scale, avoiding fake precision (e.g. "33%" for 3 people).
- All rules are deterministic and client-computable — supports the client-first result from ADR-0001 via the shared result module.
