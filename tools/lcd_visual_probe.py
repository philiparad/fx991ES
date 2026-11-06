#!/usr/bin/env python3
"""Phase 7: genuine browser LCD screenshot and logical-pixel comparison.

Diagnostic only. Browser passes do not establish CASIO device parity.
No synthetic browser captures, fabricated physical screenshots, or auto-approval.
"""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from browser_matrix import BROWSERS, Handler, Server, classify_failure, source_digest
from threading import Thread

SCENES = (
    ("matho-half", "MathO", "1/2", "1/2", False),
    ("matho-radical", "MathO", "sqrt(8)", "2√2", False),
    ("matho-pi", "MathO", "pi/2", "1/2π", False),
    ("lineo-half", "LineO", "1/2", "0.5", False),
    ("lineio-half", "LineIO", "1/2", "0.5", False),
    ("matho-sd", "MathO", "1/2", "0.5", True),
)


def capture(page, slug, style, expression, expected, toggle, folder, browser):
    """Perform real UI events and capture the actual browser-rendered canvas."""
    page.locator("#display-style").select_option(style)
    page.locator("#expression").fill(expression)
    page.locator("#calculate").click()
    if toggle:
        page.get_by_role("button", name="S-D calculator key", exact=True).click()
    semantic = page.locator("#semantic").inner_text()
    if "Result: " + expected not in semantic:
        raise AssertionError(f"{slug}: result mismatch: {semantic[:350]}")
    if style == "LineIO":
        if "Linear input mode" not in page.locator("#natural-info").inner_text():
            raise AssertionError("LineIO did not activate linear input projection")
    px = page.locator("#lcd").evaluate("""canvas => {
        const ctx = canvas.getContext('2d');
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return {width:canvas.width,height:canvas.height,pixels:Array.from(img.data)};
    }""")
    if (px["width"], px["height"]) != (96, 31):
        raise AssertionError("LCD framebuffer shape changed")
    raw = bytes(px["pixels"])
    if len(raw) != 96 * 31 * 4:
        raise AssertionError("LCD RGBA buffer length mismatch")
    # This hash is of the *actual canvas* RGBA pixels, not a simulated K.rasterizeScreen result.
    filename = f"{browser}-{slug}.png"
    page.locator("#lcd").screenshot(path=str(folder / filename), timeout=10000)
    return {"scene":slug,"style":style,"expression":expression,
            "result":expected,"frameWidth":96,"frameHeight":31,
            "canvasSha256":hashlib.sha256(raw).hexdigest(),
            "screenshot":filename,"status":"PASS"}


def run_browser(pw, name, url, folder):
    from playwright.sync_api import Error as PlaywrightError
    record={"browser":name,"status":"BLOCKED","stage":"launch","scenes":[],"error":""}
    browser=None
    try:
        browser=getattr(pw,name).launch(headless=True)
        for slug,style,expr,expected,toggle in SCENES:
            context=None
            stage="navigate"
            try:
                context=browser.new_context(viewport={"width":1280,"height":900})
                page=context.new_page()
                errors=[]
                page.on("pageerror", lambda error:errors.append(str(error)[:400]))
                page.goto(url,wait_until="load",timeout=30000)
                page.locator("#calculate").wait_for(timeout=10000)
                stage="interaction"
                result=capture(page,slug,style,expr,expected,toggle,folder,name)
                if errors:
                    raise AssertionError("Browser page exception: "+ "; ".join(errors))
                record["scenes"].append(result)
            except (PlaywrightError,AssertionError,TimeoutError,ValueError,OSError) as exc:
                record.update(status=classify_failure(stage,exc),stage=stage,error=str(exc)[:600])
                record["scenes"].append({"scene":slug,"status":record["status"],"error":str(exc)[:600]})
                break
            finally:
                if context:
                    context.close()
        else:
            record.update(status="PASS",stage="complete",error="")
    except (PlaywrightError,OSError,TimeoutError) as exc:
        record.update(status=classify_failure("launch",exc),error=str(exc)[:600])
    finally:
        if browser:
            browser.close()
    return record


def main(argv=None):
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out",default="browser-evidence/lcd-visual")
    ap.add_argument("--browsers",nargs="+",choices=BROWSERS,default=list(BROWSERS))
    args=ap.parse_args(argv)
    out=Path(args.out).resolve()
    out.mkdir(parents=True,exist_ok=True)
    results=[]
    with Server(("127.0.0.1",0),Handler) as server:
        thread=Thread(target=server.serve_forever,daemon=True)
        thread.start()
        url=f"http://127.0.0.1:{server.server_address[1]}/index.html?smoke=phase7"
        try:
            try:
                from playwright.sync_api import sync_playwright
            except ImportError as exc:
                results=[{"browser":name,"status":"BLOCKED","stage":"launch","scenes":[],
                          "error":"Playwright unavailable: "+str(exc)[:200]} for name in args.browsers]
            else:
                with sync_playwright() as pw:
                    for name in args.browsers:
                        result=run_browser(pw,name,url,out)
                        results.append(result)
                        print(name+": "+result["status"]+" ("+
                              str(sum(c["status"]=="PASS" for c in result["scenes"]))+
                              "/"+str(len(SCENES))+")",flush=True)
        finally:
            server.shutdown()
            thread.join(timeout=3)
    # Cross-browser logical-pixel parity is independent of physical CASIO fidelity.
    mismatch=[]
    if len(results)==len(BROWSERS) and all(r["status"]=="PASS" for r in results):
        for i,(slug,*_) in enumerate(SCENES):
            digests={r["browser"]:r["scenes"][i]["canvasSha256"] for r in results}
            if len(set(digests.values()))!=1:
                mismatch.append({"scene":slug,"canvasHashes":digests})
    ready=(len(results)==len(BROWSERS)
           and {r["browser"] for r in results}==set(BROWSERS)
           and all(r["status"]=="PASS" and len(r["scenes"])==len(SCENES) for r in results)
           and not mismatch)
    report={"schema":"fx991-lcd-visual-probe-v1","sourceDigest":source_digest(),
            "generatedAt":datetime.now(timezone.utc).isoformat(),
            "targetUrl":url,"scenes":[row[0] for row in SCENES],
            "results":results,"canvasParityMismatches":mismatch,"ready":ready,
            "deviceObservations":0,
            "disclaimer":"Real browser evidence only; not CASIO LCD/hardware equivalence."}
    (out/"lcd-visual-report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    return 0 if ready else 1


if __name__=="__main__":
    raise SystemExit(main())
