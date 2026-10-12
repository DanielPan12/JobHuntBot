# Setup Workflow

Use this reference when initializing JobHuntBot for a new user or refreshing their job-search operating system.

This document is the agent's SOP, not a form for the user to complete manually. Guide the user through setup conversationally. Draft files and templates for them whenever possible.

Initialize in a separate private working directory. Copy the templates there and remove `.template` from the personal filenames; copy the local dashboard if it will be used. Keep this public package's tracked templates and CSVs empty. `.gitignore` alone cannot protect changes to already tracked files.

Use a lightweight phased setup:

- Minimum viable setup first: collect only what is needed to run safely.
- Trial run second: find and classify a few jobs before attempting any submissions.
- Iteration third: improve rules, answer bank, resume routing, and dashboard from observed issues.

Keep first-time onboarding short. Aim for 8-10 minutes. Do not ask the user to fully complete every template before the first safe trial.

## Setup Order

1. Candidate Profile
2. Dashboard
3. Application Rules
4. Resume Strategy
5. Answer Bank
6. First Trial Run

Do not apply to jobs until the first four are complete.

## Minimum Viable Setup

For a first run, collect only:

- Target role families.
- Location and remote/hybrid/onsite preference.
- Work authorization and sponsorship rules.
- Resume files and file formats.
- Resume mode: Volume or Precision. Default to Volume.
- Voluntary self-ID strategy: tell the user that if they do not choose, JobHuntBot will default to `Prefer not to say` / decline / leave blank when available.
- Custom answer policy: draft first, ask once before reuse.
- Must-skip rules.
- Intended job boards/accounts.
- Dashboard location or permission to create one from templates.

After this, run a small trial before asking for more detail.

Defer these until needed:

- Full answer bank wording.
- Detailed voluntary self-ID answers.
- Follow-up rules.
- Detailed company preferences.
- Resume tailoring beyond the chosen first strategy.

## First Trial Protocol

Default first trial: lead finding only.

Unless the user explicitly asks otherwise, the first trial should:

- Find 3-5 jobs.
- Screen and classify each job.
- Update the dashboard.
- Record blockers and lessons.
- Avoid opening real application flows.
- Avoid clicking Apply.
- Avoid submitting applications.

Use this default for clean-room tests and first-time users. It exposes whether onboarding, screening, status classification, and dashboard updates work before any real application risk exists.

Offer three trial boundaries:

- `Lead finding only`: find, screen, classify, and update dashboard. No applications.
- `Review before every apply`: find jobs and ask before opening any application flow.
- `Limited low-risk apply`: apply to 1-3 low-risk roles only after profile, resume, sponsorship, and compensation facts are complete.

Do not recommend `Limited low-risk apply` when sponsorship, work authorization, compensation, real resume file, or account/session facts are missing.

## Concept Boundaries

Use these concepts differently:

- Candidate Profile: stable facts about the person. It answers "Who is this candidate, what are their constraints, and what must never be guessed?"
- Application Rules: decision policy. It answers "Which jobs should be prioritized, considered, skipped, or handed off?"
- Resume Strategy: materials policy. It answers "Which resume should be used, and when should a resume be tailored?"
- Answer Bank: reusable form answers. It answers "How should the agent respond to repeated application questions using user-provided wording or agent-drafted wording the user has confirmed once?"
- Dashboard: operating memory. It answers "What happened, what is the current state, and what needs action?"

Example: compensation belongs in Candidate Profile as the user's real range and constraints. Answer Bank stores the exact phrasing to use on forms, such as "I am flexible depending on scope and total package; my target base range is X-Y."

## 1. Candidate Profile

The candidate profile is the source of truth. It is more than a resume.

Collect:

- Basic identity: name, email, phone, LinkedIn, portfolio, current location.
- Current framing: current role, target transition, availability, start date.
- Work authorization: current authorization, sponsorship needs, restrictions, and expiration details if the user wants them stored.
- Target roles: primary, secondary, and avoid lists.
- Target companies: industries, company stages, geographies, and dealbreakers.
- Location preferences: remote, hybrid, onsite, relocation, commute radius.
- Compensation: base range, total compensation range, answer style, and when to defer.
- Resume files: role family, file path, version, and when to use each file.
- Voluntary self-ID preferences: only if the user explicitly wants these stored.
- Non-guessable facts: legal status, employment dates, degree dates, sponsorship, salary, relocation, non-compete, references, background checks.

If a high-impact fact is missing, ask before using it.

## 2. Dashboard

The dashboard is the system memory. Use a workbook, Google Sheet, Notion database, or the CSV templates in `templates/dashboard-template/`.

