"""Offline photo-byte integrity checks; synthetic test data only."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from verify_reference_photos import audit


class ReferencePhotoVerifierTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.photos = self.root / "photos"
        self.photos.mkdir()
        self.image = b"\x89PNG\r\n\x1a\n" + b"synthetic-fixture-only"
        (self.photos / "fixture.png").write_bytes(self.image)
        self.record = {"id":"synthetic-not-a-device","photoRef":"fixture.png",
                       "media":{"fileName":"fixture.png","mediaType":"image/png",
                                "bytes":len(self.image),
                                "sha256":hashlib.sha256(self.image).hexdigest(),
                                "hashAlgorithm":"SHA-256","reviewStatus":"unreviewed"}}
        self.file = self.root / "evidence.json"
        self.write()

    def write(self):
        self.file.write_text(json.dumps({"schema":"fx991-device-evidence-v1",
                                         "records":[self.record]}),encoding="utf-8")

    def test_matching_bytes_never_authenticates_origin(self):
        report = audit(self.file,self.photos)
        self.assertTrue(report["sourceFilesUnchanged"])
        self.assertEqual(report["bytesMatched"],1)
        self.assertFalse(report["hardwareAuthenticityVerified"])
        self.assertFalse(report["casioParityCertified"])

    def test_photo_content_mutation_detected(self):
        (self.photos / "fixture.png").write_bytes(self.image + b"t")
        result=audit(self.file,self.photos)
        self.assertEqual(result["results"][0]["status"],"SIZE_MISMATCH")

    def test_digest_mutation_detected(self):
        self.record["media"]["sha256"]="0"*64
        self.write()
        self.assertEqual(audit(self.file,self.photos)["results"][0]["status"],"HASH_MISMATCH")

    def test_missing_media_file_detected(self):
        (self.photos / "fixture.png").unlink()
        self.assertEqual(audit(self.file,self.photos)["results"][0]["status"],"FILE_MISSING")

    def test_metadata_without_file_does_not_claim_verification(self):
        self.record.pop("media")
        self.write()
        result=audit(self.file,self.photos)
        self.assertFalse(result["sourceFilesUnchanged"])
        self.assertEqual(result["linked"],0)

    def test_path_traversal_refused(self):
        self.record["media"]["fileName"]="../fixture.png"
        self.record["photoRef"]="../fixture.png"
        self.write()
        self.assertEqual(audit(self.file,self.photos)["results"][0]["status"],"INVALID_METADATA")

    def test_self_certified_status_refused(self):
        self.record["media"]["reviewStatus"]="verified"
        self.write()
        self.assertEqual(audit(self.file,self.photos)["results"][0]["status"],"INVALID_METADATA")

    def test_invalid_document_schema_refused(self):
        self.file.write_text(json.dumps({"schema":"other","records":[]}))
        with self.assertRaises(ValueError):
            audit(self.file,self.photos)


if __name__=="__main__":
    unittest.main()
