# Roadmap — Love Revealed (M001)

> Vertical tracer-bullet slices decomposed from `docs/SPEC.md`. Each slice cuts
> end-to-end and is demoable on its own. `depends:[]` = can start immediately.

## Vision

A one-off, QR-based foyer experience where each person takes a 1-minute Quiz,
gets a Malaysian-inspired Love Style, links into a Family, and sees individual,
family, and community results revealed live on a foyer LED — then it's wiped.

## Success criteria

- A person can go scan → quiz → result in ~60–90s, result computed on-device.
- Two+ phones link into one Family and see a live Family Love Mix.
- The LED reveals individuals, family mixes, and a rolling community dashboard live.
- An operator can drive the LED, remove items, and reset all data.
- Whole thing runs on Vercel + Upstash Redis, no accounts, throwaway.

## Slices

- [ ] **S01: Scoring engine (pure, shared)** `risk:high` `depends:[]`
  > After this: `bun test` proves every tie shape, primary-only counts, family mix counts, and all four archetypes with correct precedence.
- [ ] **S02: Design-system component kit + gallery** `risk:medium` `depends:[]`
  > After this: `/design-system` renders every token, primitive, love-badge, and the four animation behaviors (scaling, fit-text, split-reveal, odometer, traced script).
- [ ] **S03: Redis data layer (repository + fake)** `risk:high` `depends:[]`
  > After this: repository tests prove idempotent retake, family create/join with cap 10, and live counter integrity against a Redis and an in-memory fake.
- [ ] **S04: Mobile quiz → client-first result** `risk:high` `depends:[S01,S02]`
  > After this: on a phone, answer 5 questions and get your Love Style reveal instantly, even offline.
- [ ] **S05: Family create/join + Family Love Mix** `risk:medium` `depends:[S03,S04]`
  > After this: two phones join one Family Code (typed or join-QR + confirm) and both see the live Family Love Mix with its archetype headline.
- [ ] **S06: Submit to server + community aggregation** `risk:medium` `depends:[S03,S04]`
  > After this: submitting records to Redis (best-effort retry) and the five community counts update.
- [ ] **S07: LED display + orchestrator** `risk:high` `depends:[S03,S06]`
  > After this: `/led` polls and runs idle → individual reveals → family reveals → rolling community dashboard → photo moment, draining a flood gracefully.
- [ ] **S08: Admin console + shared-secret auth** `risk:medium` `depends:[S03,S07]`
  > After this: staff reach `/admin` + `/led` behind a shared secret, flip LED mode, force a reveal, remove an item, and reset all data; participant routes stay open.
- [ ] **S09: Integration + reliability pass** `risk:high` `depends:[S04,S05,S06,S07,S08]`
  > After this: full foyer run — scan → quiz → family → LED reveal → dashboard → admin control; LED never blanks/resyncs; `sin1` config; `prefers-reduced-motion` respected.

## Wave / dependency order

- **Wave 1 (parallel):** S01, S02, S03 — no dependencies.
- **Wave 2:** S04 (needs S01, S02).
- **Wave 3 (parallel):** S05, S06 (both need S04; S03 ready).
- **Wave 4:** S07 (needs S06, S03).
- **Wave 5:** S08 (needs S07).
- **Wave 6:** S09 (integration — needs all).

## Key risks

- Scoring correctness (ties/archetypes) — retired first in S01 via exhaustive tests.
- Real-time-feel on serverless via polling — proven in S07.
- Cross-device family linking under event conditions — proven in S05.
- Animation performance on older phones — traced script pre-generated at build (SPEC).

## Proof strategy

- **Pure logic** (S01, orchestrator reducer in S07): exhaustive unit tests.
- **Data** (S03): repository tests against Redis + in-memory fake.
- **API** (S06): integration tests on route-handler contracts.
- **Experience** (S04, S05, S07): manual/browser smoke of the demo line.
- **Whole** (S09): end-to-end foyer simulation.

## Definition of done

- Every slice's demo line is observable.
- `bun run build` and typecheck are green.
- Scoring + data + orchestrator seams are covered by tests.
- No accounts/persistence beyond the event; admin reset wipes Redis + Blob.

## Boundary map

- **S01 → S04, S05, S06, S07:** produces `scoreQuiz(answers)` → `{primary, hybrid, display}` and `familyMix(members)` → `{counts, archetype}`; consumers import the shared module (never re-implement).
- **S03 → S05, S06, S07, S08:** produces a repository interface (`recordSubmission`, `createFamily`, `joinFamily`, `familyById`, `aggregates`, `reset`) over Upstash Redis + an in-memory fake for tests.
- **S02 → S04, S05, S07, S08:** produces the component kit (primitives + animation wrappers) consumed by every UI surface; the love-style visual map is the single source for icon/color.
- **S06 → S07:** produces the submission log + community aggregates the LED polls.
- **S07 → S08:** produces the LED mode/state the admin drives.
