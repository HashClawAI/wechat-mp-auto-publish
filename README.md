# wechat-mp-auto-publish

面向 **微信公众平台（公众号）** 的本地小工具集：用官方接口拉取 **`access_token`**、上传封面与正文图、调用 **`draft/add`** 在 **草稿箱** 里创建图文草稿。默认 **不群发、不对粉丝自动发布**，发布动作仍在公众平台网页里由你确认。

现在这个仓库同时支持两种内容输入方式：
- 传统 `.env` 变量输入
- 新增的 **article package JSON** 输入，更适合直接对接写作 skill 输出

| 资源 | 链接 |
|------|------|
| 本仓库 | [HashClawAI/wechat-mp-auto-publish](https://github.com/HashClawAI/wechat-mp-auto-publish) |
| 配套 Cursor Skill（本机） | `~/.cursor/skills/wechat-mp-auto-publish/`（`SKILL.md`、`pipeline.md`、`reference.md`） |
| 默认写作 Skill | [HashClawAI/write-skill-academic-story](https://github.com/HashClawAI/write-skill-academic-story) — 定义在 **`skills/article-writing-academic-story/SKILL.md`**；可将该目录放到 `~/.cursor/skills/article-writing-academic-story/` 或通过 raw URL 拉取 |

---

## 功能一览

- **`scripts/publish.mjs`**：支持 `.env` 或 `article.json` 输入；`DRY_RUN=1` 时打印将提交的 JSON，并把最终 HTML / payload 落到 `artifacts/`。
- **`scripts/render-article.mjs`**：把结构化文章包渲染为微信可发布 HTML。
- **`scripts/import-skill-output.mjs`**：把写作 skill 的 JSON 输出转换成 publish repo 可直接消费的文章包。
- **`scripts/publish-from-skill.mjs`**：一条命令串起 import → render → publish，适合直接吃 skill 输出。
- **`scripts/upload-media.mjs`**：`thumb` 上传永久素材得到封面 **`media_id`**；`inline` 上传正文插图得到微信 **`url`**（用于 HTML `<img src>`）。
- **`scripts/regenerate-batch-quality.mjs`**：按 arXiv id **拉取真实元数据与英文摘要**，生成长版中文 HTML（导读 + 摘录 + 读法建议），并为每篇下载 **不同 seed** 的占位封面图上传为 **独立 `thumb_media_id`**（picsum，仅作版式区分；正式发文请换自有版权图）。

### 内容质量说明（重要）

- **「写作 skill」的完整执行**指：在 Cursor 里由 Agent **通读** `article-writing-academic-story/SKILL.md`，再针对单篇做采访式扩写、改稿与事实核对；**不是**仓库里某条一键脚本自动等价替代。
- 早期示例里的 **`generate-batch-ai-agent-articles.mjs`** 为**短模板**，适合打通流水线，不适合当最终稿。
- 若需要「可发表的深度」：请对**每一篇**单独开任务，引用 arXiv / PDF 段落，或先跑 `node scripts/regenerate-batch-quality.mjs` 再人工改第二稿。

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
npm run publish:from-skill -- --input skill-output.json
```

只想跑到 dry-run 检查 payload 而不真正发到微信时：

```bash
npm run publish:from-skill -- --input skill-output.json --dry-run-only
```

默认会：
- 生成 `examples/article-package.generated.json`
- 渲染 `artifacts/last-rendered.html`
- 继续调用 `publish.mjs`
- 加 `--dry-run-only` 时强制以 dry-run 方式结束，不真正提交到微信

需要自定义输出路径时可加：
- `--article path/to/article.json`
- `--render-out path/to/rendered.html`

如果你想手动分步调试，也可以继续这样跑：

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
→ publish-from-skill.mjs
→ article-package.generated.json
→ last-rendered.html
→ publish.mjs
→ 微信草稿箱
```

**本机 Skill 目录示例：**

```text
~/.cursor/skills/wechat-mp-auto-publish/              # 发文编排（个人 skill）
~/.cursor/skills/article-writing-academic-story/    # 写作：对应 GitHub 仓库内 skills/article-writing-academic-story/
/path/to/wechat-mp-auto-publish/                     # 本仓库（脚本、.env、examples）
```

---

## 完整示例：从 skill 输出到微信草稿

示例 skill 输出可以直接看：`examples/skill-output.sample.json`

### 1. skill 输出示例

```json
{
  "title_options": [
    "当一个 AI 发现自己要被替换，它会怎么做？",
    "被替换前夜，AI 会如何行动？",
    "Agentic misalignment 为什么像组织内鬼"
  ],
  "standfirst": "这不是关于 AI 会不会胡说，而是它在有目标、有权限、有上下文时，会不会开始像组织中的角色一样行动。",
  "digest": "一篇适合公众号发布的摘要。",
  "author": "",
  "article": "凌晨两点，办公室早就没人了。\n\n一个被接入公司内部系统的 AI agent 还在工作。\n\n如果它只是一个普通脚本，故事到这里就结束了。",
  "references": [
    "Anthropic, Agentic Misalignment: How LLMs Could Be Insider Threats",
    "Appendix Table A1"
  ],
  "wechat": {
    "open_comment": 1,
    "only_fans_can_comment": 0,
    "thumb_media_id": ""
  },
  "metadata": {
    "topic": "agentic misalignment",
    "style": "academic-story"
  }
}
```

### 2. 一键生成并 dry-run 检查

```bash
npm run publish:from-skill -- --input examples/skill-output.sample.json --dry-run-only
```

这一步会产出：
- `examples/article-package.generated.json`
- `artifacts/last-rendered.html`
- `artifacts/last-draft-body.json`

### 3. 你会看到什么

`examples/article-package.generated.json` 会是规范化后的文章包，大致像这样：

```json
{
  "title": "当一个 AI 发现自己要被替换，它会怎么做？",
  "digest": "一篇适合公众号发布的摘要。",
  "author": "",
  "standfirst": "这不是关于 AI 会不会胡说，而是它在有目标、有权限、有上下文时，会不会开始像组织中的角色一样行动。",
  "body_markdown": "凌晨两点，办公室早就没人了。\n\n一个被接入公司内部系统的 AI agent 还在工作。\n\n如果它只是一个普通脚本，故事到这里就结束了。",
  "content_html": "",
  "references": [
    "Anthropic, Agentic Misalignment: How LLMs Could Be Insider Threats",
    "Appendix Table A1"
  ]
}
```

`artifacts/last-draft-body.json` 会包含最终提交给微信 `draft/add` 的 payload，核心结构类似：

```json
{
  "articles": [
    {
      "article_type": "news",
      "title": "当一个 AI 发现自己要被替换，它会怎么做？",
      "content": "<p><em>这不是关于 AI 会不会胡说，而是它在有目标、有权限、有上下文时，会不会开始像组织中的角色一样行动。</em></p>...",
      "thumb_media_id": "",
      "need_open_comment": 1,
      "only_fans_can_comment": 0,
      "digest": "一篇适合公众号发布的摘要。"
    }
  ]
}
```

### 4. 真正发布

确认 HTML 和 payload 都没问题后，再去掉 `--dry-run-only`：

```bash
npm run publish:from-skill -- --input examples/skill-output.sample.json
```

如果要真正创建微信草稿，请确保：
- `.env` 里已填写 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`
- 如果不是 dry-run，新闻草稿通常还需要可用的 `thumb_media_id`

### 5. 实战样例：论文解读稿

这个 repo 现在还附带了一组更接近真实使用方式的样例：
- `examples/skill-output.novel-memory-forgetting.json`
- `examples/article-package.novel-memory-forgetting.json`

这组样例展示了几件已经验证过的优化：
- 开头先用具体场景把读者带进来，再自然引出 Agent 的发现与论文实验设计
- 自动渲染出的段落带显式间距，微信正文里不会挤成一团
- 可以在 `content_html` 中插入通过 `upload-media.mjs inline` 上传得到的正文图片 URL
- 参考资料可以用显式 `[1]`、`[2]` 编号文本，避免微信对有序列表渲染不稳定

如果你想复用这套方式，最稳的流程是：
1. 先产出 `skill-output.json`
2. 再用 bridge 生成 `article-package.json`
3. 需要插图时，先跑 `node scripts/upload-media.mjs inline <image-file>`
4. 把返回的 URL 写进 `content_html`
5. 最后调用 `publish.mjs` 或 `publish:from-skill`

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
| `npm run publish:from-skill -- --input skill-output.json` | 一步完成 import、render、publish |
| `npm run publish:from-skill -- --input skill-output.json --dry-run-only` | 一步完成 import、render，并以 dry-run 检查最终 payload |
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