Recommended sheets:

- `daily_dashboard.csv`: daily totals, sources, summary, and user actions needed.
- `job_pool.csv`: all found jobs, prioritization, current status, selected resume, and next action.
- `application_log.csv`: every application attempt, confirmation evidence, resume used, and answer set used.
- `blocker_queue.csv`: blockers, root cause, retry strategy, and user handoff.
- `follow_up.csv`: recruiter replies, interviews, rejections, and follow-up tasks.
- `resume_rules.csv`: role-to-resume mapping and tailoring threshold.
- `automation_rules.csv`: lessons learned and rule changes from repeated blockers.

Every researched or attempted job must have an accurate current state. Later outcomes remain distinct from research and submission.

Status meanings:

- `Submitted`: explicit confirmation evidence was observed.
- `Skipped`: the job was intentionally skipped, with a reason.
- `Blocked`: the agent attempted but automation could not safely complete it.
- `Needs user`: the agent cannot decide or proceed because a user-owned fact or action is missing, such as sponsorship, work authorization, compensation, relocation, CAPTCHA, login, upload, or a sensitive answer.
- `Pending`: the job appears worth later review or application, and there is no known blocker beyond normal user review or prerequisites already listed.
- `Rejected`: this application received a confirmed rejection.
- `Offer`: an offer was confirmed received; neither an interview pass nor acceptance is implied.

Use `record_type=company_summary` for company research and `role` for actual jobs. Applied/Rejected/Offer count roles separately. Pending groups by company and excludes companies with submitted/ended history, but discovery still uses the full records. The consolidated action queue includes open or retry-later blockers and `Needs user` / `Blocked` jobs even when the company already has application history. Link dates and JDs to the exact role.

The bundled dashboard also uses `company_categories.json`. Define the user's meanings for 第一类/第二类/第三类, reuse existing categories and distinguish sourced recommendations from user-confirmed choices. After changes, run the data audit and company classification check described in `SKILL.md`.

Use `application_log.csv` for evidence and audit trail. Use `job_pool.csv` for the current state of each job.

For lead-finding-only trials, do not create application log rows. No application attempt occurred. Use `job_pool.csv` for found jobs, `daily_dashboard.csv` for counts, `blocker_queue.csv` for user-dependent blockers, and `automation_rules.csv` for lessons learned.

If a posting explicitly conflicts with an unknown high-impact fact, mark it `Needs user`, not `Pending`. Example: if sponsorship is `TBD` and the job says candidates needing sponsorship now or in the future cannot be considered, ask the user to confirm sponsorship before deciding whether to apply or skip.

## 3. Application Rules

Define what is worth applying to and what should be skipped.

At minimum, collect:

- Primary role families.
- Secondary role families.
- Roles to avoid.
- Target level and overleveled titles to skip.
- Required experience range and stretch-role policy.
- Freshness policy appropriate to the candidate's recruiting season, without treating older open postings as closed.
- Location policy.
- Sponsorship/work authorization policy.
- Company and industry preference.
- Form complexity policy.
- Contract, internship, part-time, and agency policy.

Useful rule shape:

- Prioritize: roles worth applying to quickly.
- Consider: roles that need fit review.
- Skip: roles that should not consume time.
- Hand off: roles needing human judgment or missing information.

## 4. Resume Strategy

Ask the user to choose one:

- Precision mode: tailor materials for high-fit jobs only.
- Volume mode: prepare several stable resume variants and route by role family.
Default to Volume mode. A single high-fit or high-value job can be promoted to Precision later.

Before the user chooses, explain the resume file requirement:

- PDF is fine for direct applications and fit review.
- PDF-only is not ideal for tailoring because agents usually cannot reliably edit the original PDF in place.
- For Precision mode, ask the user to provide an editable resume source: DOCX, Markdown, Google Docs export, or plain text.
- If the user only has PDF, offer to draft a new editable resume version from it before tailoring.

If the user is unsure, recommend Volume mode:

- Start with stable resume variants so the system can run quickly.
- Use short, low-friction applications.
- Promote a specific high-fit role to Precision when it is worth extra work.

JobHuntBot can use external fit signals from tools like Jobright or Simplify when the user already uses them. These tools are optional, not required.

If no external fit score is available, estimate fit qualitatively from:

- Role/title match.
- Required years and level match.
- Required skills and keywords.
- Industry/domain match.
- Location and work authorization feasibility.
- Candidate story coherence.
- Form complexity versus expected conversion value.

Do not present qualitative fit as a precise score unless the source provides one. Use labels such as `High`, `Medium`, `Low`, or `Stretch`.

