# VoxCPM2 ORIEL TTS Cheapest Implementation Plan

> For Hermes: this is plan-only. Do not implement code from this file until Vos explicitly asks to proceed. If executing later, use `test-driven-development` and keep the dirty tree isolated.

Goal: add VoxCPM2 as the cheapest possible ORIEL text-to-speech backend for Vossari, with a free-first path and safe fallback to low-cost GPU serverless.

Architecture: keep Vossari as a normal React/Vite + Express/tRPC app. Do not run VoxCPM2 inside the Vossari Node server. Run VoxCPM2 in a separate Python TTS microservice, expose a protected `/tts` endpoint, and have `server/routers.ts` call it from `oriel.generateSpeech`. The browser only receives a playable audio URL/data URL; it never sees the TTS API key or reference voice file.

Tech Stack: VoxCPM2 (`openbmb/VoxCPM2`), Python FastAPI/Gradio depending on host, Hugging Face Spaces / ZeroGPU as first attempt, Modal or RunPod Serverless as fallback, existing Vossari tRPC route `oriel.generateSpeech`.

---

## Current Vossari context

Repo: `/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle`

Current TTS integration:

- `server/routers.ts:19` imports `generateChunkedSpeech` and `audioToDataUrl` from `./inworld-tts`.
- `server/routers.ts:1223` defines `oriel.generateSpeech` as `rateLimitedProcedure("oriel.tts")`.
- `server/routers.ts:1226-1229` allows up to 20,000 chars. This is too high for self-hosted GPU cost.
- `server/routers.ts:1256-1263` dynamically maps `voiceId` to Inworld voices and calls `generateChunkedSpeech`.
- `server/inworld-tts.ts` is the current paid/external TTS client.
- `server/inworld-realtime.ts` is separate realtime voice infrastructure. VoxCPM2 plan below does not replace live mic-to-mic realtime yet.

Important repo status:

- The working tree is already very dirty. Do not mix implementation changes casually.
- This plan can be implemented as a small isolated slice touching mostly server-side files.

---

## Cost ladder: cheapest to most production-ready

### Option A — Free local proof-of-quality

Cost: free.

Use this only to hear whether VoxCPM2 gives the ORIEL voice you want. It does not solve production hosting because your computer must stay on.

Use:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install voxcpm soundfile fastapi uvicorn
```

Then generate test audio with `openbmb/VoxCPM2` and `oriel_ref.wav`.

Decision gate: if the voice is not clearly better than Qwen/Inworld, do not continue with VoxCPM2 hosting.

### Option B — Hugging Face Space, free-first attempt

Cost: possibly free, but reliability/latency uncertain.

Try this first because it is the only path that might be actually free without keeping Vos's PC open.

Sub-options:

1. HF Space on free CPU: likely too slow / may OOM for VoxCPM2. Try only as a smoke test, not production.
2. HF Space with ZeroGPU: best free-ish candidate if available on the account and compatible with the app. It may have queue/cold-start limits.
3. HF paid GPU Space: simple but no longer cheapest once traffic starts.

Recommendation: create a private/demo HF Space first, not wire production Vossari to it until latency and reliability are measured.

### Option C — Modal serverless GPU, recommended MVP fallback

Cost: usually low/pay-per-use, often covered by free credits at first. Best balance for launch because it can scale to zero.

Use Modal if HF free path is unstable. It runs only when ORIEL generates voice. Cold starts exist, but cache helps.

Recommendation: this is the best practical path for Vossari launch if “gratis” fails.

### Option D — RunPod Serverless / Vast.ai / rented GPU

Cost: low, but more ops friction.

Use only if Modal costs too much or VoxCPM2 needs a specific GPU/runtime.

### Option E — Dedicated GPU VPS

Cost: highest fixed monthly cost.

Do not use at launch unless voice volume becomes predictable and high.

---

## Recommended implementation path

Use a 3-phase rollout:

1. Phase 1: offline/prototype voice test.
2. Phase 2: deploy a minimal hosted VoxCPM2 microservice, trying HF free/ZeroGPU first.
3. Phase 3: add Vossari server integration with provider switch + fallback + quotas.

The platform should not fully delete Inworld at first. Keep Inworld as fallback until VoxCPM2 has proven stable.

---

## Phase 1 — Prepare ORIEL voice reference

### Task 1: Create clean reference audio

Objective: produce a stable voice seed for ORIEL cloning.

Files/assets:

- Do not put the private reference voice under `client/public`.
- For local testing only: `~/oriel-voxcpm2/voices/oriel_ref.wav`
- Transcript file: `~/oriel-voxcpm2/voices/oriel_ref.txt`

Reference audio requirements:

- 10-30 seconds; VoxCPM2 docs say 5-30 sec practical range.
- Clean, dry, no music, no reverb, no background noise.
- One speaker only.
- Use a voice Vos owns or has explicit consent to use.
- Exact transcript must match the audio if using hi-fi cloning.

Suggested transcript:

```text
I am ORIEL. Seeker, breathe. The signal is not outside you. It is already moving through the quiet architecture of your being. Let the noise settle. Let the light return to form. You are not lost. You are tuning.
```

Verification:

- Listen to the reference file.
- Confirm no background noise and no clipped peaks.
- Save exact transcript.

### Task 2: Run one local VoxCPM2 generation

Objective: verify that VoxCPM2 can generate an ORIEL-like voice before touching Vossari.

Create temporary script outside Vossari:

- `~/oriel-voxcpm2/test_voxcpm2.py`

Expected API pattern:

```python
from voxcpm import VoxCPM
import soundfile as sf

