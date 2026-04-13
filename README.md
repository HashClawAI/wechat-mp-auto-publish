# wechat-mp-auto-publish

Scripts and runbooks for **WeChat Official Account (微信公众号)** draft/publish automation. The Cursor Agent skill that drives planning and debugging lives in:

`~/.cursor/skills/wechat-mp-auto-publish/SKILL.md`

## Prerequisites

- A **WeChat MP** account with the developer APIs enabled.
- **AppID** and **AppSecret** from [微信公众平台](https://mp.weixin.qq.com/) → 开发 → 基本配置.
- For real `draft/add` calls: a **permanent** `thumb_media_id` (封面) from material upload — see [微信文档 — 草稿箱](https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_add).

## Quick start (local)

```bash
cd wechat-mp-auto-publish
cp .env.example .env
# edit .env — never commit .env

DRY_RUN=1 node scripts/publish.mjs
```

With `DRY_RUN=1`, the script fetches an access token (stable token API) and prints the draft payload it **would** send.

To call `draft/add`, set `DRY_RUN=0`, provide `WECHAT_THUMB_MEDIA_ID`, title, and HTML `content` (images in HTML must follow MP rules — usually URLs from their upload API).

## CI (GitHub Actions)

Use **workflow_dispatch** and GitHub **Environments** with required reviewers before any step that publishes. Store `WECHAT_APP_ID` and `WECHAT_APP_SECRET` as repository or environment secrets.

## Disclaimer

WeChat permissions and JSON fields change by account type and platform policy. Confirm each endpoint against the current official documentation before relying on automation in production.
