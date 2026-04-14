/**
 * Quality batch: fetch arXiv metadata per paper, build longer Chinese HTML
 * (hook + 译按 + 英文摘要摘录 + 落地启示), unique cover via picsum + upload.
 *
 * Run from repo root: node scripts/regenerate-batch-quality.mjs
 * Requires .env with WECHAT_APP_ID / WECHAT_APP_SECRET and IP whitelist.
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { loadDotEnv } from "./lib/env.mjs";
import { getStableAccessToken } from "./lib/wechat-api.mjs";

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchArxiv(id) {
  const url = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(id)}`;
  const res = await fetch(url, { headers: { "user-agent": "wechat-mp-auto-publish/0.2 (contact: none)" } });
  const xml = await res.text();
  const entry = xml.split("<entry>")[1]?.split("</entry>")[0] || "";
  if (!entry) throw new Error(`arXiv: no entry for ${id}`);
  const title = entry.match(/<title>([^<]*)<\/title>/)?.[1]?.replace(/\s+/g, " ").trim() || "";
  const summary = entry
    .match(/<summary>([\s\S]*?)<\/summary>/)?.[1]
    ?.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "";
  const authors = [...entry.matchAll(/<author>\s*<name>([^<]+)<\/name>/g)].map((m) => m[1].trim());
  const comment = entry.match(/<arxiv:comment[^>]*>([^<]*)<\/arxiv:comment>/)?.[1]?.trim() || "";
  const published = entry.match(/<published>([^<]+)<\/published>/)?.[1]?.trim() || "";
  return { title, summary, authors, comment, published };
}

function excerpt(text, max = 720) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

async function downloadCover(seed, outPath) {
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/630`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`cover fetch ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
}

async function uploadThumbFile(token, filePath) {
  const buf = readFileSync(filePath);
  const name = basename(filePath);
  const blob = new Blob([buf]);
  const fd = new FormData();
  fd.append("media", blob, name);
  const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${encodeURIComponent(token)}&type=image`;
  const r = await fetch(url, { method: "POST", body: fd });
  const data = await r.json();
  if (data.errcode) throw new Error(`add_material ${data.errcode}: ${data.errmsg}`);
  return data.media_id;
}

const items = [
  {
    id: "01-survey-reasoning-agentic",
    arxiv: "2504.09037",
    titles: ["TMLR 综述：推理与智能体被放在同一张地图里", "从 DeepSeek-R1 到 Deep Research：这篇综述怎么分区", "读 2504.09037：别再把推理和工具混成一个词"],
    digest: "基于 arXiv 摘要与作者列表：综述按「阶段×架构」梳理 LLM 推理与智能体工作流，并讨论学习式推理与多智能体协作趋势。",
    standfirst: "你需要的不是更多名词，而是一套能对照文献与产品路线的坐标系。",
    refLine: "Ke et al., arXiv:2504.09037v4 (TMLR survey certification, comment on arXiv).",
    lens: "这篇综述把「推理发生在推理时还是训练后」与「单体还是复合智能体」正交化，适合技术负责人做路线图对齐。",
  },
  {
    id: "02-multi-agent-communication",
    arxiv: "2502.14321",
    titles: ["多智能体通信：Beyond Self-Talk 在拆什么积木", "LLM 多智能体：协议比模型更决定上限", "读 2502.14321：把消息当作一等公民"],
    digest: "基于 arXiv 条目：从通信中心视角综述多智能体系统的架构、策略与评测挑战。",
    standfirst: "协作失败时，人们怪模型；论文更可能怪通道与协议。",
    refLine: "arXiv:2502.14321 — Beyond Self-Talk (communication-centric survey).",
    lens: "当你设计多 Agent 流水线时，先画消息图与失败回滚，再讨论 temperature。",
  },
  {
    id: "03-swe-bench",
    arxiv: "2310.06770",
    titles: ["SWE-bench：真 issue 把「能写代码」拆成可测的几步", "ICLR 2024：从 2294 个问题看语言模型修 bug 的短板", "读 Jimenez 等：为什么 Docker 评测改变了叙事"],
    digest: "基于论文摘要：真实 GitHub issue、Fail-to-Pass 测试与多文件修改需求构成的软件工程基准。",
    standfirst: "短题满分的人，未必能在仓库里活过第一轮 CI。",
    refLine: "Jimenez et al., SWE-bench, arXiv:2310.06770; ICLR 2024.",
    lens: "把智能体接进 PR 流程之前，先用 SWE-bench 类任务做「可执行诚实」的对照实验。",
  },
  {
    id: "04-react",
    arxiv: "2210.03629",
    titles: ["ReAct：交错轨迹如何把「想」和「做」绑进日志", "ICLR 2023：Yao 等的 ReAct 今天仍是工具循环的语法糖吗", "读 2210.03629：停止条件与权限仍是外置难题"],
    digest: "基于摘要：将推理与行动协同生成，以交错轨迹提升语言模型规划与工具使用表现。",
    standfirst: "没有审计轨迹的行动，只是黑箱在替你冒险。",
    refLine: "Yao et al., ReAct, arXiv:2210.03629; ICLR 2023.",
    lens: "ReAct 的价值在「可读的中间态」；工程上要把预算、权限与中断写进外层控制器。",
  },
  {
    id: "05-voyager",
    arxiv: "2305.16291",
    titles: ["Voyager：代码当技能、Minecraft 当压力锅", "开放世界里的终身学习：技能库为什么像资产表", "读 2305.16291：自动课程 + 迭代提示在学什么"],
    digest: "基于摘要：开放世界具身智能体，自动课程、可执行技能库与迭代提示机制。",
    standfirst: "像素世界里，失败便宜；真实业务里，失败昂贵——但问题形状相似。",
    refLine: "Wang et al., Voyager, arXiv:2305.16291.",
    lens: "把可复用技能沉淀成库，比把一切都塞进上下文更接近「组织记忆」。",
  },
  {
    id: "06-osworld",
    arxiv: "2404.07972",
    titles: ["OSWorld：真操作系统桌面上的多模态智能体大考", "NeurIPS 2024：人类与模型在开放任务上的差距意味着什么", "读 2404.07972：GUI 接地与操作知识为何卡住"],
    digest: "基于摘要：跨 Ubuntu/Windows/macOS 的开放任务基准，执行式评测与真实应用工作流。",
    standfirst: "桌面不是网页 demo：焦点、权限与隐式状态会吃掉最漂亮的演示稿。",
    refLine: "Xie et al., OSWorld, arXiv:2404.07972; NeurIPS 2024.",
    lens: "要做桌面自动化，先把「看得见」和「点得准」分开测，再谈端到端英雄叙事。",
  },
  {
    id: "07-generative-agents",
    arxiv: "2304.03442",
    titles: ["生成式智能体：记忆、反思、规划如何拼出小镇社会性", "UIST 2023：25 个像素居民与情人节派对实验", "读 2304.03442：涌现之前先看消融"],
    digest: "基于摘要：用自然语言记忆与反思支持行为规划，在沙盒小镇中展示互动社会行为。",
    standfirst: "拟真不等于可信；沙盒里可爱，上线前要过治理与提示注入。",
    refLine: "Park et al., Generative Agents, arXiv:2304.03442; UIST 2023.",
    lens: "产品里若出现「人格」，就要有身份边界、日志与人工兜底，而不是只换皮肤。",
  },
  {
    id: "08-webarena",
    arxiv: "2307.13854",
    titles: ["WebArena：四个域上的长链条网页任务把短板照出来", "ICLR 2024：功能正确性评测与人类的差距", "读 2307.13854：别把聊天成功率当成能办事"],
    digest: "基于摘要：可复现网站环境，电商/论坛/开发/内容管理等任务，强调功能正确性。",
    standfirst: "网页像迷宫：每一步走错，后面都在为前面买单。",
    refLine: "Zhou et al., WebArena, arXiv:2307.13854; ICLR 2024.",
    lens: "把 WebArena 类失败案例写进 PRD，比把「GPT 已可用」写进 PPT 更负责任。",
  },
  {
    id: "09-gaia",
    arxiv: "2311.12983",
    titles: ["GAIA：对人类「看起来简单」的问题，模型为何仍吃力", "通用助手 benchmark：工具、浏览与多步推理被一起考", "读 2311.12983：先别谈 AGI，先谈日常任务通过率"],
    digest: "基于摘要：面向通用 AI 助手的问题集，强调多模态、工具与现实推理。",
    standfirst: "最难的不是炫技题，而是你以为「这还用教？」的那类事。",
    refLine: "Mialon et al., GAIA, arXiv:2311.12983.",
    lens: "内部评测集里多加几道「秘书型」任务，往往比再加十道 MMLU 更有信息量。",
  },
  {
    id: "10-autogen",
    arxiv: "2308.08155",
    titles: ["AutoGen：多智能体会话作为应用脚手架意味着什么", "对话式编排：原型快了，治理慢了", "读 2308.08155：谁对最终动作签字"],
    digest: "基于摘要：以多智能体对话框架支持复杂 LLM 应用的编排与工具使用。",
    standfirst: "编排越灵活，责任越要像合同条款一样写清。",
    refLine: "Wu et al., AutoGen, arXiv:2308.08155.",
    lens: "把角色、权限、审计与预算外置，框架才能从玩具进生产。",
  },
];

function buildHtml(it, meta) {
  const abs = `https://arxiv.org/abs/${it.arxiv}`;
  const authors = meta.authors?.length ? meta.authors.join("、") : "（作者列表见 arXiv）";
  const engTitle = escapeHtml(meta.title);
  const ex = escapeHtml(excerpt(meta.summary, 900));
  const comment = meta.comment ? escapeHtml(meta.comment) : "";

  const refs = [
    it.refLine,
    `${abs}（阅读原文请以 PDF 与页面版本为准）`,
    "封面图为占位图（picsum.photos 不同 seed），仅作版式区分；正式发文可替换为自有版权图。",
  ];
  const refOl = refs.map((r) => `<li>${escapeHtml(r)}</li>`).join("");

  return [
    `<p style="margin:0 0 1em 0;line-height:1.75;"><em>${escapeHtml(it.standfirst)}</em></p>`,
    `<h2 style="margin:1.2em 0 0.5em;">开篇</h2>`,
    `<p style="margin:0 0 1em 0;line-height:1.75;">${escapeHtml(it.lens)}</p>`,
    `<p style="margin:0 0 1em 0;line-height:1.75;">下面这篇稿子的「硬信息」来自 arXiv 元数据：英文标题、作者名单、官方摘要文字（略有截断）。中文部分是我们为公众号读者写的导读与衔接，不是论文译文全文；若你要写进研报或对外材料，请回到原文核对定义、符号与结论。</p>`,
    `<h2 style="margin:1.2em 0 0.5em;">论文卡片</h2>`,
    `<p style="margin:0 0 0.5em 0;line-height:1.75;"><strong>英文题名</strong>：${engTitle}</p>`,
    `<p style="margin:0 0 0.5em 0;line-height:1.75;"><strong>作者</strong>：${escapeHtml(authors)}</p>`,
    meta.published
      ? `<p style="margin:0 0 0.5em 0;line-height:1.75;"><strong>arXiv 记录日期</strong>：${escapeHtml(meta.published)}</p>`
      : "",
    comment ? `<p style="margin:0 0 1em 0;line-height:1.75;"><strong>备注</strong>：${comment}</p>` : `<p style="margin:0 0 1em 0;line-height:1.75;"></p>`,
    `<h2 style="margin:1.2em 0 0.5em;">摘要摘录（英文）</h2>`,
    `<blockquote style="margin:0 0 1em 0;padding:0.8em 1em;border-left:4px solid #2d6cdf;background:#f7f9fc;font-size:95%;line-height:1.65;">${ex}</blockquote>`,
    `<p style="margin:0 0 1em 0;line-height:1.75;">如果你不习惯读英文摘要，可以只做一件事：把摘要里反复出现的「动词」圈出来——是 scale、是 train、是 tool、还是 collaborate。它们往往对应团队真正要投入工程化的位置。</p>`,
    `<h2 style="margin:1.2em 0 0.5em;">读法建议</h2>`,
    `<p style="margin:0 0 0.6em 0;line-height:1.75;">第一遍只回答三个问题：这篇工作定义的「任务」是什么？它把「成功」量化成什么信号？它明确承认的局限是什么？</p>`,
    `<p style="margin:0 0 0.6em 0;line-height:1.75;">第二遍再把它映射到你的场景：数据权限、工具链、评测集、以及失败时能不能回滚。没有回滚设计的智能体，只是把事故从「人点错」迁移成「模型点错」。</p>`,
    `<p style="margin:0 0 1em 0;line-height:1.75;">第三遍再去追引用树：综述类论文尤其会把读者带到更大的一片文献海里；别在第一次阅读时就要求自己「全部读完」，先固定两三个最值得跟进的分支。</p>`,
    `<h2 style="margin:1.2em 0 0.5em;">局限与诚实</h2>`,
    `<p style="margin:0 0 1em 0;line-height:1.75;">公众号导读不能替代论文阅读：我们不复述公式、不替作者下结论，也不把单篇论文写成行业终局。若摘要与你关心的细节有出入，请以 PDF 为准。</p>`,
    `<section style="margin-top:1.4em;"><h2 style="margin:0 0 0.5em;">参考资料</h2><ol style="line-height:1.7;">${refOl}</ol></section>`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  loadDotEnv();
  const outDir = resolve(process.cwd(), "examples/batch-ai-agents");
  const covDir = resolve(process.cwd(), "artifacts/batch-covers");
  mkdirSync(outDir, { recursive: true });
  mkdirSync(covDir, { recursive: true });

  const appid = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    console.error("Missing WECHAT_APP_ID / WECHAT_APP_SECRET");
    process.exit(1);
  }

  const token = await getStableAccessToken(appid, secret);
  console.error("token ok, fetching arXiv + covers…");

  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    process.stderr.write(`\n[${i + 1}/10] ${it.id} arxiv:${it.arxiv}\n`);
    const meta = await fetchArxiv(it.arxiv);
    await sleep(3500);

    const coverPath = resolve(covDir, `${it.id}.jpg`);
    await downloadCover(`${it.arxiv}-${it.id}`, coverPath);
    await sleep(800);
    const mediaId = await uploadThumbFile(token, coverPath);
    await sleep(1200);

    const html = buildHtml(it, meta);
    const payload = {
      title_options: it.titles,
      standfirst: it.standfirst,
      digest: it.digest,
      author: "HashClaw",
      article: "（正文为 HTML 版，见渲染结果）",
      content_html: html,
      source_url: `https://arxiv.org/abs/${it.arxiv}`,
      references: [it.refLine, `https://arxiv.org/abs/${it.arxiv}`],
      wechat: { open_comment: 1, only_fans_can_comment: 0, thumb_media_id: mediaId },
      metadata: {
        generated_by: "arxiv-enriched+batch-quality-script",
        style: "academic-story",
        topic: it.id,
        generated_at: new Date().toISOString(),
      },
    };

    const p = resolve(outDir, `${it.id}.json`);
    writeFileSync(p, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    process.stderr.write(`wrote ${p} thumb=${mediaId.slice(0, 12)}…\n`);
  }

  console.error("\nDone. Re-publish with: export DRY_RUN=0; for f in examples/batch-ai-agents/*.json; do … npm run publish:from-skill …");
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
