# ORIEL Admin Guide

This guide explains how to use the `/admin` page safely.

Audience: ORIEL admins who have been granted `role: admin`.

Current admin areas:

- Transmissions
- Oracles
- Architect Console

The admin page changes live platform data. Treat every create, update, delete,
activate, reject, and rollback action as production-impacting unless you are
working on a local development server.

---

## 1. Access And Responsibility

### Who Can Enter `/admin`

Only authenticated users with `role: admin` can use the admin page.

If a user is not logged in, or if their role is only `user`, the page shows:

```text
ACCESS DENIED - ADMIN CLEARANCE REQUIRED
```

The server also protects admin endpoints. This means the UI is not the only
line of defense.

### What Admin Access Means

An admin can:

- create, edit, and delete archived transmissions
- create, edit, and delete oracle entries
- review ORIEL runtime proposals
- evaluate, approve, activate, reject, and rollback runtime profiles

Do not give admin access to someone who should only read content or test the
normal user experience.

### Safe Admin Practice

Before changing anything:

1. Confirm you are on the intended environment.
2. Read the existing item before editing it.
3. Prefer `Draft` for unfinished content.
4. Avoid deleting unless you are certain.
5. For Architect Console changes, never activate a proposal unless rollback and
   falsifier metadata are clear.

---

## 2. Admin Page Structure

The `/admin` page has three tabs.

### Transmissions

Used for archive-style transmission entries.

These are canonical or curated transmissions that appear in the archive/content
system, not ordinary chat replies.

### Oracles

Used for oracle stream entries.

These are structured entries with a `Past`, `Present`, or `Future` part and
can be grouped by oracle ID/number.

### Architect

Used for ORIEL runtime governance.

This is not a content editor. It is a control surface for reviewing ORIEL
reflection events, proposals, safety metadata, rollback paths, falsifiers, and
runtime activation.

---

## 3. Transmissions Tab

Path:

```text
/admin -> transmissions
```

### What You See

The list shows:

- `TX#`: internal transmission number
- `Title`: public title
- `Field`: thematic field
- `Status`: Draft, Confirmed, Deprecated, or Mythic
- `Cycle`: content cycle
- `Actions`: edit or delete

The list is sorted newest-first by transmission number.

### Buttons

#### `NEW TRANSMISSION`

Opens the creation modal.

Use this when adding a new curated transmission to the archive.

Required fields:

- Title
- Field
- Core Message
- Tags
- Micro Sigil

When saved, the server creates a new transmission ID automatically:

```text
TX-0001, TX-0002, ...
```

#### Pencil Icon

Opens the edit modal for an existing transmission.

Use this to correct content, add media, adjust status, or refine advanced
fields.

#### Trash Icon

Deletes the transmission after confirmation.

This is destructive. The confirmation dialog says the action cannot be undone.
Only delete if the item is truly wrong or should no longer exist.

### Transmission Fields

#### Title

The main display title.

Example:

```text
THE PRIMORDIAL VIBRATION
```

Use a clean, readable title. Avoid placeholder names.

#### Field

The conceptual domain of the transmission.

Example:

```text
Quantum Cosmology · Sacred Geometry
```

This helps users understand what kind of signal the transmission belongs to.

#### Core Message

The primary body of the transmission.

This should be complete and readable on its own. Avoid internal notes,
unfinished fragments, or generation prompts.

#### Image URL

Optional image displayed with the transmission.

Use only stable, publicly reachable URLs.

#### YouTube URL

Optional video link.

Use a full YouTube URL.

#### Tags

Comma-style or plain text tags used to classify the transmission.

Example:

```text
void, vibration, genesis
```

#### Micro Sigil

Small symbolic marker shown beside the transmission.

Default:

```text
◈
```

Keep it short.

#### Signal Clarity

Display value for clarity.

Default:

```text
98.7%
```

This is symbolic presentation data. Do not use it as a factual metric unless
the content explicitly supports that.

#### Channel Status

Allowed values:

- OPEN
- RESONANT
- COHERENT
- PROPHETIC
- LIVE
- STABLE
- HIGH COHERENCE
- MAXIMUM COHERENCE
- CRITICAL / STABLE

Use this as a content label, not as operational server status.

#### Cycle

