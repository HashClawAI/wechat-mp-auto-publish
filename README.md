# wechat-mp-auto-publish

面向 **微信公众平台（公众号）** 的本地小工具集：用官方接口拉取 **`access_token`**、上传封面与正文图、调用 **`draft/add`** 在 **草稿箱** 里创建图文草稿。默认 **不群发、不对粉丝自动发布**，发布动作仍在公众平台网页里由你确认。

| 资源 | 链接 |
|------|------|
| 本仓库 | [HashClawAI/wechat-mp-auto-publish](https://github.com/HashClawAI/wechat-mp-auto-publish) |
| 配套 Cursor Skill（本机） | `~/.cursor/skills/wechat-mp-auto-publish/`（`SKILL.md`、`pipeline.md`、`reference.md`） |
| 默认写作 Skill（可选） | [HashClawAI/write-skill-academic-story](https://github.com/HashClawAI/write-skill-academic-story) — 建议 clone 到 `~/.cursor/skills/write-skill-academic-story/` 或确保 `main` 分支已推送 `SKILL.md` |

---

## 功能一览

- **`scripts/publish.mjs`**：使用 [stable_token](https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/getStableAccessToken.html) 获取 `access_token`；`DRY_RUN=1` 时只打印将要提交的 JSON；`DRY_RUN=0` 时调用 [draft/add](https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_add.html) 创建草稿。
- **`scripts/upload-media.mjs`**：`thumb` 上传永久素材得到封面 **`media_id`**；`inline` 上传正文插图得到微信 **`url`**（用于 HTML `<img src>`）。
- **`.github/workflows/publish-draft.yml`**：仅 **手动触发**（`workflow_dispatch`），可选在 CI 里跑同一套脚本。

---

## 前置条件

- **Node.js ≥ 18**（本机执行 `node -v`）。
- 公众号已开启 **开发者模式**，并在 [公众平台](https://mp.weixin.qq.com/) → **开发 → 基本配置** 取得 **AppID**、**AppSecret**。
- 若后台启用了 **IP 白名单**：把当前运行脚本所在网络的 **公网出口 IP** 加入白名单；GitHub 默认 Runner 的 IP **不固定**，在 Actions 里调用接口常会踩白名单，需要自建 Runner 或固定出口代理。

---

## 快速开始

```bash
git clone https://github.com/HashClawAI/wechat-mp-auto-publish.git
cd wechat-mp-auto-publish

cp .env.example .env
# 编辑 .env：填入 WECHAT_APP_ID、WECHAT_APP_SECRET；勿将 .env 提交到 Git

# 先验证 token 与草稿 JSON（不创建草稿）
node scripts/publish.mjs
# 或
npm run publish:draft
```

创建 **真实草稿** 前：

1. 准备封面图，执行 `node scripts/upload-media.mjs thumb path/to/cover.jpg`，把返回的 `media_id` 写入 `.env` 的 **`WECHAT_THUMB_MEDIA_ID`**。  
2. 在 `.env` 中设置 **`WECHAT_ARTICLE_TITLE`**、**`WECHAT_ARTICLE_CONTENT`**（及可选字段，见下表）。  
3. 将 **`DRY_RUN=0`**，再执行 `node scripts/publish.mjs`。  
4. 打开 [公众平台](https://mp.weixin.qq.com/) → **草稿箱** 检查草稿。

正文里的图片须使用 **`upload-media.mjs inline`** 返回的地址；外链图片常被过滤。

---

## 环境变量说明

完整模板见 **[`.env.example`](.env.example)**。下列为常用项（敏感项仅保存在本机 `.env` 或 GitHub **Secrets**）。

| 变量 | 说明 |
|------|------|
| `WECHAT_APP_ID` / `WECHAT_APP_SECRET` | 公众平台凭据，必填 |
| `WECHAT_THUMB_MEDIA_ID` | 封面永久素材 `media_id`；`DRY_RUN=0` 时必填 |
| `WECHAT_ARTICLE_TITLE` | 标题 |
| `WECHAT_ARTICLE_AUTHOR` | 作者（≤16 字）；不填则请求里不带该字段 |
| `WECHAT_ARTICLE_DIGEST` | 单图文摘要（≤128 字）；不填则由微信从正文截取 |
| `WECHAT_ARTICLE_CONTENT` | HTML 正文 |
| `WECHAT_CONTENT_SOURCE_URL` | 「阅读原文」链接 |
| `WECHAT_NEED_OPEN_COMMENT` | `1` 开评论，`0` 关（示例默认为 `1`） |
| `WECHAT_ONLY_FANS_CAN_COMMENT` | `1` 仅粉丝可评，`0` 所有人可评 |
| `WECHAT_PIC_CROP_235_1` / `WECHAT_PIC_CROP_1_1` | 可选，封面裁剪坐标，格式见官方文档 |
| `DRY_RUN` | `1` 仅调试；`0` 调用 `draft/add` |

---

## 脚本命令速查

| 命令 | 作用 |
|------|------|
| `node scripts/publish.mjs` | 读取 `.env`，按 `DRY_RUN` 调试或创建草稿 |
| `node scripts/upload-media.mjs thumb <图片路径>` | 封面上传 → `WECHAT_THUMB_MEDIA_ID` |
| `node scripts/upload-media.mjs inline <图片路径>` | 正文图上传 → 将返回的 `url` 写入 HTML |

临时覆盖环境变量（不修改 `.env` 文件）示例：

```bash
DRY_RUN=0 WECHAT_THUMB_MEDIA_ID=xxx WECHAT_ARTICLE_TITLE=标题 node scripts/publish.mjs
```

---

## 与 Cursor Skill 的配合

端到端「主题 + 材料 → 成稿 → 配图 → 草稿」由本机 **wechat-mp-auto-publish** Skill 的 **`pipeline.md`** 描述：写作上默认对齐 **write-skill-academic-story**，再调用本仓库脚本上传素材并 `publish.mjs` 落库。

推荐本机目录结构示例：

```text
~/.cursor/skills/wechat-mp-auto-publish/   # 公众号编排 Skill
~/.cursor/skills/write-skill-academic-story/   # 写作 Skill（clone 写作仓库）
/path/to/wechat-mp-auto-publish/         # 本仓库：脚本与 .env
```

---

## 草稿接口能填什么、哪些要在后台补

`draft/add` 支持的常见字段包括：`title`、`author`、`digest`、`content`、`content_source_url`、`thumb_media_id`、评论开关、封面裁剪等，以 [官方文档](https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_add.html) 为准。

**接口文档中通常不包含**「原创声明」「转载声明」「合集」等编辑器选项，这些仍需在 **公众平台网页里打开该草稿** 后手动设置。

---

## GitHub Actions

工作流：**[`.github/workflows/publish-draft.yml`](.github/workflows/publish-draft.yml)**（仅 `workflow_dispatch`）。

1. 在仓库 **Settings → Secrets and variables → Actions** 中配置：  
   - **`WECHAT_APP_ID`**、**`WECHAT_APP_SECRET`**（必填）  
   - 若 `dry_run` 选择 **false**：还需 **`WECHAT_THUMB_MEDIA_ID`**  
2. **Actions** 中选择 **publish-draft** → **Run workflow**，按需填写标题、正文 HTML、`dry_run`。

**IP 白名单**：在 GitHub 托管 Runner 上调用接口时，出口 IP 可能不在你公众平台白名单内；若报 `40164`，请改用本机执行、自建 Runner，或与微信侧网络策略对齐。

---

## 安全与隐私

- **`.env`、`.env.*` 已被 `.gitignore` 忽略**；勿将含 `WECHAT_APP_SECRET` 的文件提交或贴进 Issue / PR。  
- 线上密钥请放在 GitHub **Secrets** 或受控密钥系统，不要写进 YAML 明文。  
- 临时下载的配图可放在本仓库 **`artifacts/`** 目录（已忽略），避免把有版权争议的图片提交到 Git。

---

## 常见问题

| 现象 | 处理方向 |
|------|----------|
| `40164` / `invalid ip` | 将报错中的公网 IP 加入公众平台 **IP 白名单**；或换到已加白的网络 |
| `40125` / `invalid secret` | 检查 `AppSecret` 是否与后台一致（重置后需全量更新） |
| `48001` / `api unauthorized` | 账号类型或未认证导致无该接口权限，对照官方「适用范围」 |
| 正文图片不显示 | 确认 `<img src>` 为 **`uploadimg`** 返回的微信 URL，而非外链 |

---

## 免责声明

微信接口字段、账号权限与平台规则可能变更；正式使用前请以 [微信公众平台技术文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html) 当前说明为准。本仓库为辅助工具，不保证与所有账号类型或未来接口变更完全兼容。
