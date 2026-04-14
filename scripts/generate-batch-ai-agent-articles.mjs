/**
 * One-off generator: 10 skill-output JSON files for batch WeChat drafts.
 * Sources are real arXiv / venue identifiers only (no fabricated metrics).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve(process.cwd(), "examples/batch-ai-agents");
mkdirSync(outDir, { recursive: true });

const items = [
  {
    id: "01-survey-reasoning-agentic",
    ref: "arXiv:2504.09037 — A Survey of Frontiers in LLM Reasoning: Inference Scaling, Learning to Reason, and Agentic Systems (2025)",
    topic: "reasoning-agents-survey",
    titles: [
      "推理与智能体：一份新地图把前沿摆上桌",
      "从推理缩放谈到智能体系统，综述在画什么边界",
      "2504.09037：LLM 推理前沿与智能体工作流",
    ],
    digest: "2025 年一篇系统综述把推理缩放、学习推理与智能体架构放在同一框架里讨论，适合想看清术语与脉络的读者。",
    standfirst: "当论文把推理与智能体放在同一张图里，你读到的不是口号，而是一套可对照研究议程的分区。",
    body: `凌晨读综述的人，最怕两件事：概念堆成山，以及每座山都自称最重要。

arXiv:2504.09037 这篇工作选择把「推理」拆成可讨论的前沿：推理时的缩放、学习去推理，以及把模型放进工具与协作流程里的智能体系统。它更像地图，而不是判决书——告诉你哪些方向在文献里被反复加固，哪些还只是工程直觉。

读它的价值在于对齐语言：当你说智能体，是在说工具循环、规划器、还是多模型协同？当你说推理，是在说链式提示、可验证奖励、还是评测里的通过率？先把分区看清，再决定把团队资源押在哪条证据链上。

局限也诚实：综述聚合的是当下文献，落地到你们的数据、权限与风控，仍要回到小规模试验与失败日志。地图不会替你走路，但能让你少在沼泽里兜圈。

若只带走一句：先把推理与智能体的边界画清楚，再谈路线图，会少很多会议室里的平行对话。`,
  },
  {
    id: "02-multi-agent-communication",
    ref: "arXiv:2502.14321 — Beyond Self-Talk: A Communication-Centric Survey of LLM-Based Multi-Agent Systems (2025)",
    topic: "multi-agent-communication",
    titles: [
      "多智能体不是群聊：通信视角把乱象说透",
      "Beyond Self-Talk：LLM 多智能体系统缺哪块协议",
      "当模型们开始协作，瓶颈往往在消息而不是参数",
    ],
    digest: "2025 年通信中心综述梳理多智能体系统的架构、协议与评测缺口，适合负责编排与安全的工程负责人。",
    standfirst: "把多智能体想成「会说话的进程」，你会立刻看见通信成本、信任边界与失败模式。",
    body: `很多人把多智能体系统想象成开黑：模型越多，越强。工程现场更常见的画面是：消息风暴、互相覆盖的上下文、以及没人负责的中间态。

arXiv:2502.14321 从通信视角切入，讨论系统层协议与内部策略如何共同决定稳定性。它提醒一件朴素的事：协作不是自然发生的，它需要约束——谁可以写状态、谁可以发起工具调用、失败时如何回滚。

对团队而言，这意味着在设计阶段就要写清「消息契约」，而不是上线后再用日志考古。安全与成本也藏在通信里：重复推理、循环辩论、被恶意提示劫持的通道，都是真实风险。

它不会给你一套万能框架，但会让你在评审架构时多问几句：这条消息必要吗？这个权限是否过大？这个失败路径有没有 owner？

协作的优雅，往往来自克制的协议，而不是更多的模型。`,
  },
  {
    id: "03-swe-bench",
    ref: "Jimenez et al., SWE-bench: Can Language Models Resolve Real-World GitHub Issues? arXiv:2310.06770; ICLR 2024",
    topic: "swe-bench",
    titles: [
      "SWE-bench：把 GitHub 真问题摆上桌之后",
      "真仓库、真 issue：语言模型离修 bug 还有多远",
      "2310.06770：从基准看软件工程智能体",
    ],
    digest: "SWE-bench 用真实 Python 仓库 issue 评估模型改代码能力，论文揭示早期模型与真实工程之间巨大落差。",
    standfirst: "当评测从玩具函数走向真实 issue，分数会难看，但难看得更有价值。",
    body: `软件工程里有一种幻觉：模型在短代码题上漂亮，就能进仓库干活。SWE-bench 把问题换成真实 GitHub issue 与测试驱动的修复任务，让幻觉更难维持。

arXiv:2310.06770（ICLR 2024）描述的数据集规模与任务形态，迫使团队把「能写代码」细化为「能定位、能改、能通过测试、能处理跨文件依赖」。后续社区围绕它的改进与智能体框架，本质都是在补同一条证据链。

对读者而言，这篇工作的启示是：别用会刷题的指标冒充能上线。要把智能体放进 CI、放进 code review、放进可回滚的发布流程里试。

它也留下边界：基准再真，也只是快照；仓库生态、依赖地狱与企业私有代码，仍需要你们自己的评测集。

把真问题摆上桌，是进步的开始，不是终点。`,
  },
  {
    id: "04-react",
    ref: "Yao et al., ReAct: Synergizing Reasoning and Acting in Language Models, arXiv:2210.03629; ICLR 2023",
    topic: "react",
    titles: [
      "ReAct：推理与行动交错的那条细线",
      "先想一步再做一步：2210.03629 为什么仍值得读",
      "工具循环里，最老的问题仍是何时停",
    ],
    digest: "ReAct 将推理轨迹与行动交错，为后续工具型智能体提供经典范式；今天读它，是为了理解默认行为从何而来。",
    standfirst: "你以为自己在写提示词，其实往往在写一台没有刹车踏板的行为机。",
    body: `ReAct 的名字把两件事绑在一起：Reasoning 与 Acting。arXiv:2210.03629 提出的交错轨迹，让模型在生成下一步动作前，先把中间思考写出来——这在工程上极像「可审计的日志」。

今天各类智能体框架里常见的循环：观察、思考、调用工具、再观察，很大程度上是对这条范式的工程化放大。读原文的意义在于：你会看到哪些部分是研究贡献，哪些部分是后来人加的护栏。

它的边界同样清晰：思考链可被诱导、工具权限过大时会放大错误、停止条件与预算控制必须外置。把 ReAct 当圣经会出事，把它当历史坐标会省事。

若你在设计系统，问自己：没有模型自白，我还能不能追责？没有人工阈值，成本会不会在夜里失控？

范式会过时，但「可交错、可中断、可审计」的需求不会。`,
  },
  {
    id: "05-voyager",
    ref: "Wang et al., Voyager: An Open-Ended Embodied Agent with Large Language Models, arXiv:2305.16291",
    topic: "voyager-minecraft",
    titles: [
      "Voyager：在开放世界里用代码当手脚",
      "Minecraft 里的终身学习智能体长什么样",
      "2305.16291：技能库为什么会变成资产",
    ],
    digest: "Voyager 在 Minecraft 中把课程、可执行技能库与迭代提示结合，展示开放世界里的组合式学习与泛化思路。",
    standfirst: "开放世界最残酷之处，在于没有固定考纲；最迷人之处，也在于此。",
    body: `arXiv:2305.16291 的 Voyager 把「终身学习」放进一个像素世界：自动课程、可累积的技能代码库、以及把环境反馈吃回去的迭代机制。它用代码作为行动空间，让能力以可组合的方式沉淀。

对研究读者，这组设计讨论的是：记忆如何变成可复用资产，而不是一次性的长上下文。对工程读者，它提醒：没有技能沉淀的循环，只会把同样的错误以更贵的方式重复。

它也把代价摊开：黑盒大模型调用、探索预算、失败路径的调试，都需要系统层面的约束。

把开放世界当作思想实验，你会更谨慎地谈泛化：泛化不是口号，是可检索、可验证、可复用的行为碎片堆出来的。

像素世界是玩具，但问题是真的。`,
  },
  {
    id: "06-osworld",
    ref: "Xie et al., OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments, arXiv:2404.07972; NeurIPS 2024",
    topic: "osworld-gui",
    titles: [
      "OSWorld：当评测回到真桌面",
      "多模态智能体离「像人一样用电脑」还有多远",
      "2404.07972：GUI 与操作知识的双重缺口",
    ],
    digest: "OSWorld 在真实操作系统环境里评测开放任务，揭示模型与人类在桌面任务成功率上的显著差距。",
    standfirst: "桌面不是网页玩具箱；窗口、焦点与隐式状态会吃掉最漂亮的演示。",
    body: `arXiv:2404.07972（NeurIPS 2024）的 OSWorld 把评测推进真实电脑环境：跨应用、跨系统、需要执行反馈的任务。论文报告的人类与模型成功率差距，是对「智能体已可用」叙事的一盆冷水，也是更负责任的参照系。

它把难点摊开：GUI 定位、操作知识、长链条任务中的错误传播。对做产品的人，这意味着桌面自动化不能只看 demo；对做研究的人，这意味着多模态与规划必须一起被衡量。

它也提醒评测伦理与复现：真实环境涉及隐私与账户，工程化封装和去标识化同样重要。

如果智能体要进入办公场景，先把 OSWorld 这类失败案例读进心里，比先看发布会更有用。

真桌面会报复每一个省略的工程细节。`,
  },
  {
    id: "07-generative-agents",
    ref: "Park et al., Generative Agents: Interactive Simulacra of Human Behavior, arXiv:2304.03442; UIST 2023",
    topic: "generative-agents-sim",
    titles: [
      "生成式智能体：记忆、反思与小镇上的涌现",
      "当 25 个像素居民开始自己过日子",
      "2304.03442：社会模拟里哪些组件缺一不可",
    ],
    digest: "生成式智能体结合记忆、反思与规划，在沙盒小镇中展示类社会行为；论文用消融说明各模块贡献。",
    standfirst: "小镇很小，问题很大： believable 的行为从哪些机制长出来？",
    body: `arXiv:2304.03442（UIST 2023）的生成式智能体把 LLM 放进一个可交互的模拟小镇：用自然语言记录经历，把经历压缩成更高层反思，再据此规划下一步。它用可控沙盒讨论「社会性」而不是空谈。

对读者，最有力的部分往往不是派对故事本身，而是消融实验：观察、规划、反思各自缺了会怎样。它把「涌现」从修辞拉回可讨论的系统组件。

边界同样重要：这是模拟，不是人类；拟真不等于伦理安全；规模化后提示注入与角色漂移仍是硬问题。

若你做内容或游戏，你会看到叙事引擎的新可能；若你做企业智能体，你会更警惕把拟人当作信任。

 believable 是目标，不是许可证。`,
  },
  {
    id: "08-webarena",
    ref: "Zhou et al., WebArena: A Realistic Web Environment for Building Autonomous Agents, arXiv:2307.13854; ICLR 2024",
    topic: "webarena",
    titles: [
      "WebArena：网页智能体为何总在真站点上露馅",
      "长链条网页任务：成功率差距意味着什么",
      "2307.13854：从购物车到论坛，评测逼出短板",
    ],
    digest: "WebArena 构建可复现网站环境评测网页智能体，报告显示强模型与人类在长任务上的成功率差距仍然巨大。",
    standfirst: "网页看起来友好，但对机器而言到处是隐式状态与不可逆点击。",
    body: `arXiv:2307.13854（ICLR 2024）的 WebArena 把评测放到接近真实的网站生态：电商、论坛、协作开发与内容管理等多域任务。它强调功能正确性，而不是文本相似度。

这类工作的意义在于把「能聊天」与「能办事」分开。长链条任务里，错误会累积；一个误点可能让后续步骤全部偏离。论文给出的成功率对比，适合作为团队内部的冷静剂。

它也提示工程路径：检索、规划、状态跟踪、以及人类在环的兜底，往往比换更大的模型更紧迫。

网页智能体的产品化，不会由单次 benchmark 决定，但没有 benchmark，产品只会被事故教育。

让评测先残酷一点，现场就会温柔一点。`,
  },
  {
    id: "09-gaia",
    ref: "Mialon et al., GAIA: A Benchmark for General AI Assistants, arXiv:2311.12983",
    topic: "gaia-assistants",
    titles: [
      "GAIA：对人类简单、对模型难的问题集",
      "通用助手 benchmark 在测什么常识与工具",
      "2311.12983：92% 与 15% 的差距说明了什么",
    ],
    digest: "GAIA 用现实问题测试推理、多模态与工具使用；论文报告人类与带插件 GPT-4 的显著差距（以论文表述为准）。",
    standfirst: "有些问题不难写，但难在把步骤做对：这正是通用助手的痛点。",
    body: `arXiv:2311.12983 的 GAIA 把「对人类概念简单」的问题摆上来：需要多步推理、浏览与工具配合的现实任务。它的设计动机是避免只追人类越来越做不对的超难题，而忽略日常可用性。

读这篇工作的正确姿势，是对照你们内部最常见的五类工单：订票、查资料、汇总表格、跨应用复制、以及需要验证来源的问答。GAIA 不是替代你们的评测集，而是提醒：通用性不是平均数的幻觉。

它也把责任划清：插件与工具链引入新的失败面，安全与权限要同步设计。

如果助手要走进工作流，先把「人类觉得简单」的任务做稳，比刷榜更接近价值。

简单是难的另一种写法。`,
  },
  {
    id: "10-autogen",
    ref: "Wu et al., AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation, arXiv:2308.08155",
    topic: "autogen-framework",
    titles: [
      "AutoGen：多智能体会话如何变成应用脚手架",
      "把对话当作编程接口之后，组织边界在哪里",
      "2308.08155：框架热背后仍要回答的治理问题",
    ],
    digest: "AutoGen 以多智能体对话为核心抽象，推动 LLM 应用的可编排化；落地时需关注权限、审计与成本。",
    standfirst: "当对话成为编排语言，最容易被忽略的是谁对最终动作负责。",
    body: `arXiv:2308.08155 的 AutoGen 把多智能体对话推到应用层：不同角色、不同系统提示、不同工具边界，可以用对话式工作流拼装。它降低的是原型成本，不是风险成本。

对团队而言，这类框架的价值在于快速试验协作拓扑；代价在于调试复杂度随角色数上升，以及「自动」二字对非技术同事的误导。

治理问题会被放大：谁能发起金融操作？谁能访问客户数据？失败时如何归因？日志是否足以审计？

框架解决的是连接，不负责替你写制度。

把 AutoGen 当作脚手架很合适；把它当作免审的自动化，就会在某个周五晚上收到账单与律师函。

编排越灵活，责任越要写清。`,
  },
];

for (const it of items) {
  const payload = {
    title_options: it.titles,
    standfirst: it.standfirst,
    digest: it.digest,
    author: "HashClaw",
    article: it.body,
    references: [it.ref, "整理自公开论文信息；细节请以原文与官方页面为准。"],
    wechat: { open_comment: 1, only_fans_can_comment: 0, thumb_media_id: "" },
    metadata: {
      generated_by: "write-skill-academic-story+cursor-agent",
      style: "academic-story",
      topic: it.topic,
      generated_at: new Date().toISOString(),
    },
  };
  const p = resolve(outDir, `${it.id}.json`);
  writeFileSync(p, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.error("wrote", p);
}