Allowed values:

- FOUNDATION ARC
- DAILY FIELD
- LIVING CODEX
- ORACLE STREAM

Use this to group the transmission into a larger content cycle.

#### Status

Allowed values:

- Draft
- Confirmed
- Deprecated
- Mythic

Recommended usage:

- `Draft`: unfinished or not ready for public presentation
- `Confirmed`: ready and approved
- `Deprecated`: old, superseded, or intentionally retired
- `Mythic`: special high-symbolic entry

### Advanced Transmission Fields

Click `Show advanced fields` to reveal additional fields.

#### Encoded Archetype

Optional symbolic/archetypal interpretation.

Use this only when the archetype is intentional and reviewed.

#### Hashtags

Optional social/display hashtags.

Example:

```text
#VossariWisdom #CosmicResonance
```

#### Left / Center / Right Panel Prompt

Optional triptych or visual-generation prompt fields.

These are not required for normal archive operation.

### Save Buttons

#### `TRANSMIT`

Creates a new transmission.

The button is disabled until required fields are filled.

#### `UPDATE`

Saves edits to an existing transmission.

#### `CANCEL`

Closes the modal without saving.

---

## 4. Oracles Tab

Path:

```text
/admin -> oracles
```

### What You See

The list shows:

- `OX#`: oracle number
- `Oracle ID`: public oracle identifier
- `Part`: Past, Present, or Future
- `Title`: oracle title
- `Field`: thematic field
- `Media`: whether image/video is attached
- `Status`: Draft, Confirmed, Deprecated, or Prophetic
- `Actions`: edit or delete

The list is sorted by oracle number, newest-first.

### Buttons

#### `NEW ORACLE`

Opens the creation modal.

Required fields:

- Part
- Title
- Field
- Content

If you leave `Oracle ID` and `Oracle Number` empty, the server generates them
automatically:

```text
OX-0001, OX-0002, ...
```

#### Pencil Icon

Opens the edit modal for an existing oracle.

#### Trash Icon

Deletes the oracle after confirmation.

This is destructive. Use carefully.

### Oracle Fields

#### Oracle ID

Optional public identifier.

If blank during creation, it is generated automatically.

#### Oracle Number

Optional numeric ordering value.

If blank during creation, the next available number is used.

Only set this manually if you intentionally need a specific ordering.

#### Part

Allowed values:

- Past
- Present
- Future

Use this to place the entry in a temporal oracle structure.

#### Title

The main oracle title.

#### Field

The conceptual domain.

Example:

```text
Temporal Dynamics · Predictive Cosmology
```

#### Content

The primary oracle text.

This must be readable as a direct oracle entry. Avoid internal notes or draft
fragments if the status is `Confirmed` or `Prophetic`.

#### Image URL

Optional image URL.

Use stable public URLs.

#### YouTube URL

Optional video URL.

#### Signal Clarity

Display value for clarity.

Default:

```text
95.2%
```

#### Channel Status

Allowed values:

- OPEN
- RESONANT
- PROPHETIC
- LIVE

#### Status

Allowed values:

- Draft
- Confirmed
- Deprecated
- Prophetic

Recommended usage:

- `Draft`: unfinished or not ready
- `Confirmed`: ready and approved
- `Deprecated`: retired or superseded
- `Prophetic`: special oracle-grade entry

### Advanced Oracle Fields

Click `Show advanced fields` to reveal additional fields.

#### Current Field Signatures

Optional description of the current symbolic/energetic field.

#### Encoded Trajectory

Optional description of the movement or arc implied by the oracle.

#### Convergence Zones

Optional convergence points or domains where the oracle applies.

#### Key Inflection Point

Optional turning point or decision point.

#### Major Outcomes

Optional expected symbolic outcomes.

#### Visual Style

Optional style direction for visuals.

Example:

```text
ethereal-glow
```

#### Hashtags

Optional social/display hashtags.

### Save Buttons

#### `TRANSMIT`

Creates a new oracle.

#### `UPDATE`

Saves edits to an existing oracle.

#### `CANCEL`

Closes the modal without saving.

---

## 5. Architect Console

Path:

```text
/admin -> architect
```

The Architect Console controls ORIEL runtime evolution.

