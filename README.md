# JobHuntBot

**English** below · [中文](#中文说明) 在下方

An agent-led job application workflow and local progress-tracking dashboard. It works with any AI coding agent that can read a file and follow written instructions (Claude Code, Codex CLI, Cursor, etc.) — there's no special integration required, you just point the agent at `SKILL.md` and tell it to follow the workflow. It turns scattered job hunting into a repeatable system: candidate profile, screening rules, resume strategy, application execution, blocker triage, follow-up, and a browser-based dashboard to see it all at a glance.

This is not a one-click auto-apply bot. It is a structured workflow plus explicit safety boundaries — the agent fills all reachable, confirmed fields before collecting missing facts in one handoff. Final submission requires authorization, and an existing authorization remains valid within its stated scope.

## What's in this repo

```
SKILL.md                        Core agent workflow and safety contract — start here
references/
  setup-workflow.md             Step-by-step onboarding the agent should follow
  application-playbook.md       Browser/ATS handling playbook (forms, uploads, CAPTCHA, etc.)
  lead-discovery.md             Official-source coverage, role comparison and evidence checks
  safety-and-boundaries.md      Privacy, consent, and what should never be automated
templates/
  candidate_profile.template.json    Your facts: identity, contact, work authorization, targets
  application_rules.template.md      What to prioritize, consider, skip, or hand off to you
  resume_routing.template.md        Which resume/version to use for which role family
  answer_bank.template.md           Reusable truthful answers for common application questions
  experience_bank.template.md       Which internships/projects to feature per role family and JD
  application-progress.template.json Private checkpoint for resuming unfinished forms
  dashboard-template/               Empty CSV dashboard + field reference (see its README.md)
dashboard/                       A ready-to-run local dashboard (same CSV schema as the template)
  server.js                     Local Node.js server with validated outcome/calendar updates
  dashboard.html                 The dashboard UI itself
  csv-store.js / dashboard-model.js CSV integrity and dashboard counting/matching rules
  scripts/ / tests/              Data checks and regression tests
  start-dashboard.bat / .sh     One-click launcher (Windows / macOS-Linux)
  *.csv                          Empty starter data files
```

## Quick Start

1. **Download or clone this repo** to your machine (or point your coding agent at the GitHub URL).

2. **Give the agent browser access — required for actually filling out applications.** Research/lead-finding (step 5 below) can use public web sources, but step 7 in `SKILL.md` (filling out real forms and uploading a resume) needs the agent to control a real browser. Set this up once, before you ask it to apply to anything:
   - **Claude Code**: add the Playwright MCP server so the agent gets browser tools (navigate, click, type, fill forms, upload files, take snapshots):
     ```bash
     claude mcp add playwright npx '@playwright/mcp@latest'
     ```
     Restart/reopen your Claude Code session afterward so it picks up the new tools.
   - **Codex CLI or another agent**: check whether it has an equivalent browser-automation or computer-use capability (a Playwright-based MCP server, a built-in browser tool, etc.) and enable it the way that agent documents. Without it, the agent can still do everything up through lead-finding and drafting — it just can't open a real application page and submit it for you.
   - You can skip this entirely if you only want the lead-finding/dashboard-tracking half of the workflow and plan to submit applications yourself.

3. **Create a separate private working directory and put your materials there.** Keep this public repository as the reusable package. Ask the agent to copy its templates and dashboard into the private workspace, then place your resume (ideally an editable DOCX/Markdown source), transcript and project notes in that workspace's `my-materials/` folder. `.gitignore` helps with untracked files but cannot protect changes to already tracked CSVs or templates. Then tell the agent where to look:

   ```text
   My resume, transcript, and project notes are in my-materials/. Read them before we start.
   ```

4. **Start a session with your AI coding agent** (Claude Code, Codex CLI, or any agent that can read local files) in this folder and say:

   ```text
   Use SKILL.md to initialize my job search workflow.
   ```

   The agent will ask a small set of minimum-viable questions and create personal copies such as `candidate_profile.json` and `application_rules.md` in the private workspace, using the source materials and your answers. The public `templates/` files stay empty. Missing sensitive facts remain unknown until you confirm them.

5. **Run a safe first trial.** Tell the agent explicitly:

   ```text
   Do a lead-finding-only trial: find 3-5 jobs, classify them, update the dashboard, and don't open application flows or submit anything.
   ```

   This step only needs web search, not the browser automation from step 2 — it's the recommended way to see the workflow work before it touches any real application form.

6. **Open the dashboard** to see progress:
   - Windows: double-click `dashboard/start-dashboard.bat`
   - macOS/Linux: run `dashboard/start-dashboard.sh` (requires [Node.js](https://nodejs.org/) installed; `chmod +x` it once if needed)
   - This opens `http://localhost:8420/dashboard.html` in your browser. It reads the CSVs in the same folder live — every refresh shows the latest state, no build step, no external server, nothing leaves your machine.

7. **Keep applying with the agent's help**, one company at a time — this is where the browser automation from step 2 actually gets used. It updates `job_pool.csv`, `application_log.csv`, `blocker_queue.csv`, and `follow_up.csv` as it goes, and asks for submission approval only when the current application does not already have it.

### Faster Form Filling

The workflow defaults to filling a complete form section, or several predictable adjacent sections, in one browser-tool call. The agent prepares confirmed answers once, checks saved values and validation errors together, and repairs only differences. If a batch is interrupted, it checks what was saved and resumes from unfinished fields. Dependent controls still wait for real options. Local gaps do not stop independent sections; inaccessible pages and unsaved fields are recorded honestly. Existing submission authorization is reused within scope. See [the application playbook](references/application-playbook.md#batch-filling--consolidated-verification) for the execution rules.

## The Dashboard

The dashboard is a static HTML page + a tiny local Node server (no framework, no build, no external dependencies). It presents four progress views plus a consolidated action queue:

- **Applied** — rows with `status = Submitted`, with follow-up timeline and how each was submitted. Expand a card and click **"记录投递结果" (Record outcome)** at the bottom, then **"拿到 Offer" (Offer received)** or **"已挂" (Rejected)** — this writes the new status straight back into `job_pool.csv` and the job moves to the matching Offer or Rejected view on next refresh. (The local server also confirms the row still matches company + job title before writing, in case the agent updated the same file in the meantime.)
- **Pending** — companies with `status = Pending` / `Needs user` roles and no submitted/ended history, grouped by company and split into "confirmed open, not yet applied" vs. "not open / unclear" using the `cohort_match_status` column (see `templates/dashboard-template/README.md` for the full field reference).
- **Rejected** — rows marked `Rejected`, with its own count, search and category filter.
- **Offer received** — rows marked `Offer`, separately counted and filtered; passing an interview stage is not an offer.

The **Action queue** combines open `blocker_queue.csv` items with `Needs user` / `Blocked` roles, preserving multiple gaps and post-submission corrections. Applied/Rejected/Offer counts exclude `record_type=company_summary`; dates and JD match the exact role. CSV writes validate snapshots and roll back failed multi-file updates.

Below the views, a **7-day calendar** shows upcoming events (tests, interviews, anything you schedule) for jobs in the Applied bucket. Click **"+ 添加日程"** to add one: pick the date/time, search for the company/job from your already-submitted list, and type the event content freely (e.g. "二轮面试", "笔试") — whatever you type is used verbatim, since every company's process reads differently. Saving an event also stamps that job's `current_stage` in `job_pool.csv` with the same text, so the Applied card immediately shows it. Events can be edited or deleted later from the calendar; deleting one does not revert `current_stage` (there's no reliable "previous stage" to roll back to — edit it manually if needed). Calendar data lives in `follow_up.csv`.

You can open the CSVs directly in Excel/Google Sheets/Numbers too — the dashboard is a view on the same files, with writes limited to the outcome and calendar actions above.

**Important:** open the dashboard through `start-dashboard.bat`/`start-dashboard.sh`, not by double-clicking `dashboard.html` directly — the page fetches the CSVs over `http://`, which browsers block when a file is opened directly from disk.

## Safety Boundaries (read `references/safety-and-boundaries.md` for the full list)

The agent should never:

- Guess identity, work authorization, compensation, or legal facts.
- Bypass CAPTCHA, Cloudflare, or anti-bot checks, or auto-login through unknown accounts/2FA.
- Fabricate experience, credentials, or portfolio work.
- Count a saved/tracked job as a submitted application.
- Click final submit without authorization covering the current application; an unchanged, already authorized submission does not require another confirmation.

## Privacy

This repo ships empty templates and an empty dashboard — no personal data. Once you fill in `candidate_profile.json`, `job_pool.csv`, and the rest with your own information, **do not publish that filled-in copy publicly** (don't push your personal fork's data to a public repo, don't screenshot it into an issue, etc.). Keep your working copy private; only the workflow/template layer is meant to be shared.

## Validation and Public Releases

From the repository root:

```sh
node scripts/check-public-package.js
node --test scripts/check-public-package.test.js
node --test dashboard/tests/*.test.js
```

The public-package check rejects filled starter databases and forbidden private artifacts. Inspect the staged diff as well; no automated check can prove that free text or Git history is anonymous. The regression suite covers CSV parsing/atomic writes, role matching, outcome separation and the action queue. Its browser test runs when Playwright and a compatible browser are available; otherwise that test is skipped. CI runs the public-package check and available tests.

After editing data in a private operational copy, use `node dashboard/scripts/audit-data.js` and `node dashboard/scripts/company-categories.js --check`. Preserve historical gaps explicitly instead of inventing facts to clear warnings.

## License

MIT — see `LICENSE`. This project is a renamed/adapted derivative of Yvonne He's open-source *ApplyPilot* workflow; the original copyright notice is preserved in `LICENSE` (as required by its MIT license) alongside a copyright line for this adaptation.

---

## 中文说明

一个由 AI Agent 驱动的求职投递工作流,配一个本地的求职进度追踪看板。它适用于任何能读文件、能听懂并执行文字指令的编程 Agent(Claude Code、Codex CLI、Cursor 等)——不需要任何特殊的官方集成,你只需要让 Agent 打开 `SKILL.md` 并按照里面的工作流执行即可。它会把零散的投递过程变成一套可重复的系统:候选人信息、筛选规则、简历策略、投递执行、卡点处理、后续跟进,外加一个网页版进度看板。

这不是一个"一键自动海投"的机器人。它是一套结构化流程 + 明确的安全边界——先填完所有可达且已确认的内容，再集中询问未知事实。最终提交需有授权；在范围不变时沿用已经取得的授权，不重复确认。

### 这个仓库里有什么

```
SKILL.md                        Agent 核心工作流与安全约定 —— 从这里开始
references/
  setup-workflow.md             Agent 应遵循的分步初始化流程
  application-playbook.md       浏览器/ATS 操作手册(表单、上传、验证码等)
  lead-discovery.md             官方岗位搜索覆盖、比较与证据规则
  safety-and-boundaries.md      隐私、知情同意、以及绝不应自动化的事项
templates/
  candidate_profile.template.json    你的基本信息:身份、联系方式、工作资格、目标岗位
  application_rules.template.md      哪些优先投、需要人工复核、直接跳过或转交给你决定
  resume_routing.template.md         不同岗位族使用哪个简历版本
  answer_bank.template.md           常见申请问题的可复用真实回答
  experience_bank.template.md       针对不同岗位族/JD该用哪几段实习或项目经历
  application-progress.template.json 私有续填检查点
  dashboard-template/               空白CSV看板 + 字段说明(见其中的 README.md)
dashboard/                       开箱即用的本地进度看板(CSV结构与模板一致)
  server.js                     本地 Node.js 服务及结果/日程写入校验
  dashboard.html                 看板界面本体
  csv-store.js / dashboard-model.js CSV完整性及看板计数/关联逻辑
  scripts/ / tests/              数据检查与回归测试
  start-dashboard.bat / .sh     一键启动脚本(Windows / macOS-Linux)
  *.csv                          空白起始数据文件
```

### 快速开始

1. **下载或克隆本仓库**到本地(或者直接把 GitHub 地址发给你的编程 Agent)。

2. **给 Agent 配上操作浏览器的能力——真正投递表单时必须要有。** 下面第5步的"仅找岗位"调研可以使用公开网页来源,但 `SKILL.md` 第7步(填真实表单、上传简历)需要 Agent 能真正操作浏览器。建议在真正开始投递前先配好:
   - **Claude Code**:装上 Playwright MCP,让 Agent 拿到浏览器操作工具(打开页面、点击、输入、填表单、上传文件、截图等):
     ```bash
     claude mcp add playwright npx '@playwright/mcp@latest'
     ```
     装完之后重新开一个 Claude Code 会话,让它加载上新工具。
   - **Codex CLI 或其他 Agent**:去查一下它有没有对应的浏览器自动化/computer-use 能力(比如基于 Playwright 的 MCP、内置的浏览器工具等),按它自己的文档启用。没配这个也不影响"仅找岗位"调研和草拟材料这部分,只是没法真的帮你打开表单页面并点提交。
   - 如果你只想用"找岗位+看板追踪"这一半功能,自己手动投递,这一步可以完全跳过。

3. **另建私有工作目录，把原始材料放在那里。** 本仓库保留为可复用发布包，让 Agent 把模板和看板复制到私有工作区。简历（最好包含可编辑的 DOCX/Markdown 源文件）、成绩单和项目文档放到私有工作区的 `my-materials/`。`.gitignore` 能帮助排除未跟踪文件，但无法阻止已经跟踪的 CSV 或模板被填入个人数据后提交。然后告诉 Agent 去哪找:

   ```text
   我的简历、成绩单和项目经历都在 my-materials/ 里,开始之前先读一下。
   ```

4. **在这个文件夹里跟你的 AI 编程助手**(Claude Code、Codex CLI,或任何能读取本地文件的 Agent)开一个新会话,说:

   ```text
   使用 SKILL.md 帮我初始化求职工作流。
   ```

   Agent 会问一小组必要问题，结合材料和回答，在私有工作区创建 `candidate_profile.json`、`application_rules.md` 等个人文件；公开仓库的 `templates/` 保持空白。尚未确认的敏感事实留空，不会猜测。

5. **先做一次安全的试运行**,明确告诉 Agent:

   ```text
   先做一次"仅找岗位"的试运行:找3-5个岗位、分类、更新看板,不要打开投递流程也不要提交任何申请。
   ```

   这一步只需要网页搜索,不需要第2步配的浏览器自动化——建议先用这种方式看工作流跑起来是什么样子,再让它真正接触投递表单。

6. **打开进度看板**查看情况:
   - Windows:双击 `dashboard/start-dashboard.bat`
   - macOS/Linux:运行 `dashboard/start-dashboard.sh`(需要先安装 [Node.js](https://nodejs.org/);如有需要先执行一次 `chmod +x`)
   - 会在浏览器打开 `http://localhost:8420/dashboard.html`,实时读取同目录下的 CSV——每次刷新都是最新状态,不需要构建、不需要外部服务器,数据也不会离开你的电脑。

7. **在 Agent 的帮助下继续投递**,一次处理一家公司——这一步才会真正用到第2步配的浏览器自动化。它会持续更新 `job_pool.csv`、`application_log.csv`、`blocker_queue.csv`、`follow_up.csv`,尚未取得本次提交授权时才在完整核验后集中请求确认，已有授权不重复索取。

### 填报提速

工作流默认在一次浏览器工具调用中填写完整模块，条件明确时合并多个相邻模块。Agent 会集中准备已确认信息，统一核对保存结果和报错，只修复差异；批次中断后先核对已保存内容，再从未完成处续填。局部缺失不打断其他可填模块；记录尚未检查的页面和未保存内容。联动控件仍等待真实选项，最终提交沿用适用范围内的已有授权。具体执行规则见[填报操作手册](references/application-playbook.md#batch-filling--consolidated-verification)。

### 关于看板

看板是一个纯静态网页 + 一个很小的本地 Node 服务器(没有框架、不需要构建、没有外部依赖)。它提供四类进度视图及集中待办入口:

- **已投递** —— `status = Submitted` 的记录,附带后续跟进时间线和投递方式。展开某张卡片,点最下方的 **"记录投递结果"**,再选 **"拿到 Offer"** 或 **"已挂"**——会直接把新状态写回 `job_pool.csv`,刷新后这条记录就会进入对应的"拿到 Offer"或"已挂"列表。(本地服务器写入前会先核对这一行的公司+职位是否还对得上,防止 Agent 恰好同时改过这份文件导致写错行。)
- **未投递** —— `status = Pending` / `Needs user` 的岗位按公司合并，并排除已有投递或终态历史的公司，根据 `cohort_match_status` 列区分"已确认开放但还没投"和"未开放/状态不明"(完整字段说明见 `templates/dashboard-template/README.md`)。
- **已挂** —— 标记为 `Rejected` 的岗位，单独计数、搜索与分类筛选。
- **拿到 Offer** —— 标记为 `Offer` 的岗位，单独计数、搜索与分类筛选；面试过关仍记录在当前阶段，不记为Offer。

你也可以直接用 Excel/Google Sheets/Numbers 打开这些 CSV；看板使用同一份数据，通过“记录投递结果”和日程操作写回文件。

**集中待办** 汇总开放阻塞项与 `Needs user` / `Blocked` 岗位，同岗多个缺漏与提交后问题都保留。已投/已挂/Offer按准确岗位关联日志，`company_summary` 不重复计数。后端严格校验CSV、核对编辑快照，并在联动文件写入失败时回滚。

**注意:** 请通过 `start-dashboard.bat`/`start-dashboard.sh` 打开看板,不要直接双击 `dashboard.html`——页面需要通过 `http://` 读取 CSV 数据,直接从磁盘打开文件时浏览器会拦截这类请求。

### 安全边界(完整清单见 `references/safety-and-boundaries.md`)

Agent 不应该:

- 猜测身份、工作资格、薪资或法律相关的事实。
- 绕过验证码、Cloudflare 或反爬机制,或用未知账号/二次验证自动登录。
- 编造经历、学历或作品集内容。
- 把"已收藏/已追踪"的岗位算作"已投递"。
- 在没有覆盖当前申请的授权时点击最终提交；范围未变的已有授权无需重复确认。

### 隐私说明

本仓库提供的是空白模板和空白看板——不包含任何个人数据。当你按自己的信息填好 `candidate_profile.json`、`job_pool.csv` 等文件后,**请不要把填好个人信息的版本公开发布**(不要把自己 fork 出来的、填了真实数据的仓库推成公开仓库,也不要把内容截图发到 issue 里)。你自己在用的那份数据请保持私有,只有工作流/模板这一层是设计给别人复用的。

### 验证与公开发布

在仓库根目录执行:

```sh
node scripts/check-public-package.js
node --test scripts/check-public-package.test.js
node --test dashboard/tests/*.test.js
```

发布检查会拒绝已填入数据的起始数据库和禁止发布的私有文件；仍须检查暂存区差异，自动检查不能保证自由文本或 Git 历史完全匿名。回归测试覆盖 CSV解析和原子写入、岗位关联、结果分离与集中待办。浏览器测试需要 Playwright 和兼容浏览器，否则跳过这一项；CI运行发布检查及可运行的测试。

私有工作区的数据变更后，运行 `node dashboard/scripts/audit-data.js` 和 `node dashboard/scripts/company-categories.js --check`；历史缺口应明确保留，不靠猜测清除警告。

### 许可证

MIT —— 见 `LICENSE`。本项目是 Yvonne He 的开源工作流 *ApplyPilot* 的改名/改编衍生版本;按照其 MIT 许可证要求,`LICENSE` 文件中保留了原始版权声明,同时也加上了这份改编版本自己的版权行。