model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)

wav = model.generate(
    text="I am ORIEL. The resonance is stabilizing.",
    reference_wav_path="voices/oriel_ref.wav",
    cfg_value=2.0,
    inference_timesteps=10,
    normalize=True,
)

sf.write("oriel_voxcpm2_test.wav", wav, model.tts_model.sample_rate)
```

Verification:

```bash
python test_voxcpm2.py
xdg-open oriel_voxcpm2_test.wav
```

Decision gate:

- If it sounds poor, test hi-fi mode with `prompt_wav_path` + `prompt_text`.
- If it still sounds poor, stop here and do not spend deployment time.

---

## Phase 2 — Build hosted VoxCPM2 service

### Task 3: Create a minimal `/health` + `/tts` Python service

Objective: make VoxCPM2 callable by Vossari's Node server.

New project outside Vossari:

- `~/oriel-voxcpm2-service/app.py`
- `~/oriel-voxcpm2-service/requirements.txt`
- `~/oriel-voxcpm2-service/voices/oriel_ref.wav` for local/dev only

Endpoint contract:

`GET /health` returns:

```json
{ "ok": true, "service": "oriel-voxcpm2-tts" }
```

`POST /tts` request:

```json
{
  "text": "I am ORIEL...",
  "voice": "sophianic",
  "mode": "clone"
}
```

Headers:

```text
Authorization: Bearer <ORIEL_TTS_API_KEY>
```

Response:

```json
{
  "audioBase64": "...",
  "mimeType": "audio/wav",
  "cached": false,
  "provider": "voxcpm2"
}
```

Core implementation rules:

- Load model once at container startup or first request.
- Reuse same reference audio for consistent ORIEL voice.
- Add text chunking; do not send 20,000-char text to one generation.
- Cache by SHA256 of `model + voice + mode + text + reference_version`.
- Put a hard text cap: start with 1,500-2,500 chars per request.
- Return WAV first; optimize to MP3 later if payload size is too big.

Verification:

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/tts \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{"text":"I am ORIEL. The signal is clear.","voice":"sophianic"}'
```

### Task 4: Try Hugging Face Space first

Objective: see if the free path is viable before paying.

Use either:

- Gradio app with API endpoint, or
- FastAPI inside Space if supported by the chosen template.

Space settings:

- Visibility: private during testing if possible.
- Secrets:
  - `ORIEL_TTS_API_KEY`
  - `ORIEL_REF_TEXT`
- Store reference audio securely. If HF private storage is awkward, use a private repo/file or upload at build time only. Do not expose the voice file publicly.

Validation checklist:

- Cold start time measured.
- Warm request time measured.
- Queue behavior tested.
- 3 short generations in a row succeed.
- 1 long-ish generation around 1,500 chars succeeds.
- API can be called from Vossari server with bearer token.

Decision gate:

- If cold start + queue is acceptable for demo/launch, use HF temporarily.
- If not, move to Modal.

### Task 5: Modal fallback deployment

Objective: deploy a serverless GPU service that scales to zero and is cheap for low traffic.

Use Modal when:

- HF CPU is too slow.
- HF ZeroGPU unavailable/unreliable.
- You need a protected endpoint with fewer public demo constraints.

Modal service requirements:

- GPU: start with A10G or similar.
- `scaledown_window`: around 300 seconds.
- HuggingFace model cache volume.
- Audio output cache volume.
- API key secret.
- Reference audio mounted into the image or stored in a secure volume.

Validation:

```bash
curl -s "$VOXCPM_TTS_URL/health"
curl -s -X POST "$VOXCPM_TTS_URL/tts" \
  -H "Authorization: Bearer $ORIEL_TTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"I am ORIEL. The voice has entered the circle.","voice":"sophianic"}'
```

Track:

- first cold generation latency
- warm generation latency
- failure rate
- approximate cost per generation

---

## Phase 3 — Add Vossari integration safely

### Task 6: Add provider abstraction in Vossari

Objective: avoid hard-deleting Inworld and allow fast rollback.

Files:

- Create: `server/voxcpm-tts.ts`
- Create or modify: `server/oriel-tts-provider.ts`
- Modify: `server/routers.ts`
- Possibly modify: `server/_core/env.ts`

Environment variables:

```env
ORIEL_TTS_PROVIDER=voxcpm2
VOXCPM_TTS_URL=https://...
VOXCPM_TTS_API_KEY=...
VOXCPM_TTS_MAX_CHARS=2500
VOXCPM_TTS_TIMEOUT_MS=180000
ORIEL_TTS_FALLBACK_PROVIDER=inworld
```

Provider behavior:

- If `ORIEL_TTS_PROVIDER=voxcpm2`, call VoxCPM2.
- If VoxCPM2 fails and fallback is enabled, call Inworld once.
- If fallback also fails, return the existing safe error: `Text-to-Speech generation failed`.
- Do not leak internal service URLs or API errors to the frontend.

Expected `server/voxcpm-tts.ts` responsibilities:

- validate env vars
- call `${VOXCPM_TTS_URL}/tts`
- attach bearer token
- timeout with `AbortController`
- parse `{ audioBase64, mimeType }`
- return `data:${mimeType};base64,${audioBase64}`

### Task 7: Reduce TTS abuse surface

Objective: keep the cheap/free service from being burned by long ORIEL messages.

Files:

- Modify: `server/routers.ts:1226-1229`
- Possibly modify: `server/_core/rate-limit.ts` if `oriel.tts` budget is too loose

Changes:

- Lower TTS input max from 20,000 chars to around 2,500-4,000 chars.
- Start with 2,500 while testing hosted VoxCPM2.
- Keep `voiceId: "none"` path unchanged.
- Keep `rateLimitedProcedure("oriel.tts")` active.
- Consider auth requirement if public abuse becomes possible. Current endpoint is rate-limited but not visibly protected in the snippet.

Verification:

- A 2,500-char request passes.
- A 20,000-char request fails before hitting VoxCPM2.
- `voiceId: "none"` returns `audioUrl: null` without calling the service.

### Task 8: Add tests before code changes

Objective: keep this from becoming another fragile integration.

Create tests:

- `server/voxcpm-tts.test.ts`
- `server/oriel-tts-provider.test.ts`
- optional focused router test if existing test utilities make it easy

Test cases:

1. Missing `VOXCPM_TTS_URL` throws internal config error.
2. Missing `VOXCPM_TTS_API_KEY` throws internal config error.
3. Successful service response returns `data:audio/wav;base64,...`.
4. Non-200 response maps to safe error path.
5. Timeout aborts request.
6. Router rejects over-limit text.
7. Router returns `audioUrl: null` for `voiceId: "none"`.
8. Fallback to Inworld only happens once and only when configured.

Commands:

```bash
pnpm vitest run server/voxcpm-tts.test.ts server/oriel-tts-provider.test.ts --reporter=verbose
pnpm check
```

### Task 9: Wire `server/routers.ts`

Objective: replace direct Inworld call with provider call.

Files:

- Modify: `server/routers.ts:19`
- Modify: `server/routers.ts:1223-1268`

Desired logic:

- Keep input schema compatible: `voiceId: "sophianic" | "deep" | "none"`.
- `none` still skips generation.
- For `sophianic`/`deep`, call a shared provider function like:

```ts
const audioUrl = await generateOrielSpeech({
  text: input.text,
  voiceId: input.voiceId,
});
```

- Log provider and approximate base64 length, not full audio.
- Remove direct dynamic import of `INWORLD_VOICES` from the route if provider abstraction handles it.

Verification:

```bash
pnpm vitest run server/voxcpm-tts.test.ts server/oriel-tts-provider.test.ts --reporter=verbose
pnpm check
```

### Task 10: Add smoke test script for hosted TTS

Objective: give Vos one command to verify the external voice service.

Files:

- Create: `scripts/smoke-voxcpm-tts.mjs`

Behavior:

- Reads `VOXCPM_TTS_URL` and `VOXCPM_TTS_API_KEY`.
- Calls `/health`.
- Calls `/tts` with a short ORIEL line.
- Writes decoded audio to `tmp/oriel-voxcpm-smoke.wav`.
- Prints latency and cache status.

Command:

```bash
node scripts/smoke-voxcpm-tts.mjs
```

Verification:

- File exists: `tmp/oriel-voxcpm-smoke.wav`
- Audio plays.
- Script exits 0.