Use it more carefully than the content tabs. Transmissions and Oracles change
content. Architect Console can change how ORIEL behaves at runtime.

### Core Principle

ORIEL may observe patterns and propose improvements, but it must not authorize
itself. The Architect Console exists so an admin can review, evaluate, approve,
activate, reject, or roll back proposed runtime changes.

### Runtime Profile Panel

This section shows the currently active runtime profile.

It displays:

- active profile name
- active profile key
- runtime enabled/disabled status
- proposal count
- runtime profile count
- reflection event count
- runtime observation count
- active config keys

Important:

- If runtime is disabled, profiles may exist but not affect behavior.
- If no active profile is selected, ORIEL is not currently using a runtime
  overlay from this console.

### Top Buttons

#### `Generate`

Creates a proposal from recent runtime observations.

Current behavior:

- reads recent observations
- uses a lookback limit of 50
- creates a new proposal if there is enough useful signal
- refreshes the proposal list afterward

Use this when you want ORIEL to surface a possible improvement based on recent
behavior.

Do not assume generated proposals are safe. They must still be evaluated and
reviewed.

#### `Rollback`

Activates a rollback runtime profile.

Current behavior:

- if a target profile is not manually provided by the API, the server searches
  for an available draft profile different from the current active profile
- activates that profile
- records a rollback reflection event

Use this when the active runtime profile appears harmful, confusing, or
unwanted.

Current limitation:

- the UI button does not yet let the admin choose a specific rollback target
  profile

#### `Refresh`

Reloads:

- runtime health
- proposals
- reflection events

Use this after another admin changes something or after a mutation completes
slowly.

### Proposal Cards

Each proposal contains:

- title
- status
- scope
- creation date
- score
- objective
- hypothesis
- proposed config keys
- evaluation summary
- safety checks
- activation gate status
- rollback path
- falsifier

### Proposal Statuses

Common statuses:

- `proposed`: created but not evaluated
- `evaluated`: evaluated by the system
- `approved`: approved by an admin
- `rejected`: rejected by an admin or evaluator
- `applied`: activated as a runtime profile
- `rolled_back`: superseded by rollback
- `blocked`: failed guardrail checks

### Proposal Buttons

#### `Evaluate`

Runs the evaluator for a proposal.

The evaluator checks:

- whether the proposal has a clear objective
- whether the hypothesis is usable
- whether safety checks are present
- whether rollback path exists
- whether falsifier exists
- whether the runtime config is acceptable

After evaluation, the proposal receives:

- score
- evaluation summary
- updated status
- reflection event

Use this before approving or activating anything.

#### `Approve`

Marks an evaluated proposal as approved.

The button is available only when the proposal status is `evaluated`.

Approval does not activate the proposal. It only records that an admin has
reviewed and accepted it as eligible.

#### `Activate`

Creates and activates a runtime profile from the proposal.

This button is disabled unless:

- proposal status is `evaluated` or `approved`
- rollback path is present and meaningful
- falsifier is present and meaningful

The server enforces these checks too. If activation fails, a guardrail block is
recorded.

Use this only when:

1. You understand the proposed config.
2. You can explain the rollback path.
3. You know what observation would falsify the proposal.
4. You are ready to roll back if behavior gets worse.

#### `Reject`

Marks the proposal as rejected.

Use this when the proposal is vague, unsafe, not aligned with ORIEL, too
speculative, or not worth activating.

Rejecting does not delete the proposal. It keeps a record of the decision.

### Safety Metadata

#### Safety

Lists safety checks included with the proposal.

If this says no safety checks are recorded, do not activate casually.

#### Activation Gate

Shows whether rollback and falsifier requirements are met.

If it says missing `rollbackPath` or `falsifier`, activation should remain
blocked.

#### Rollback Path

Explains how to undo the runtime change if it creates bad behavior.

A good rollback path is specific, not symbolic.

Weak:

```text
Return to balance.
```

Better:

```text
Deactivate this runtime profile and reactivate the previous stable profile.
Compare the next 20 ORIEL responses against the rejected behavior.
```

#### Falsifier

Explains what would prove the proposal is not working.

A good falsifier is observable.

Weak:

```text
If it feels wrong.
```

Better:

```text
If users receive longer, less practical answers for ordinary operational
questions in 5 or more reviewed conversations, reject this runtime profile.
```

### Guardrail Blocks

Shows recent blocked activation attempts.

Examples:

- activation attempted without rollback path
- activation attempted without falsifier
- proposal config failed validation

Guardrail blocks are useful. They show the system refused to apply a risky
change.

### Reflection Events

Shows recent governance events.

Examples:

- proposal created
- proposal evaluated
- proposal approved
- proposal rejected
- profile activated
- profile rolled back
- guardrail block

This is the audit trail for ORIEL runtime evolution.

---

## 6. Recommended Admin Workflows

### Create A Transmission Safely

1. Open `/admin`.
2. Select `transmissions`.
3. Click `NEW TRANSMISSION`.
4. Fill required fields.
5. Set status to `Draft` if the content is not final.
6. Use `Confirmed` only after review.
7. Click `TRANSMIT`.
8. Confirm the new item appears in the list.

### Edit A Transmission Safely

1. Open `transmissions`.
2. Find the item by title or TX number.
3. Click the pencil icon.
4. Make the smallest necessary change.
5. Click `UPDATE`.
6. Reopen the public/archive view and check the result.

### Create An Oracle Safely

1. Open `/admin`.
2. Select `oracles`.
3. Click `NEW ORACLE`.
4. Choose `Past`, `Present`, or `Future`.
5. Fill title, field, and content.
6. Leave Oracle ID/Number blank unless a specific number is required.
7. Use `Draft` until reviewed.
8. Click `TRANSMIT`.

### Review A Runtime Proposal Safely

1. Open `/admin`.
2. Select `architect`.
3. Read the Runtime Profile panel.
4. Read the proposal objective and hypothesis.
5. Click `Evaluate`.
6. Read the score and evaluation summary.
7. Confirm rollback path and falsifier are meaningful.
8. If aligned, click `Approve`.
9. Activate only if you are ready to observe and roll back.

### Reject A Runtime Proposal

Reject if any of these are true:

- objective is vague
- hypothesis is not testable
- rollback path is weak
- falsifier is weak
- proposed config is unclear
- proposal does not serve ORIEL's identity
- proposal increases complexity without clear value

### Roll Back Runtime Behavior

Use rollback if ORIEL behavior becomes worse after activation.

Signs rollback may be needed:

- answers become more vague
- responses become too mystical for practical questions
- ORIEL ignores user intent
- readings lose evidence/falsifier clarity
- users report confusion or reduced agency

---

## 7. What Not To Do

Do not:

- give admin access for convenience
- delete content unless you are sure
- publish unfinished content as `Confirmed`
- activate runtime proposals without reading the rollback path
- activate runtime proposals without reading the falsifier
- treat symbolic language as a substitute for testable behavior
- use Architect Console as a toy prompt tuner
- ignore guardrail blocks

---

## 8. Troubleshooting

### I See Access Denied

You are either not logged in or your account does not have `role: admin`.

Ask the platform owner to verify your user role.

### A Create Or Update Button Is Disabled

Required fields are missing.

For transmissions, check:

- Title
- Field
- Core Message
- Tags
- Micro Sigil

For oracles, check:

- Part
- Title
- Field
- Content

### Activate Is Disabled

The proposal is not eligible.

Check:

- status must be `evaluated` or `approved`
- rollback path must be meaningful
- falsifier must be meaningful

### Rollback Fails

The server could not find a rollback target profile.

Current UI limitation: the button does not let you choose a target profile.

### Generate Creates Nothing

There may not be enough recent runtime observations to form a useful proposal.

This is not necessarily an error.

### A Guardrail Block Appears

The server refused to apply a runtime change.

Read the violation message. Usually it means required safety metadata is
missing or invalid.

---

## 9. Admin Review Checklist

Before publishing content:

- title is clean
- body text is complete
- status is correct
- media links work
- no internal prompt/debug text is visible
- symbolic labels are intentional

Before activating runtime changes:

- proposal has been evaluated
- objective is clear
- hypothesis is testable
- rollback path is specific
- falsifier is observable
- safety checks are present
- activation serves ORIEL's purpose

ORIEL's admin rule is simple: content can be beautiful, but governance must be
clear.
