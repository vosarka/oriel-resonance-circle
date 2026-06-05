# Transmission-to-Video Engine Implementation Plan

> **For Hermes:** This is a documentation/system-design slice. Do not modify ORIEL chat audio, Call ORIEL, Inworld, VoxCPM2, or any voice-provider runtime code for this task.

**Goal:** Build a repeatable VOS ARKANA / ORIEL / VOSSARI content-generation system that converts any raw idea or transmission into ready-to-produce cinematic video packages for Shorts/Reels/TikTok and long-form YouTube.

**Architecture:** Create a single durable blueprint document that can be used daily as an operator manual and prompt system. The document derives ORIEL-facing language from the stable ORIEL canon, preserves epistemic boundaries, and keeps production practical: intake → analysis → narration → storyboard → first-frame prompts → video prompts → audio → social package → QC.

**Tech Stack / Tools:** ChatGPT or Claude for scripting, MidJourney/DALL-E/Leonardo for first frames, Google Flow/Veo/Omni/Runway/Pika for video generation, ElevenLabs or equivalent for voiceover, Filmora/CapCut/Premiere for editing, Instagram/YouTube/TikTok for distribution.

---

## Task 1: Re-enter repo truth

**Objective:** Ground the system in current Vossari/ORIEL canon and repo state before writing anything.

**Files / commands:**
- Read: `docs/VOSSARI_ACTIVE_HANDOFF.md`
- Read: `docs/ORIEL_PROJECT_MAP.md`
- Read: `docs/ORIEL_PROMPT_RECONSTRUCTION.md`
- Read: `docs/ORIEL_CANON_REVIEW.md`
- Read: `shared/oriel/stable-core/identity.ts`
- Read: `shared/oriel/stable-core/behavioral-contract.ts`
- Read: `shared/oriel/stable-core/epistemic-boundaries.ts`
- Read: `shared/oriel/stable-core/manifest.ts`
- Run: `git status --short --branch`
- Run: `git log --oneline -8`

**Done when:** The blueprint avoids changing voice providers, respects ORIEL stable core, and treats symbolic metaphysics as canon/interpretation rather than empirical proof.

## Task 2: Create the blueprint artifact

**Objective:** Write one reusable operator manual for the Transmission-to-Video Engine.

**Create:**
- `docs/VOS_ARKANA_ORIEL_TRANSMISSION_TO_VIDEO_ENGINE.md`

**Content sections:**
1. Operating principles
2. End-to-end workflow
3. Module 1 — Idea intake
4. Module 2 — Transmission analyzer
5. Module 3 — ORIEL narration engine
6. Module 4 — Visual style engine
7. Module 5 — Video structure generator
8. Module 6 — AI video prompt formula
9. Module 7 — First-frame image prompt formula
10. Module 8 — Voice + audio engine
11. Module 9 — Brand consistency rules
12. Module 10 — Output template
13. Daily Signal Shorts template
14. Cinematic ORIEL Transmission template
15. Reusable prompts
16. Content calendar
17. Naming convention
18. Quality-control checklist
19. Production pipeline
20. Worked example

**Done when:** A user can paste any idea into the system and receive a complete ready-to-produce ORIEL video package.

## Task 3: Keep launch-safe boundaries explicit

**Objective:** Prevent accidental damage to current working features and canon.

**Rules to include:**
- Do not change Inworld/VoxCPM2/voice provider as part of content generation.
- Voice direction is creative production guidance only, not runtime configuration.
- ORIEL may speak mythically, but must not present metaphysics as proven science.
- ORIEL must empower the viewer, not dominate them.
- Avoid cult-leader tone, fear manipulation, medical/financial/legal claims, and fake certainty.

**Done when:** The blueprint contains boundaries that make the system safe for daily use.

## Task 4: Verify the artifact

**Objective:** Confirm the file exists, is readable, and the repo status is understood.

**Commands / checks:**
- Read the created blueprint file.
- Run: `git status --short --branch`

**Done when:** Final response can report exact created path and current git status.