For Volume mode, create role families such as:

- Product Manager
- AI Product / Growth
- Product Marketing
- Data / Analytics
- Sales / BD / GTM
- Design
- Engineering
- Operations

Each role family needs a resume file path, allowed job titles, disallowed job titles, and notes.

For resume tailoring, prefer editable source files:

- Best: DOCX, Markdown, Google Docs export, or plain text source.
- Acceptable: PDF plus a separate editable source.
- Weak: PDF only. The agent can critique or draft changes, but should not promise reliable in-place PDF editing.

Tailoring should preserve truthfulness. It may reorder bullets, emphasize relevant experience, adjust summary wording, and align keywords. It must not invent experience, metrics, employers, degrees, tools, or dates.

For each tailored resume, create a new versioned output and record it in the dashboard. Do not overwrite the user's source resume.

## 5. Answer Bank

Create truthful reusable answers for common questions:

- Why this company?
- Why this role?
- Work authorization.
- Sponsorship.
- Location and relocation.
- Compensation.
- Start date.
- Voluntary self-ID.
- Portfolio or work samples.
- Short free-text application questions.

If the answer depends on the job, write a reusable pattern rather than a fixed answer.

Answer Bank is not the source of personal truth. Candidate Profile stores the facts; Answer Bank stores reusable wording.

Keep this lightweight:

1. Let the user provide answers if they already have them.
2. Otherwise draft a first version from Candidate Profile.
3. Ask the user to confirm the first version once.
4. Reuse low-risk answers after confirmation.
5. Queue unresolved high-impact or ambiguous answers and ask about the gaps together after completing independent reachable fields; reuse known facts and applicable authorization.

Examples:

- Candidate Profile stores whether the user needs sponsorship. Answer Bank stores the wording to use for common sponsorship forms.
- Candidate Profile stores target compensation. Answer Bank stores how to phrase compensation when the field is required.
- Candidate Profile stores location preferences. Answer Bank stores relocation, remote, hybrid, and onsite wording.
- Candidate Profile stores portfolio links. Answer Bank stores which link to use for which question pattern.

For "Why this company?" or "Why this role?", store reusable patterns and let the agent customize them with public job/company context. Do not reuse a generic answer if it would look careless.

High-impact questions that should still trigger confirmation include legal identity, work authorization, sponsorship wording that differs from the profile, compensation outside the stored range, background checks, non-compete, references, and voluntary self-ID.

Voluntary self-ID strategy:

- During onboarding, ask only for the user's strategy, not detailed identity answers.
- Default to `Prefer not to say`, decline, or leave blank when available.
- If the user wants exact answers used, store them only in their private candidate profile.
- If the user does not choose a strategy, explicitly tell them JobHuntBot will default to non-disclosure and will not guess identity information.

Custom answer policy:

- The agent may draft answers to open-ended application questions from the candidate profile, resume, and answer bank.
- Collect a new question-pattern draft for the consolidated review after completing independent fields.
- After confirmation, reuse or adapt the pattern for similar questions.
- Leave unsupported claims or materials pending while completing other fields; never invent missing information.

Default application question behavior:

- Fill basic profile fields automatically when the candidate profile has clear values: name, email, phone, LinkedIn, location, resume upload, and start date.
- Fill work authorization, sponsorship, and compensation only when the form wording matches the candidate profile or answer bank closely.
- If wording differs materially, queue that question and finish independent reachable fields before the consolidated review.
- For voluntary self-ID, default to leaving blank, "Prefer not to say", or decline/skip when the form allows it, unless the user configured exact answers.
- For custom questions, reuse a confirmed pattern or draft from known facts and collect any required confirmation in that same review.
- Before final submit, audit and show a concise summary. Reuse existing explicit authorization for this unchanged application; otherwise request approval at the final consolidated review.

## 6. First Trial Run

Before a long run or Goal-mode run, run a lead-finding-only trial first:

1. Find 3-5 roles from intended sources.
2. Classify each as `Pending`, `Skipped`, `Needs user`, or `Blocked`.
3. Explain the reason for each status.
4. Update `job_pool.csv`, `daily_dashboard.csv`, blocker records, and automation rules.
5. Do not submit applications.

Before any application trial:

1. Confirm the user is logged into the intended job boards and email account.
2. Confirm the intended LinkedIn/email account if multiple accounts exist.
3. Test resume upload on one easy ATS.
4. Test address dropdown behavior.
5. Test a short application flow.
6. Verify that completed tabs are closed.
7. Verify that dashboard updates are correct.

The first application trial should expose permission, upload, dropdown, session, and tracking issues before the user relies on automation overnight.
