"""Responsive regression test for cfuturos.org.

Loads every EN/ES page at 15 screen widths and fails if any page:
  - scrolls sideways (content wider than the screen)
  - has an element sticking out past the right edge
  - throws a JavaScript error
  - has a broken internal link or stylesheet/script
  - has a menu button that does not open the menu (narrow screens)
  - has a Feedback button or panel that does not fit on screen

Run with ./check.sh (needs: pip install playwright && playwright install chromium).
Set CHROME_PATH to use an already-installed Chrome.
"""
import functools
import http.server
import os
import re
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
WIDTHS = [320, 360, 375, 390, 414, 480, 600, 768, 820, 1024, 1180, 1280, 1366, 1440, 1920]
HEIGHT = 800


def pages():
    out = []
    for d in ('', 'es/'):
        for f in sorted(os.listdir(os.path.join(ROOT, d or '.'))):
            if f.endswith('.html'):
                out.append(d + f)
    return out


def check_links(rel):
    errs = []
    html = open(os.path.join(ROOT, rel), encoding='utf-8').read()
    base = os.path.dirname(rel)
    for ref in re.findall(r'(?:href|src)="([^"#]+)', html):
        if re.match(r'^(https?:|mailto:|tel:|data:)', ref):
            continue
        target = os.path.normpath(os.path.join(ROOT, base, ref))
        if not os.path.exists(target):
            errs.append('%s: broken link -> %s' % (rel, ref))
    return errs


OVERFLOW_JS = """() => {
  const w = document.documentElement.clientWidth, bad = [];
  if (document.documentElement.scrollWidth > w + 1) bad.push('page scrolls sideways (' + document.documentElement.scrollWidth + 'px > ' + w + 'px)');
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') || el.closest('.skip')) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (r.right > w + 1) { bad.push('<' + el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '') + '> sticks out to ' + Math.round(r.right) + 'px'); if (bad.length > 4) break; }
  }
  return bad;
}"""

FITS_JS = """(sel) => { const e = document.querySelector(sel); if (!e) return 'missing';
  const r = e.getBoundingClientRect();
  return (r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1) ? '' : 'off screen ' + JSON.stringify([r.left, r.top, r.right, r.bottom]); }"""


def main():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = 'http://127.0.0.1:%d/' % srv.server_address[1]

    plist = pages()
    failures = []
    for p in plist:
        failures += check_links(p)

    with sync_playwright() as pw:
        kw = {'executable_path': os.environ['CHROME_PATH']} if os.environ.get('CHROME_PATH') else {}
        browser = pw.chromium.launch(**kw)
        for w in WIDTHS:
            ctx = browser.new_context(viewport={'width': w, 'height': HEIGHT})
            # Block outside requests (web fonts) so the test is fast and offline-safe.
            ctx.route(re.compile(r'^https?://(?!127\.0\.0\.1)'), lambda r: r.abort())
            page = ctx.new_page()
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            for p in plist:
                errors.clear()
                tag = '%s @ %dpx' % (p, w)
                page.goto(base + p, wait_until='load')
                for b in page.evaluate(OVERFLOW_JS):
                    failures.append('%s: %s' % (tag, b))
                # Menu button (shown on narrow screens) must open the menu.
                mb = page.locator('.menu-btn')
                if mb.count() and mb.is_visible():
                    mb.click()
                    if not page.locator('#site-nav').is_visible():
                        failures.append('%s: menu button does not open the menu' % tag)
                    mb.click()
                # Feedback button and panel must fit on screen.
                m = page.evaluate(FITS_JS, '.fb-btn')
                if m:
                    failures.append('%s: Feedback button %s' % (tag, m))
                else:
                    page.click('.fb-btn')
                    m = page.evaluate(FITS_JS, '.fb-box')
                    if m:
                        failures.append('%s: Feedback panel %s' % (tag, m))
                    for b in page.evaluate(OVERFLOW_JS):
                        failures.append('%s (feedback open): %s' % (tag, b))
                    page.keyboard.press('Escape')
                for e in errors:
                    failures.append('%s: JavaScript error: %s' % (tag, e))
            ctx.close()
        browser.close()
    srv.shutdown()

    total = len(plist) * len(WIDTHS)
    if failures:
        print('FAILED: %d problem(s) across %d page views' % (len(failures), total))
        for f in failures[:200]:
            print('  - ' + f)
        sys.exit(1)
    print('PASSED: %d pages x %d widths = %d page views, no problems' % (len(plist), len(WIDTHS), total))


if __name__ == '__main__':
    main()
