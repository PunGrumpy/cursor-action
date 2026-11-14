---
"@pungrumpy/cursor-action": patch
---

The default `model` is now `composer-2.5`. Cursor's catalog no longer lists `default`, so workflows that omitted `model` failed with `Cannot use this model: default`. They now run Composer 2.5.
