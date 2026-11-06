# Phase 11 — local LCD photograph fingerprints and offline file integrity

## Purpose
Enable an observer to link a **real** CASIO LCD photograph (or authorized official emulator screenshot) to a manually recorded result without uploading the image or putting its bytes inside the observation JSON.

**Zero genuine device observations are bundled.** The module cannot determine whether an image depicts a real calculator, an emulator, an altered screenshot, or something else. A SHA-256 match only demonstrates that the reviewed local file's bytes match the file previously fingerprinted.

## Browser collection (no server needed)
1. Open `tests/device.html` on a locally served copy of the repository.
2. Select a planned observation and enter the actual observed LCD text, device identification, actual date and notes. Never copy the simulator preview as the hardware answer.
3. Under **Select a local LCD photograph**, choose a PNG/JPEG/WebP image (up to 12 MiB). The browser checks the file header and selected media type, computes SHA-256 locally via Web Crypto, displays a local preview and displays the file name, byte count and hex fingerprint. It performs no network upload.
4. After recording, export the existing `fx991-device-evidence-v1` JSON. Each observation with an attached photo includes an optional `media` object of the form:

```json
{
  "media": {
    "fileName": "actual-photo-file.png",
    "mediaType": "image/png",
    "bytes": 12345,
    "sha256": "64-lowercase-hex-characters-from-the-actual-file",
    "hashAlgorithm": "SHA-256",
    "reviewStatus": "unreviewed"
  }
}
```

This is a **format illustration**, not a real observation. The actual JSON has a real 64-character hex hash generated from the user's selected file. The original photo must be retained separately and supplied to the eventual reviewer.

## Offline reviewer workflow
Place retained original images in a directory (no public upload needed), and run:

```sh
python tools/verify_reference_photos.py fx991-device-observations.json --photos ./original-reference-images --out photo-integrity-report.json
```

The verifier validates filenames, allowed image signatures and size, checks the byte count and re-computes SHA-256. It distinguishes `BYTES_MATCH`, `HASH_MISMATCH`, `SIZE_MISMATCH`, `TYPE_MISMATCH`, `FILE_MISSING`, `INVALID_METADATA`, and `NO_MEDIA_FINGERPRINT`. It exits nonzero when no fingerprinted file is available or a linked file doesn't match.

**Neither a successful browser hash nor a successful offline file check authenticates the manufacturer, provenance, physical button path, numeric fidelity or LCD pixel parity.** The report always includes `hardwareAuthenticityVerified: false` and `casioParityCertified: false`.

## Privacy and security
- No image upload, image data URI in JSON, or embedded photo bytes in exports.
- The selected browser preview uses a temporary local blob URL; it is revoked when cleared or the scenario changes. Input is intentionally file-based, not remote URL based.
- Image types: PNG, JPEG or WebP with signature checks. The 12 MiB limit avoids unexpectedly processing huge images in-browser.
- Evidence JSON stores metadata and remains self-reported. Only the literal `unreviewed` review status is accepted by the validator; 'verified' cannot be self-asserted.
- Filename path traversal is rejected for linked image metadata.
- Existing observation records without a `media` object remain valid and importable.
- Photo metadata import does not restore image bytes; separately select or supply the original file to verify its hash.

## Verification
- `tests/cases.js`: twelve unit checks for media schema, signatures, legacy import, self-certification refusal and linked filename consistency.
- `tools/tests/test_reference_photo_verification.py`: eight synthetic-only offline reviewer tests for mutation, missing files, invalid hashes, traversal and provenance boundaries.
- `tools/device_workbench_probe.py`: a generated 1×1 PNG synthetic UI fixture is selected in real Chromium, Firefox and WebKit; asserts preview, local SHA-256 and metadata-only JSON export.

No photographs or hardware readings were created or supplied as genuine CASIO evidence by these tests.
