# Parents Day Digital Experience

A QR-based, one-off foyer experience where family members each take a 1-minute quiz on their phone, receive a Malaysian-inspired "love style," and see individual, family, and community results revealed live on a foyer LED screen.

## Language

### People & families

**Participant**:
One person who takes the quiz and receives a love style. Anonymous — no account, known only for the duration of the event.
_Avoid_: User, player, guest

**Family**:
A group of Participants linked together to produce a shared Family Love Mix. Uniquely identified by its Family Code, not its name.
_Avoid_: Family group, household, team

**Family Code**:
The short, server-minted, confusion-safe code (e.g. `TAN-K7`) that uniquely identifies a Family and is entered or scanned to join it.
_Avoid_: Family ID, join code, PIN

**Family Name**:
The human-readable display label for a Family (e.g. "The Tan Family"), shown on phones and the LED. Not unique — two families may share a name.
_Avoid_: Family display name, family group name

**Role**:
The family relationship a Participant selects: Parent, Child, Grandparent, Guardian, or Other. Parent, Grandparent, and Guardian are "parent-figures"; Child is a "child".
_Avoid_: Relationship, type, category

**Selfie**:
An optional photo a Participant may take at the profile step; always skippable. Stored privately and shown with their Reveal on the LED.
_Avoid_: Photo, avatar, headshot

### The quiz & results

**Quiz**:
The fixed set of five forced-choice questions (each with options A–E) that produces a Participant's Love Style in about a minute.
_Avoid_: Survey, test, questionnaire

**Love Style**:
One of the five fixed results a Participant can receive — Sayang Words, Lepak Love, Help-Help Love, Tapau Love, or Warm Hug Love. Each corresponds to one quiz answer letter (A–E).
_Avoid_: Love language, love type, result category

**Primary Love Style**:
The single Love Style a Participant resolves to after tie-breaking — the only style counted in the community dashboard and the Family Love Mix.
_Avoid_: Main style, dominant style, top result

**Family Love Mix**:
The blend of member Primary Love Styles within a Family — the counts across the five styles plus a Family Archetype headline. Requires at least two members.
_Avoid_: Love language, family result, family blend

**Family Archetype**:
The headline label over a Family Love Mix: Dominant Family, Parent-Child Contrast, Rojak Love Family, or Two-Way.
_Avoid_: Family type, family category

**Rojak Love**:
The all-mixed result — an individual whose five answers are all different, or a Family spanning three or more styles (the Rojak Love Family archetype).
_Avoid_: Mixed love, balanced, campur

### The LED screen

**Submission**:
A Participant's completed quiz posted to the server (their Primary Love Style plus name, role, and family) — the unit the LED reveals and the aggregates count.
_Avoid_: Entry, answer, response

**Reveal**:
An LED animation presenting a result — an Individual Reveal (one Participant) or a Family Reveal (a Family Love Mix).
_Avoid_: Animation, card flip, show

**Community Dashboard**:
The LED aggregate view — live counts and percentages across the five Love Styles for the whole event.
_Avoid_: Leaderboard, stats screen, counter

**Photo Moment**:
An LED spotlight of one Family (name and mix) inviting them to gather in front of the screen and take a photo.
_Avoid_: Photo booth, snapshot

**Idle Loop**:
The LED default state — QR code plus instructions — shown when there is no recent activity.
_Avoid_: Screensaver, welcome loop, standby

### Operations

**Admin**:
The single operator console (shared-secret gated) that starts and stops the event, controls the LED mode, removes items, and resets data. One shared login, no roles.
_Avoid_: Dashboard, backend, moderator, console
