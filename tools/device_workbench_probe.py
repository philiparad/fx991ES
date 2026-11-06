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
    assert not errors, "browser/CSP error: " + "; ".join(errors)
    return {"status":"PASS","checks":6,"temporaryFixture":"synthetic-only"}


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
                            context=browser.new_context(viewport={"width":1280,"height":900})
                            page=context.new_page()
                            stage="navigate"
                            page.goto(url,wait_until="load",timeout=30000)
                            stage="interaction"
                            row.update(exercise(page))
                        except (PlaywrightError,AssertionError,TimeoutError,ValueError,OSError) as error:
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
