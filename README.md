# wechat-mp-auto-publish

面向 **微信公众平台（公众号）** 的本地小工具集：用官方接口拉取 **`access_token`**、上传封面与正文图、调用 **`draft/add`** 在 **草稿箱** 里创建图文草稿。默认 **不群发、不对粉丝自动发布**，发布动作仍在公众平台网页里由你确认。

现在这个仓库同时支持两种内容输入方式：
- 传统 `.env` 变量输入
- 新增的 **article package JSON** 输入，更适合直接对接写作 skill 输出

| 资源 | 链接 |
|------|------|
| 本仓库 | [HashClawAI/wechat-mp-auto-publish](https://github.com/HashClawAI/wechat-mp-auto-publish) |
| 默认写作 Skill | [HashClawAI/write-skill-academic-story](https://github.com/HashClawAI/write-skill-academic-story) |

---

## 功能一览

- **`scripts/publish.mjs`**：支持 `.env` 或 `article.json` 输入；`DRY_RUN=1` 时打印将提交的 JSON，并把最终 HTML / payload 落到 `artifacts/`。
- **`scripts/render-article.mjs`**：把结构化文章包渲染为微信可发布 HTML。
- **`scripts/import-skill-output.mjs`**：把写作 skill 的 JSON 输出转换成 publish repo 可直接消费的文章包。
- **`scripts/upload-media.mjs`**：`thumb` 上传永久素材得到封面 **`media_id`**；`inline` 上传正文插图得到微信 **`url`**（用于 HTML `<img src>`）。

---

## 快速开始

```bash
git clone https://github.com/HashClawAI/wechat-mp-auto-publish.git
cd wechat-mp-auto-publish
cp .env.example .env
```

先填 `.env` 里的 `WECHAT_APP_ID` / `WECHAT_APP_SECRET`。

### 方式 A：继续用 `.env` 直接发

```bash
node scripts/publish.mjs
```

### 方式 B：用结构化文章包

先准备一个 JSON（可参考 `examples/article-package.example.json`）：

```bash
node scripts/render-article.mjs --article examples/article-package.example.json > /tmp/rendered.json
WECHAT_ARTICLE_JSON_PATH=examples/article-package.example.json node scripts/publish.mjs
```

### 方式 C：从写作 skill 输出直接接入

如果写作 skill 输出了 JSON 文件：

```bash
node scripts/import-skill-output.mjs --input skill-output.json --out examples/article-package.generated.json
node scripts/render-article.mjs --article examples/article-package.generated.json
WECHAT_ARTICLE_JSON_PATH=examples/article-package.generated.json node scripts/publish.mjs
```

---

## Article package 契约

推荐结构：

```json
{
  "title": "文章标题",
  "digest": "摘要",
  "author": "作者名",
  "standfirst": "导语",
  "body_markdown": "正文 markdown/plain text",
  "content_html": "<p>可选：若已生成最终 HTML，可直接提供</p>",
  "references": ["参考资料 1", "参考资料 2"],
  "source_url": "https://example.com",
  "thumb_media_id": "",
  "open_comment": 1,
  "only_fans_can_comment": 0,
  "metadata": {
    "topic": "主题",
    "style": "academic-story"
  }
}
```

优先级：
- 若提供 `content_html`，发布脚本直接使用
- 否则可先通过 `render-article.mjs` 把 `standfirst + body_markdown + references` 渲染成 HTML

---

## 与 write-skill-academic-story 的无缝配合

推荐让写作 skill 在“公众号发布模式”下输出两层内容：
1. 给人看的文章正文
2. 给机器用的 JSON block

这个 repo 的 `import-skill-output.mjs` 负责把该 JSON block 规范化为 `article package`，然后进入 `render-article.mjs` / `publish.mjs`。

这样以后流程会是：

```text
写作 skill 输出 JSON
→ import-skill-output.mjs
→ article-package.generated.json
→ render-article.mjs（可选）
→ publish.mjs
→ 微信草稿箱
```

---

## 调试产物

每次执行 `publish.mjs` 时，都会生成：

- `artifacts/last-rendered.html`
- `artifacts/last-draft-body.json`

这两个文件有助于检查：
- HTML 是否符合预期
- 真正发给微信 `draft/add` 的 payload 长什么样

---

## 脚本命令速查

| 命令 | 作用 |
|------|------|
| `node scripts/publish.mjs` | 读取 `.env` 或 article package，按 `DRY_RUN` 调试或创建草稿 |
| `node scripts/publish.mjs --article path/to/article.json` | 从结构化文章包创建草稿 |
| `node scripts/render-article.mjs --article path/to/article.json` | 把文章包渲染为可发布 HTML |
| `node scripts/import-skill-output.mjs --input skill-output.json --out article.json` | 把写作 skill 输出转成 article package |
| `node scripts/upload-media.mjs thumb <图片路径>` | 封面上传 → `WECHAT_THUMB_MEDIA_ID` |
| `node scripts/upload-media.mjs inline <图片路径>` | 正文图上传 → 将返回的 `url` 写入 HTML |

---

## Review 结论 / 这次改进点

我 review 后认为这个 repo 原本已经足够轻量可用，但有三点明显可以提升：

1. **输入契约过于原始**
   - 之前只能吃 `.env` 里的标题/HTML
   - 现在支持 `article package JSON`

2. **脚本有重复逻辑**
   - 已把 env / token / fetch 逻辑抽到 `scripts/lib/`

3. **与写作 skill 缺少桥接层**
   - 现在新增 `import-skill-output.mjs`
   - 可以把 skill 输出直接转换为 publish repo 的标准输入

---

## 安全与隐私

- `.env`、`.env.*` 已被 `.gitignore` 忽略；勿提交密钥。
- 线上密钥请放在 GitHub Secrets 或受控密钥系统。
- GitHub Actions 若遇到 IP 白名单限制，优先在本机或自建 Runner 执行。

---

## 免责声明

微信接口字段、账号权限与平台规则可能变更；正式使用前请以微信公众平台技术文档当前说明为准。
