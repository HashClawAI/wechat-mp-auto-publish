# 贡献与合并流程

本仓库对 **GitHub 上 `main` 的更新**采用统一流程：**提 PR → 审查 → 人类批准 → Merge**。请勿在 `main` 上直接推送功能性改动（与 Cursor 项目规则一致）。

## 标准流程

1. **同步默认分支**  
   `git fetch origin && git checkout main && git pull origin main`

2. **从 `main` 拉特性分支**  
   `git checkout -b feat/简短描述` 或 `fix/…` / `docs/…`

3. **在分支上提交并推送**  
   `git push -u origin HEAD`

4. **打开 Pull Request**  
   使用 GitHub 网页或 `gh pr create`，填写摘要、风险与验证方式（例如本地跑过的命令）。

5. **审查**  
   由仓库维护者或 `CODEOWNERS` 指定人员进行 code review；需要时在 PR 中 `@` 审查者。

6. **人类批准与合并**  
   在审查与必选检查（若已配置 CI）满足要求后，由**有权限的人类**执行 Merge（squash / merge commit 以团队约定为准）。**自动化或 Agent 不得在对话中声称已获人类 Approve**。

7. **合并后**  
   贡献者本地：`git checkout main && git pull origin main`

## 与 Cursor 规则的关系

编辑器内 Agent 行为由 **[`.cursor/rules/github-pr-first.mdc`](.cursor/rules/github-pr-first.mdc)** 约束；本文档面向所有通过浏览器或 CLI 协作的贡献者，要求一致。

## 仓库侧建议（维护者）

在 GitHub **Settings → Branches → Branch protection rules** 中为 `main` 建议开启：

- Require a pull request before merging  
- Require approvals（至少 1）  
- 按需：Require status checks to pass  

这样即使本地误操作直接 `git push origin main`，也会被服务端拒绝，与文档及 Cursor 规则形成双保险。

## 极小改动的例外

仅 typo、仅元数据等**极小且团队明确允许**的维护提交，若策略允许直推 `main`，仍应在 PR 或团队频道**留一句说明**；无共识时一律走 PR。
