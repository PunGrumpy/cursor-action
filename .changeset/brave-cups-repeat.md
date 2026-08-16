---
"@pungrumpy/cursor-action": patch
---

Publish a moving `v1` tag on every release, so `uses: PunGrumpy/cursor-action@v1`
resolves to the latest `v1.x.x`. Previously only exact `vX.Y.Z` tags existed and
`@v1` did not resolve at all.