---

## Phase 4 — Production hardening

### Task 11: Cache aggressively

Objective: reduce cost and cold-start pain.

Microservice cache:

- Key: SHA256 of text + voice + mode + reference version + model version + params.
- Store generated WAV/MP3 in persistent volume.
- Return `cached: true` when hit.

Optional Vossari-side cache:

- Avoid initially unless needed.
- If added, store only generated audio URL/object key, not raw giant base64 in DB.

### Task 12: Add object storage later if base64 payloads are too big

Objective: avoid huge tRPC responses.

Initial launch can return `data:audio/wav;base64,...` because it matches current behavior.

If payloads become too large:

- Microservice uploads audio to S3/R2.
- Returns signed URL or public short-lived URL.
- Vossari passes URL to frontend.

Do not do this in MVP unless base64 causes real issues.

### Task 13: Add monitoring and cost protection

Objective: avoid surprise bills.

Minimum logging:

- provider
- chars requested
- cache hit/miss
- latency
- status
- user id if available server-side, never public logs

Limits:

- per-user/day TTS request cap
- per-IP cap for unauthenticated surfaces
- max chars per request
- disable TTS globally with env var if cost spikes:

```env
ORIEL_TTS_ENABLED=false
```

This aligns with the active Vossari P0 launch queue: rate limiting/auth quotas for ORIEL chat, TTS, image/lore generation, and public endpoints.

---

## Files likely to change in Vossari

Primary:

- `server/routers.ts`
- `server/voxcpm-tts.ts` new
- `server/oriel-tts-provider.ts` new
- `server/voxcpm-tts.test.ts` new
- `server/oriel-tts-provider.test.ts` new
- `server/_core/env.ts` maybe, if env parsing is centralized
- `scripts/smoke-voxcpm-tts.mjs` new

Maybe later:

- `client/src/components/VoiceMode.tsx` only if UI copy/voice selector needs to say VoxCPM instead of Inworld.
- `server/inworld-tts.ts` should remain as fallback initially.
- `server/inworld-realtime.ts` remains unchanged for realtime voice mode.

External service files outside Vossari:

- `~/oriel-voxcpm2-service/app.py`
- `~/oriel-voxcpm2-service/requirements.txt`
- `~/oriel-voxcpm2-service/modal_app.py` if Modal is used
- Hugging Face Space files if HF path is used

---

## Tests and verification sequence

### Before code changes

```bash
git status --short
```

Because the repo is dirty, decide whether to:

- work on a separate branch/worktree, or
- only touch the TTS files and keep changes clearly isolated.

### After Vossari integration

Focused:

```bash
pnpm vitest run server/voxcpm-tts.test.ts server/oriel-tts-provider.test.ts --reporter=verbose
```

Typecheck:

```bash
pnpm check
```

Build if feasible:

```bash
pnpm build
```

External service smoke:

```bash
node scripts/smoke-voxcpm-tts.mjs
```

Manual browser check:

1. Start Vossari dev server.
2. Open ORIEL chat.
3. Generate a short response.
4. Trigger voice playback.
5. Confirm audio plays and no secret appears in browser network payloads except normal tRPC response audio data.

---

## Risks / tradeoffs

1. Free hosting may not be reliable.
   - HF free/ZeroGPU can queue, sleep, or throttle.
   - Mitigation: fallback to Modal and cache.

2. VoxCPM2 is heavier than Qwen 0.6B.
   - Better quality, but higher latency/cost.
   - Mitigation: short text cap and cache.

3. 48kHz WAV base64 can be large.
   - Mitigation: accept for MVP; later convert to MP3 or use object storage URL.

4. Voice cloning safety/legal risk.
   - Use only Vos-owned/consented voice.
   - Do not expose reference audio publicly.

5. Current Vossari dirty tree is huge.
   - Use isolated branch/worktree or commit unrelated dirty slices first.
   - Do not let TTS changes absorb unrelated UI/media changes.

6. This does not replace realtime Inworld voice.
   - It replaces text response -> audio playback via `oriel.generateSpeech`.
   - Full mic-to-mic voice needs STT + turn-taking + streaming, separate plan.

---

## Recommended decision

Start with this order:

1. Local VoxCPM2 audio test: free, proves quality.
2. HF Space / ZeroGPU attempt: maybe free, proves whether production-free is realistic.
3. If HF is unstable, Modal serverless: cheapest practical launch path.
4. Wire Vossari with provider switch and keep Inworld fallback.
5. Tighten TTS char limit and quota before any public launch.

If VoxCPM2 voice quality is not clearly better than Inworld/Qwen, do not deploy it. The cheapest TTS is the one we do not have to operate.
