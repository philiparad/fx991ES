#!/usr/bin/env python3
"""Run real Chromium/Firefox/WebKit UI acceptance with Python Playwright.
Development/CI only. Browser calculator needs no Python or Node runtime.
Usage: python tools/browser_matrix.py --browsers chromium firefox webkit --out browser-evidence
Requires: pip install playwright && python -m playwright install chromium firefox webkit
"""
import argparse
import functools
import http.server
import json
import os
from pathlib import Path
import socketserver
import threading
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright, Error as PlaywrightError

ROOT = Path(__file__).resolve().parents[1]

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *_args):
        pass

class HTTPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browsers', nargs='+', choices=['chromium','firefox','webkit'], default=['chromium','firefox','webkit'])
    parser.add_argument('--out', default='browser-evidence')
    parser.add_argument('--timeout', type=int, default=150)
    args = parser.parse_args()
    out = Path(args.out).resolve();out.mkdir(parents=True, exist_ok=True)
    with HTTPServer(('127.0.0.1', 0), Handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True);thread.start()
        url = f'http://127.0.0.1:{server.server_address[1]}/tests/browser-acceptance.html'
        results = []
        try:
            with sync_playwright() as p:
                for browser_name in args.browsers:
                    browser = None
                    evidence = {'browser':browser_name,'status':'BLOCKED','detail':'not started','capture':None}
                    try:
                        browser = getattr(p,browser_name).launch(headless=True)
                        context = browser.new_context(viewport={'width':1280,'height':900}, accept_downloads=True)
                        page = context.new_page()
                        page.goto(url, wait_until='domcontentloaded', timeout=30000)
                        page.wait_for_function("document.body.dataset.acceptance === 'passed' || document.body.dataset.acceptance === 'failed' || document.body.dataset.acceptance === 'blocked'", timeout=args.timeout*1000)
                        with page.expect_download(timeout=15000) as info:
                            page.locator('#download').click()
                        download = info.value
                        destination = out / f'{browser_name}-acceptance.json'
                        download.save_as(destination)
                        capture = json.loads(destination.read_text(encoding='utf-8'))
                        rows=capture.get('results',[])
                        if len(rows)!=18 or not all(r.get('status')=='PASS' for r in rows):
                            evidence.update(status='FAIL',detail=f'Only {sum(r.get("status")=="PASS" for r in rows)}/{len(rows)} tests passed')
                        else:
                            evidence.update(status='PASS', detail='18/18 DOM checks passed')
                        evidence['capture']=str(destination)
                        (out/f'{browser_name}-screenshot.png').write_bytes(page.screenshot(full_page=True))
                        context.close()
                    except (PlaywrightError, TimeoutError, OSError, ValueError) as e:
                        evidence.update(status='BLOCKED',detail=str(e)[:600])
                    finally:
                        if browser:browser.close()
                    results.append(evidence)
                    print(f'{browser_name}: {evidence["status"]} — {evidence["detail"]}',flush=True)
        finally:
            server.shutdown();thread.join(timeout=2)
    summary={'schema':'fx991-browser-matrix-run','milestone':33,'generatedAt':datetime.now(timezone.utc).isoformat(),
             'results':results,'ready':len(results)==3 and all(r['status']=='PASS' for r in results),
             'note':'Automated browser evidence is not physical-device compatibility certification.'}
    (out/'matrix-run.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    return 0 if summary['ready'] else 1

if __name__=='__main__':
    raise SystemExit(main())