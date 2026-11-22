# website
Website for Cultivando Futuros (cfuturos.org)

## Review mode (current)
The site is in **team review mode**: a yellow "Draft for review" banner, a
`noindex` tag on every page plus `robots.txt` so search engines don't list it,
and a **Feedback** button (`feedback.js`) on every page. Reviewers type into
one box ("What needs to change?"); each comment arrives as a row with the
page and language added automatically. The form closes after sending.

To launch publicly: remove the banner, the `noindex` meta tags, `robots.txt`
and the `feedback.js` script tags.

## Publishing rule
Every change must pass `./check.sh` (18 EN/ES pages x 15 screen widths).
The GitHub Actions workflow deploys to cfuturos.org only when it passes.
