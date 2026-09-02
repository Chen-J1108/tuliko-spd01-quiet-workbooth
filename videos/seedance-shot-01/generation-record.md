# Seedance Shot 01 generation record

## Target

- Endpoint: `ep-20260805110319-ct42l`
- Bound model: `doubao-seedance-2-0-fast-260128`
- Modality: multimodal image-to-video
- Requested output: 8 seconds, 16:9, 720P
- Source product: `public/assets/products/spd01-green-transparent.webp`
- Prepared first frame: `shot-01-first-frame-720.jpg` (1280 × 720, JPEG, yuvj420p)

## Validation

- Ark authentication: active
- Endpoint status: Running
- Endpoint modality: video
- Model lifecycle: Published
- Model limits: 480P/720P, 4–15 seconds, 24 fps
- Request dry run: passed
- Input frame probe: passed

## Attempts

1. `cgt-20260807152539-d794g`
   - Input: 1920 × 1080 PNG first frame
   - Audio: enabled
   - Result: `failed / InternalServiceError`
2. `cgt-20260807152732-l6j2l`
   - Input: 1280 × 720 RGB JPEG first frame
   - Audio: endpoint default remained enabled
   - Result: `failed / InternalServiceError`
3. `cgt-20260807152959-hpfxl`
   - Input: 1280 × 720 RGB JPEG first frame
   - Audio: explicitly disabled
   - Prompt: shortened preview prompt
   - Result: `failed / InternalServiceError`
4. `cgt-20260807160126-qrn9d`
   - Input: 854 × 480 RGB JPEG first frame
   - Output request: 4 seconds, 480P, 16:9
   - Audio: explicitly disabled
   - Prompt: minimal 216-character product-and-ring prompt
   - Result: `failed / InternalServiceError`

The same terminal service error persisted after removing alpha, reducing the source frame and output to 480P, reducing duration to the minimum 4 seconds, shortening the prompt, and disabling audio. No MP4 was produced. Further paid-task retries were stopped.

## Fresh Endpoint verification

- Created Endpoint: `ep-20260807160822-zk8q2`
- Endpoint name: `snapod-seedance-fast-20260807`
- Bound model: `doubao-seedance-2-0-fast-260128`
- Region: `cn-beijing`
- Endpoint status before submission: `Running`
- Endpoint generation modality: `video`
- Model access validation: passed without warnings

5. `cgt-20260807160922-x56mk`
   - Endpoint: newly created `ep-20260807160822-zk8q2`
   - Input: `shot-01-first-frame-480.jpg` (854 × 480 JPEG)
   - Output request: 4 seconds, 480P, 16:9
   - Audio: explicitly disabled
   - Prompt: `shot-01-prompt-minimal.txt`
   - Lifecycle: `queued` → `running` → `failed`
   - Result: `InternalServiceError` / `The service encountered an unexpected internal error.`
   - Usage returned by the task API: `{}`

The fresh Endpoint accepted and started the task, but the same terminal internal service error occurred. Ark doctor classifies this as an internal Ark error and recommends an attenuated retry or a support ticket with the request/task identifier. No automatic retry was submitted, and no MP4 was produced. Endpoint telemetry diagnostics could not be queried because VMP is not enabled for this account.

## Retry after ArkCLI update

- ArkCLI version: `1.0.13`
- Endpoint: `ep-20260807160822-zk8q2`
- Bound model: `doubao-seedance-2-0-fast-260128`
- Endpoint status before submission: `Running`
- Endpoint/model access validation: passed without warnings
- Source frame probe: 854 × 480 MJPEG/JPEG, `yuvj420p`

6. `cgt-20260807162512-qm99f`
   - Output request: 4 seconds, 480P, 16:9
   - Audio: explicitly disabled
   - Lifecycle: `queued` → `running` → `failed`
   - Result: `InternalServiceError` / `The service encountered an unexpected internal error.`
   - Usage returned by the task API: `{}`

Updating ArkCLI from `1.0.11` to `1.0.13` did not change the terminal service error. No further automatic task was submitted, and no MP4 was produced.

## Retry after API Key rebind

- API Key/profile refresh: succeeded
- Endpoint access validation: passed without warnings
- Endpoint: `ep-20260807160822-zk8q2`
- Bound model: `doubao-seedance-2-0-fast-260128`

7. `cgt-20260807163104-5f5xj`
   - Output request: 4 seconds, 480P, 16:9
   - Audio: explicitly disabled
   - Lifecycle: `queued` → `running` → `failed`
   - Result: `InternalServiceError` / `The service encountered an unexpected internal error.`
   - Usage returned by the task API: `{}`

Rebinding and validating the API Key did not change the terminal service error. The task returned no video URL, no MP4 was downloaded, and no frame-level quality inspection was possible. No automatic retry was submitted.

## Successful 8-second generation after API reconnection

8. `cgt-20260807164755-qjcl9`
   - Source product: `SPD01-灰绿-v2-¾.webp`
   - Prepared first frame: `shot-01-spd01-v2-first-frame-720.jpg` (1280 × 720, RGB JPEG)
   - Prompt: `shot-01-spd01-v2-prompt.txt`
   - Endpoint: `ep-20260807160822-zk8q2`
   - Model: `doubao-seedance-2-0-fast-260128`
   - Output request: 8 seconds, 720P, 16:9
   - Audio: enabled
   - Lifecycle: `queued` → `running` → `succeeded`
   - Local output: `cgt-20260807164755-qjcl9.mp4`
   - Usage returned by task API: 173700 completion tokens / 173700 total tokens

### Technical QA

- Container: MP4
- Video: H.264, 1280 × 720, 24 fps, yuv420p
- Duration: 8.096 seconds
- Audio: AAC, 32 kHz, stereo
- File size: 3,750,624 bytes
- Audio envelope: start mean -30.2 dB, middle mean -14.4 dB, final segment mean -67.7 dB; the requested end fade is present.

### Visual QA

- Passed: one SPD01 product only; gray-green side panel, black frame, gray acoustic interior, white desk, green seat and dark base remain recognizable and broadly stable.
- Passed: no text, subtitle, logo, watermark, smoke, sparks, explosion or city background.
- Passed: the colored ring system is generated behind the product, and the camera performs a restrained push-in.
- Partial: the first seconds retain a visible rectangular floor/background patch from the supplied product render.
- Partial: the model adds a cyan status/power icon to the lower side panel and small colored indicator lights inside the right frame; these are not present in the source image.
- Partial: the later glass reflection becomes a strong white vertical strip, more intense than the requested restrained reflection.
- Verdict: technically valid and suitable as a first preview, but not a strict product-lock final because of the added indicator details and early background patch.

Representative frames are stored in `qa-cgt-20260807164755-qjcl9` at 0.2 s, 2.5 s, 5.5 s and 7.5 s. No paid regeneration was submitted automatically after QA.
