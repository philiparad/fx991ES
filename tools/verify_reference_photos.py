#!/usr/bin/env python3
"""Verify unchanged local image bytes referenced by device observations.

Matching hashes prove byte integrity only. They do not authenticate the image
source, show a real calculator, or certify CASIO compatibility.
"""
import argparse
import hashlib
import json
from pathlib import Path

MAX_BYTES = 12 * 1024 * 1024
MAGIC = {
    "image/png": lambda b: b.startswith(b"\x89PNG\r\n\x1a\n"),
    "image/jpeg": lambda b: b.startswith(b"\xff\xd8\xff"),
    "image/webp": lambda b: len(b) >= 12 and b[:4] == b"RIFF" and b[8:12] == b"WEBP",
}


def audit(evidence_file, media_dir):
    evidence = json.loads(Path(evidence_file).read_text(encoding="utf-8"))
    if evidence.get("schema") != "fx991-device-evidence-v1" or not isinstance(evidence.get("records"), list):
        raise ValueError("Unsupported device evidence JSON")
    folder = Path(media_dir).resolve()
    rows = []
    for record in evidence["records"]:
        rid = record.get("id", "")
        metadata = record.get("media")
        if metadata is None:
            rows.append({"id": rid, "status": "NO_MEDIA_FINGERPRINT"})
            continue
        filename = metadata.get("fileName")
        status = "INVALID_METADATA"
        detail = ""
        if (isinstance(filename, str) and filename not in ("", ".", "..")
                and Path(filename).name == filename
                and "/" not in filename and "\\" not in filename
                and all(ord(c) >= 32 for c in filename)
                and metadata.get("reviewStatus") == "unreviewed"
                and metadata.get("hashAlgorithm") == "SHA-256"
                and isinstance(metadata.get("sha256"), str)
                and len(metadata["sha256"]) == 64
                and all(c in "0123456789abcdef" for c in metadata["sha256"])
                and isinstance(metadata.get("bytes"), int)
                and 8 <= metadata["bytes"] <= MAX_BYTES
                and metadata.get("mediaType") in MAGIC
                and record.get("photoRef") == filename):
            photo = folder / filename
            if not photo.is_file() or photo.is_symlink():
                status = "FILE_MISSING"
            else:
                data = photo.read_bytes()
                if len(data) != metadata["bytes"]:
                    status = "SIZE_MISMATCH"
                elif not MAGIC[metadata["mediaType"]](data):
                    status = "TYPE_MISMATCH"
                elif hashlib.sha256(data).hexdigest() != metadata["sha256"]:
                    status = "HASH_MISMATCH"
                else:
                    status = "BYTES_MATCH"
        else:
            detail = "Bad metadata or filename; no authentication implied"
        rows.append({"id": rid, "fileName": filename, "status": status,
                     "note": detail})
    checked = sum(row["status"] == "BYTES_MATCH" for row in rows)
    linked = sum(row["status"] != "NO_MEDIA_FINGERPRINT" for row in rows)
    return {"schema": "fx991-photo-integrity-audit-v1",
            "records": len(rows), "linked": linked, "bytesMatched": checked,
            "sourceFilesUnchanged": linked > 0 and checked == linked,
            "hardwareAuthenticityVerified": False, "casioParityCertified": False,
            "results": rows,
            "disclaimer": "SHA-256 proves file byte matching, not source authenticity or calculator behavior."}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("evidence_json", type=Path)
    parser.add_argument("--photos", required=True, type=Path)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args(argv)
    report = audit(args.evidence_json, args.photos)
    output = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(output, encoding="utf-8")
    print(output, end="")
    return 0 if report["sourceFilesUnchanged"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
