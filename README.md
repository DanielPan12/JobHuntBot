# JobHuntBot

**English** below · [中文](#中文说明) 在下方

An agent-led job application workflow and local progress-tracking dashboard. It works with any AI coding agent that can read a file and follow written instructions (Claude Code, Codex CLI, Cursor, etc.) — there's no special integration required, you just point the agent at `SKILL.md` and tell it to follow the workflow. It turns scattered job hunting into a repeatable system: candidate profile, screening rules, resume strategy, application execution, blocker triage, follow-up, and a browser-based dashboard to see it all at a glance.

This is not a one-click auto-apply bot. It is a structured workflow plus explicit safety boundaries — the agent stops and asks before guessing anything identity-, legal-, or compensation-related, and before it clicks final submit on any application.

## What's in this repo

```
SKILL.md                        Core agent workflow and safety contract — start here
references/
  setup-workflow.md             Step-by-step onboarding the agent should follow
  application-playbook.md       Browser/ATS handling playbook (forms, uploads, CAPTCHA, etc.)
  safety-and-boundaries.md      Privacy, consent, and what should never be automated
templates/
  candidate_profile.template.json    Your facts: identity, contact, work authorization, targets
  application_rules.template.md      What to prioritize, consider, skip, or hand off to you
  resume_routing.template.md        Which resume/version to use for which role family
  answer_bank.template.md           Reusable truthful answers for common application questions
  experience_bank.template.md       Which internships/projects to feature per role family and JD
  dashboard-template/               Empty CSV dashboard + field reference (see its README.md)
dashboard/                       A ready-to-run local dashboard (same CSV schema as the template)
  server.js                     Zero-dependency static file server (Node.js, no npm install)
  dashboard.html                 The dashboard UI itself
  start-dashboard.bat / .sh     One-click launcher (Windows / macOS-Linux)
  *.csv                          Empty starter data files
```

## Quick Start

1. **Download or clone this repo** to your machine (or point your coding agent at the GitHub URL).

2. **Give the agent browser access — required for actually filling out applications.** Research/lead-finding (step 4 below) only needs web search, but step 6 in `SKILL.md` (filling out real forms, uploading a resume, clicking submit) needs the agent to control a real browser. Set this up once, before you ask it to apply to anything:
   - **Claude Code**: add the Playwright MCP server so the agent gets browser tools (navigate, click, type, fill forms, upload files, take snapshots):
     ```bash
     claude mcp add playwright npx '@playwright/mcp@latest'
     ```
     Restart/reopen your Claude Code session afterward so it picks up the new tools.
   - **Codex CLI or another agent**: check whether it has an equivalent browser-automation or computer-use capability (a Playwright-based MCP server, a built-in browser tool, etc.) and enable it the way that agent documents. Without it, the agent can still do everything up through lead-finding and drafting — it just can't open a real application page and submit it for you.
   - You can skip this entirely if you only want the lead-finding/dashboard-tracking half of the workflow and plan to submit applications yourself.

3. **Put your source materials where the agent can read them.** Before onboarding, drop your resume (ideally an editable DOCX/Markdown source, not just a PDF — see `references/setup-workflow.md` for why), transcript, and any project write-ups you want it to draw on into a folder in this repo, e.g. `my-materials/`. That folder name is already listed in `.gitignore`, so if you're keeping this repo on GitHub your personal files won't get committed by accident. Then just tell the agent where to look:

   ```text
   My resume, transcript, and project notes are in my-materials/. Read them before we start.
   ```

4. **Start a session with your AI coding agent** (Claude Code, Codex CLI, or any agent that can read local files) in this folder and say:

   ```text
   Use SKILL.md to initialize my job search workflow.
   ```

   The agent will ask you a small set of minimum-viable questions (identity basics, target roles, work authorization, resume strategy — Volume vs. Precision) and fill in the files under `templates/` for you, using whatever it already read from your materials folder plus your answers. It will not guess anything sensitive; it asks when a fact matters and it's missing.

5. **Run a safe first trial.** Tell the agent explicitly:

   ```text
   Do a lead-finding-only trial: find 3-5 jobs, classify them, update the dashboard, and don't open application flows or submit anything.
   ```

   This step only needs web search, not the browser automation from step 2 — it's the recommended way to see the workflow work before it touches any real application form.

6. **Open the dashboard** to see progress:
   - Windows: double-click `dashboard/start-dashboard.bat`
   - macOS/Linux: run `dashboard/start-dashboard.sh` (requires [Node.js](https://nodejs.org/) installed; `chmod +x` it once if needed)
   - This opens `http://localhost:8420/dashboard.html` in your browser. It reads the CSVs in the same folder live — every refresh shows the latest state, no build step, no external server, nothing leaves your machine.

7. **Keep applying with the agent's help**, one company at a time — this is where the browser automation from step 2 actually gets used. It updates `job_pool.csv`, `application_log.csv`, `blocker_queue.csv`, and `follow_up.csv` as it goes, and always pauses for your explicit confirmation before a final submit.

### Faster Form Filling

The workflow defaults to filling a complete form section, or several predictable adjacent sections, in one browser-tool call. The agent prepares confirmed answers once, checks saved values and validation errors together, and repairs only differences. If a batch is interrupted, it checks what was saved and resumes from unfinished fields. Dependent controls still wait for real options, and final submission still requires your confirmation. See [the application playbook](references/application-playbook.md#batch-filling--consolidated-verification) for the execution rules.

## The Dashboard

The dashboard is a static HTML page + a tiny local Node server (no framework, no build, no external dependencies). It groups your `job_pool.csv` rows into three views:

- **Applied** — rows with `status = Submitted`, with follow-up timeline and how each was submitted. Expand a card and click **"进度已结束" (Mark as ended)** at the bottom, then **"已通过" (Passed)** or **"已被挂" (Rejected)** — this writes the new status straight back into `job_pool.csv` and the job moves to the Ended view on next refresh. (The local server also confirms the row still matches company + job title before writing, in case the agent updated the same file in the meantime.)
- **Pending** — rows with `status = Pending` / `Needs user`, split into "confirmed open, not yet applied" vs. "not open / unclear" using the `cohort_match_status` column (see `templates/dashboard-template/README.md` for the full field reference).
- **Ended** — rows marked `Offer` or `Rejected`.

Below the three views, a **7-day calendar** shows upcoming events (tests, interviews, anything you schedule) for jobs in the Applied bucket. Click **"+ 添加日程"** to add one: pick the date/time, search for the company/job from your already-submitted list, and type the event content freely (e.g. "二轮面试", "笔试") — whatever you type is used verbatim, since every company's process reads differently. Saving an event also stamps that job's `current_stage` in `job_pool.csv` with the same text, so the Applied card immediately shows it. Events can be edited or deleted later from the calendar; deleting one does not revert `current_stage` (there's no reliable "previous stage" to roll back to — edit it manually if needed). Calendar data lives in `follow_up.csv`.

You can open the CSVs directly in Excel/Google Sheets/Numbers too — the dashboard is just a nicer view on top of the same files (read-only, except for the "mark as ended" and calendar actions above).

**Important:** open the dashboard through `start-dashboard.bat`/`start-dashboard.sh`, not by double-clicking `dashboard.html` directly — the page fetches the CSVs over `http://`, which browsers block when a file is opened directly from disk.

## Safety Boundaries (read `references/safety-and-boundaries.md` for the full list)

The agent should never:

- Guess identity, work authorization, compensation, or legal facts.
- Bypass CAPTCHA, Cloudflare, or anti-bot checks, or auto-login through unknown accounts/2FA.
- Fabricate experience, credentials, or portfolio work.
- Count a saved/tracked job as a submitted application.
- Click final submit without your explicit confirmation.

## Privacy

This repo ships empty templates and an empty dashboard — no personal data. Once you fill in `candidate_profile.json`, `job_pool.csv`, and the rest with your own information, **do not publish that filled-in copy publicly** (don't push your personal fork's data to a public repo, don't screenshot it into an issue, etc.). Keep your working copy private; only the workflow/template layer is meant to be shared.

## License

MIT — see `LICENSE`. This project is a renamed/adapted derivative of Yvonne He's open-source *ApplyPilot* workflow; the original copyright notice is preserved in `LICENSE` (as required by its MIT license) alongside a copyright line for this adaptation.

---

## 中文说明

一个由 AI Agent 驱动的求职投递工作流,配一个本地的求职进度追踪看板。它适用于任何能读文件、能听懂并执行文字指令的编程 Agent(Claude Code、Codex CLI、Cursor 等)——不需要任何特殊的官方集成,你只需要让 Agent 打开 `SKILL.md` 并按照里面的工作流执行即可。它会把零散的投递过程变成一套可重复的系统:候选人信息、筛选规则、简历策略、投递执行、卡点处理、后续跟进,外加一个网页版进度看板。

这不是一个"一键自动海投"的机器人。它是一套结构化流程 + 明确的安全边界——遇到身份、法律、薪资等需要猜测的信息时会停下来问你,最终提交投递前也一定会等你明确确认。

### 这个仓库里有什么

```
SKILL.md                        Agent 核心工作流与安全约定 —— 从这里开始
references/
  setup-workflow.md             Agent 应遵循的分步初始化流程
  application-playbook.md       浏览器/ATS 操作手册(表单、上传、验证码等)
  safety-and-boundaries.md      隐私、知情同意、以及绝不应自动化的事项
templates/
  candidate_profile.template.json    你的基本信息:身份、联系方式、工作资格、目标岗位
  application_rules.template.md      哪些优先投、需要人工复核、直接跳过或转交给你决定
  resume_routing.template.md         不同岗位族使用哪个简历版本
  answer_bank.template.md           常见申请问题的可复用真实回答
  experience_bank.template.md       针对不同岗位族/JD该用哪几段实习或项目经历
  dashboard-template/               空白CSV看板 + 字段说明(见其中的 README.md)
dashboard/                       开箱即用的本地进度看板(CSV结构与模板一致)
  server.js                     零依赖静态文件服务器(仅需 Node.js,无需 npm install)
  dashboard.html                 看板界面本体
  start-dashboard.bat / .sh     一键启动脚本(Windows / macOS-Linux)
  *.csv                          空白起始数据文件
```

### 快速开始

1. **下载或克隆本仓库**到本地(或者直接把 GitHub 地址发给你的编程 Agent)。

2. **给 Agent 配上操作浏览器的能力——真正投递表单时必须要有。** 下面第4步的"仅找岗位"调研只需要网页搜索,但 `SKILL.md` 第6步(填真实表单、上传简历、点提交)需要 Agent 能真正操作浏览器。建议在真正开始投递前先配好:
   - **Claude Code**:装上 Playwright MCP,让 Agent 拿到浏览器操作工具(打开页面、点击、输入、填表单、上传文件、截图等):
     ```bash
     claude mcp add playwright npx '@playwright/mcp@latest'
     ```
     装完之后重新开一个 Claude Code 会话,让它加载上新工具。
   - **Codex CLI 或其他 Agent**:去查一下它有没有对应的浏览器自动化/computer-use 能力(比如基于 Playwright 的 MCP、内置的浏览器工具等),按它自己的文档启用。没配这个也不影响"仅找岗位"调研和草拟材料这部分,只是没法真的帮你打开表单页面并点提交。
   - 如果你只想用"找岗位+看板追踪"这一半功能,自己手动投递,这一步可以完全跳过。

3. **把你的原始材料放到 Agent 能读到的地方。** 正式开始初始化之前,把你的简历(最好是可编辑的 DOCX/Markdown 源文件,不要只有 PDF——原因见 `references/setup-workflow.md`)、成绩单、以及想让它参考的项目经历文档,放进本仓库里的一个文件夹,比如 `my-materials/`。这个文件夹名已经写进了 `.gitignore`,如果这个仓库放在 GitHub 上,个人材料不会被误提交上去。然后直接告诉 Agent 去哪找:

   ```text
   我的简历、成绩单和项目经历都在 my-materials/ 里,开始之前先读一下。
   ```

4. **在这个文件夹里跟你的 AI 编程助手**(Claude Code、Codex CLI,或任何能读取本地文件的 Agent)开一个新会话,说:

   ```text
   使用 SKILL.md 帮我初始化求职工作流。
   ```

   Agent 会问你一小组最低限度的必要问题(基本身份信息、目标岗位、工作资格、简历策略——海投 Volume 还是精投 Precision),结合它从材料文件夹里读到的内容和你的回答,帮你把 `templates/` 下的文件填好。它不会猜测任何敏感信息,遇到关键信息缺失时会主动问你。

5. **先做一次安全的试运行**,明确告诉 Agent:

   ```text
   先做一次"仅找岗位"的试运行:找3-5个岗位、分类、更新看板,不要打开投递流程也不要提交任何申请。
   ```

   这一步只需要网页搜索,不需要第2步配的浏览器自动化——建议先用这种方式看工作流跑起来是什么样子,再让它真正接触投递表单。

6. **打开进度看板**查看情况:
   - Windows:双击 `dashboard/start-dashboard.bat`
   - macOS/Linux:运行 `dashboard/start-dashboard.sh`(需要先安装 [Node.js](https://nodejs.org/);如有需要先执行一次 `chmod +x`)
   - 会在浏览器打开 `http://localhost:8420/dashboard.html`,实时读取同目录下的 CSV——每次刷新都是最新状态,不需要构建、不需要外部服务器,数据也不会离开你的电脑。

7. **在 Agent 的帮助下继续投递**,一次处理一家公司——这一步才会真正用到第2步配的浏览器自动化。它会持续更新 `job_pool.csv`、`application_log.csv`、`blocker_queue.csv`、`follow_up.csv`,并且在每次真正点击提交前,一定会停下来等你明确确认。

### 填报提速

工作流默认在一次浏览器工具调用中填写完整模块，条件明确时合并多个相邻模块。Agent 会集中准备已确认信息，统一核对保存结果和报错，只修复差异；批次中断后先核对已保存内容，再从未完成处续填。联动控件仍等待真实选项，最终提交仍需你确认。具体执行规则见[填报操作手册](references/application-playbook.md#batch-filling--consolidated-verification)。

### 关于看板

看板是一个纯静态网页 + 一个很小的本地 Node 服务器(没有框架、不需要构建、没有外部依赖)。它把 `job_pool.csv` 里的记录分成三类视图:

- **已投递** —— `status = Submitted` 的记录,附带后续跟进时间线和投递方式。展开某张卡片,点最下方的 **"进度已结束"**,再选 **"已通过"** 或 **"已被挂"**——会直接把新状态写回 `job_pool.csv`,刷新后这条记录就会出现在"已结束"里。(本地服务器写入前会先核对这一行的公司+职位是否还对得上,防止 Agent 恰好同时改过这份文件导致写错行。)
- **未投递** —— `status = Pending` / `Needs user` 的记录,根据 `cohort_match_status` 列区分"已确认开放但还没投"和"未开放/状态不明"(完整字段说明见 `templates/dashboard-template/README.md`)。
- **已结束** —— 标记为 `Offer` 或 `Rejected` 的记录。

你也可以直接用 Excel/Google Sheets/Numbers 打开这些 CSV——看板在同一份数据上提供了更好看的视图(除了上面的"标记结束"操作外都是只读的)。

**注意:** 请通过 `start-dashboard.bat`/`start-dashboard.sh` 打开看板,不要直接双击 `dashboard.html`——页面需要通过 `http://` 读取 CSV 数据,直接从磁盘打开文件时浏览器会拦截这类请求。

### 安全边界(完整清单见 `references/safety-and-boundaries.md`)

Agent 不应该:

- 猜测身份、工作资格、薪资或法律相关的事实。
- 绕过验证码、Cloudflare 或反爬机制,或用未知账号/二次验证自动登录。
- 编造经历、学历或作品集内容。
- 把"已收藏/已追踪"的岗位算作"已投递"。
- 在没有你明确确认的情况下点击最终提交。

### 隐私说明

本仓库提供的是空白模板和空白看板——不包含任何个人数据。当你按自己的信息填好 `candidate_profile.json`、`job_pool.csv` 等文件后,**请不要把填好个人信息的版本公开发布**(不要把自己 fork 出来的、填了真实数据的仓库推成公开仓库,也不要把内容截图发到 issue 里)。你自己在用的那份数据请保持私有,只有工作流/模板这一层是设计给别人复用的。

### 许可证

MIT —— 见 `LICENSE`。本项目是 Yvonne He 的开源工作流 *ApplyPilot* 的改名/改编衍生版本;按照其 MIT 许可证要求,`LICENSE` 文件中保留了原始版权声明,同时也加上了这份改编版本自己的版权行。
