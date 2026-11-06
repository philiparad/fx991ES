#!/usr/bin/env python3
"""Phase 8: browser test of device-observation workbench; NO hardware claims.

Temporary synthetic fixtures are created only inside isolated browser contexts.
They are never exported as user or CASIO device observations.
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Thread

from browser_matrix import BROWSERS, Handler, Server, classify_failure, source_digest


def exercise(page):
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)[:400]))
    page.on("console", lambda msg: errors.append(msg.text[:400]) if msg.type == "error" else None)
    page.locator("#scenario").wait_for(timeout=10000)
    # Phase 16: focused observation instructions are visible, not fabricated results.
    page.locator("#scenario").select_option("F16-03")
    assert page.locator("#fraction-capture-guide").is_visible(), "focused plan guide hidden"
    assert page.locator("#fraction-checkpoint-list .device-step-row").count() == 8, "mixed-fraction key path incomplete"
    assert "0 of 12 focused cases" in page.locator("#fraction-coverage").inner_text()
    assert "Observe LCD and cursor here" in page.locator("#fraction-checkpoint-list").inner_text()
    assert page.locator("#keys").input_value().startswith("SHIFT FRAC 2 RIGHT 3"), "focused key sequence incorrect"
    assert page.locator("#focused-checkpoint-entry").is_visible()
    assert page.locator("#raw-checkpoints-field").is_hidden()
    assert page.locator(".checkpoint-capture-row").count() == 5, "F16-03 must expose its five valid checkpoints"
    assert all(not entry for entry in page.locator(".checkpoint-capture-row input").evaluate_all("(inputs) => inputs.map(input => input.value)")), "checkpoint fields were prefilled"
    assert "0 / 5 checkpoints entered" in page.locator("#checkpoint-entry-progress").inner_text()
    page.locator(".checkpoint-capture-row").first.locator('[data-field="expression"]').fill("SYNTHETIC LCD FIXTURE")
    assert "1 / 5 checkpoints entered" in page.locator("#checkpoint-entry-progress").inner_text()
    page.locator("#scenario").select_option("A01")
    assert page.locator("#focused-checkpoint-entry").is_hidden()
    assert page.locator("#raw-checkpoints-field").is_visible()
    assert page.locator("#fraction-capture-guide").is_hidden(), "focused plan guide leaked to baseline"
    assert "0 / 50 planned scenarios" in page.locator("#plan-summary").inner_text(), "plan must start unrecorded"
    page.locator("#scenario").select_option("T04")
    assert page.locator("#angle").input_value() == "RAD", "plan did not apply angle setup"
    assert page.locator("#keys").input_value() == "SIN PI DIV 2 RP =", "plan semantic keys missing"
    assert "PLANNED ONLY" in page.locator("#manual").inner_text(), "plan misidentified as observed"
    page.locator("#scenario").select_option("setup-radian")
    assert page.locator("#keys").input_value() == "SHIFT MODE 4", "outdated setup preset"
    page.locator("#scenario").select_option("c-ineq-menu")
    assert page.locator("#keys").input_value() == "MODE DOWN 1", "outdated C-edition preset"

    # Simulated preview uses the explicitly selected initial setup.
    page.locator("#model").select_option("standard")
    page.locator("#keys").fill("2 ADD 3 =")
    page.locator("#angle").select_option("RAD")
    page.locator("#number-format").select_option("Norm2")
    page.locator("#display-style").select_option("MathO")
    page.locator("#simulate").click()
    assert '"result": "5"' in page.locator("#preview").inner_text(), "preview calculation failed"

    # Synthetic browser fixture: transient form data, not device observations.
    page.locator("#case-id").fill("browser-fixture-only-01")
    page.locator("#device").fill("SYNTHETIC BROWSER FIXTURE - NOT A PHYSICAL DEVICE")
    page.locator("#date").fill(datetime.now(timezone.utc).date().isoformat())
    page.locator("#result").fill("5")
    page.locator("#notes").fill("AUTOMATED UI TEST ONLY; no physical device was involved")
    page.locator("#checkpoints").fill('[{"step":2,"observed":{"expression":"2+"}}]')
    page.locator("#record").click()
    assert "1 matched / 0 mismatched" in page.locator("#summary").inner_text(), "matching checkpoint was lost"

    page.locator("#case-id").fill("browser-fixture-only-02")
    page.locator("#result").fill("6")
    page.locator("#record").click()
    assert "1 matched / 1 mismatched" in page.locator("#summary").inner_text(), "mismatch not reported"
    assert "step 4" in page.locator("#results").inner_text(), "first diverging key missing"
    with page.expect_download(timeout=10000) as discrepancy_download:
        page.locator("#export-discrepancies").click()
    discrepancy = json.loads(Path(discrepancy_download.value.path()).read_text(encoding="utf-8"))
    assert discrepancy["hardwareParityCertified"] is False
    assert discrepancy["schema"] == "fx991-phase17-discrepancies-v1"
    assert len(discrepancy["records"]) == 1
    page.locator("#scenario").select_option("A01")
    page.locator("#result").fill("5")
    # Real browser file upload, but photo is a programmatically generated
    # one-pixel PNG fixture. It is NOT a photograph of a CASIO device.
    import struct, zlib, hashlib
    def chunk(kind, payload):
        data = kind + payload
        return (struct.pack(">I", len(payload)) + data +
                struct.pack(">I", zlib.crc32(data) & 0xffffffff))
    png = (b"\x89PNG\r\n\x1a\n" +
           chunk(b"IHDR", struct.pack(">IIBBBBB",1,1,8,2,0,0,0)) +
           chunk(b"IDAT", zlib.compress(b"\x00\x23\x78\xa0")) +
           chunk(b"IEND", b""))
    page.locator("#photo-file").set_input_files({
        "name":"synthetic-browser-photo.png", "mimeType":"image/png", "buffer":png
    })
    page.locator("#photo-status").filter(has_text="SHA-256").wait_for(timeout=10000)
    assert page.locator("#photo-ref").input_value() == "synthetic-browser-photo.png"
    assert page.locator("#photo-preview").is_visible(), "local preview not shown"
    assert hashlib.sha256(png).hexdigest() in page.locator("#photo-status").inner_text()
    page.locator("#record").click()
    assert "1 / 50 planned scenarios" in page.locator("#plan-summary").inner_text(), "planned-case coverage not updated"
    with page.expect_download(timeout=10000) as download:
        page.locator("#export").click()
    evidence = json.loads(Path(download.value.path()).read_text(encoding="utf-8"))
    media = evidence["records"][-1]["media"]
    assert media["sha256"] == hashlib.sha256(png).hexdigest()
    assert media["reviewStatus"] == "unreviewed"
    assert "data" not in media and "base64" not in media, "image embedded in JSON"
    page.locator("#photo-clear").click()
    assert page.locator("#photo-ref").input_value() == ""
    assert page.locator("#photo-preview").is_hidden()

    assert not errors, "browser/CSP error: " + "; ".join(errors)
    return {"status":"PASS","checks":30,"temporaryFixture":"synthetic-only"}


def field_sheet_checks(page, base_url):
    """Real-browser test. Never fills, submits, or invents physical outcomes."""
    page.goto(base_url + "/tests/reference-field-sheet.html", wait_until="load", timeout=30000)
    page.locator(".reference-card").first.wait_for(timeout=10000)
    assert page.locator(".reference-card").count() == 50, "missing planned field cards"
    assert page.locator(".sheet-page").count() == 25, "expected two cases per A4 sheet"
    assert page.locator(".sheet-field").count() == 300, "six blank evidence fields per card"
    assert "all observed-result fields are blank" in page.locator("#sheet-summary").inner_text()
    page.locator("#area-filter").select_option("arithmetic")
    assert page.locator(".reference-card").count() == 10, "category filter not applied"
    page.locator("#area-filter").select_option("all")
    with page.expect_download(timeout=10000) as info:
        page.locator("#export-blank-csv").click()
    downloaded = info.value
    assert downloaded.suggested_filename.endswith(".csv"), "blank CSV not downloaded"
    content = Path(downloaded.path()).read_text(encoding="utf-8-sig")
    lines = content.splitlines()
    assert len(lines) == 51, "CSV should have 50 planned rows and one header"
    assert "observedLCD" in lines[0] and "actualPhysicalKeys" in lines[0]
    # CSV fields following displayStyle are six empty quoted cells, not predicted data.
    import csv
    records = list(csv.DictReader(lines))
    assert len(records) == 50 and all(
        row["observedLCD"] == "" and row["referenceDevice"] == ""
        and row["photoId"] == "" and row["actualPhysicalKeys"] == ""
        for row in records), "CSV prefilled an unobserved value"
    return 8


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out",default="browser-evidence/device-workbench")
    args=parser.parse_args(argv)
    out=Path(args.out).resolve()
    out.mkdir(parents=True,exist_ok=True)
    rows=[]
    with Server(("127.0.0.1",0),Handler) as server:
        worker=Thread(target=server.serve_forever,daemon=True)
        worker.start()
        url=f"http://127.0.0.1:{server.server_address[1]}/tests/device.html"
        try:
            try:
                from playwright.sync_api import sync_playwright, Error as PlaywrightError
            except ImportError as error:
                rows=[{"browser":name,"status":"BLOCKED","error":str(error)[:500]} for name in BROWSERS]
            else:
                with sync_playwright() as p:
                    for name in BROWSERS:
                        row={"browser":name,"status":"BLOCKED"}
                        browser=context=None
                        stage="launch"
                        try:
                            browser=getattr(p,name).launch(headless=True)
                            context=browser.new_context(viewport={"width":1280,"height":900},accept_downloads=True)
                            page=context.new_page()
                            stage="navigate"
                            page.goto(url,wait_until="load",timeout=30000)
                            stage="interaction"
                            row.update(exercise(page))
                            checks=field_sheet_checks(page, url.rsplit("/tests/device.html",1)[0])
                            row["checks"] += checks
                        except (PlaywrightError,AssertionError,TimeoutError,ValueError,OSError,AttributeError) as error:
                            row.update(status=classify_failure(stage,error),error=str(error)[:500])
                            if context:
                                try: page.screenshot(path=str(out/f"{name}-device-workbench-failure.png"),full_page=True,timeout=5000)
                                except Exception: pass
                        finally:
                            if context: context.close()
                            if browser: browser.close()
                        rows.append(row)
                        print(name+": "+row["status"],flush=True)
        finally:
            server.shutdown()
            worker.join(timeout=3)
    ready=(len(rows)==3 and all(x.get("status")=="PASS" for x in rows))
    report={"schema":"fx991-device-workbench-browser-probe-v1",
        "sourceDigest":source_digest(),
        "generatedAt":datetime.now(timezone.utc).isoformat(),
        "results":rows,"ready":ready,"physicalObservations":0,
        "note":"Browser-only UI checks with transient synthetic fixture; never hardware evidence."}
    (out/"device-workbench-report.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    return 0 if ready else 1


if __name__=="__main__":
    raise SystemExit(main())
