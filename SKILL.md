---
name: jobhuntbot
description: "A reusable job application workflow for Codex and other AI agents. Use when a user wants to set up or run an AI-assisted job search system: collecting a candidate profile, creating an application dashboard, defining screening and resume-routing rules, finding and ranking job leads, applying to jobs within explicit safety boundaries, recording outcomes, triaging blockers, or iterating a job application workflow."
---

# JobHuntBot

JobHuntBot is a job application operating workflow for AI agents. It helps users turn job searching into a repeatable system: profile, dashboard, screening rules, resume strategy, application execution, blocker triage, and follow-up.

## Core Contract 

Optimize for truthful, traceable, interview-generating applications, not blind volume.

Treat setup as an agent-led onboarding flow, not a user homework packet. Ask only for the minimum information needed to start safely, create drafts/templates for the user, then iterate after the first trial run.

Before searching or applying, make sure the user has:

1. A candidate profile.
2. A dashboard or workbook for tracking outcomes.
3. Application screening rules.
4. A resume strategy.
5. Clear safety boundaries for browser automation and form answers.

If any source is missing, initialize it first. Do not guess identity, legal, work authorization, compensation, current employment, sponsorship, relocation, or other high-impact facts.

Once an application is authorized, complete all reachable fields supported by confirmed facts before requesting missing information. A missing answer or failed widget normally blocks that field or module, not the whole application. Follow the scope, consolidated handoff and resume rules in `references/application-playbook.md`; reuse existing authorization within its company/role/material scope.

## Workflow

### 1. Initialize the System

Read `references/setup-workflow.md` when:

- The user is installing JobHuntBot for the first time.
- The user asks to create a profile, dashboard, rules, templates, or GitHub-ready setup.
- The user has not provided enough information for safe applications.

Use the templates in `templates/` to create user-owned files:

- `candidate_profile.template.json`
- `application_rules.template.md`
- `resume_routing.template.md`
- `answer_bank.template.md`
- `experience_bank.template.md`
- `dashboard-template/*.csv`

### 2. Confirm the Company and Research the Opening

Read `references/lead-discovery.md` before finding, comparing, excluding or rechecking openings. Work one company at a time, checking the official portal with targeted and broader searches. Verify the full JD and actual eligibility text, retain official role URLs, and record coverage limits rather than equating an empty filter with no openings.

Reuse existing company categories. For a new company, apply the user's category definitions and record sourced recommendation provenance before adding its pool records. Use `record_type=company_summary` for company-level research and `role` for actual jobs. Update `cohort_match_status` explicitly as `Yes`, `No` or `Unclear` for active research rows; do not infer it from notes or inherit company-wide eligibility for every role.

Preserve prior rejected attempts while considering other permitted roles or cycles. Verify current employer limits and available slots before applying again; a rejection does not automatically restore a slot. Research and workflow repair do not authorize a new application or publication.

### 3. Screen Before Applying

Read the user's current application rules and compare actual duties, verified experience fit, work arrangements, career and business context, compensation and feasibility. A title, keyword or workplace setting alone must not determine fit. Use the configured recruiting-season policy: freshness affects urgency, while an older posting can remain open and relevant.

Skip or defer roles that violate the user's rules, are clearly overleveled, are closed or duplicate, require unsupported work authorization, need missing materials, or involve long account-heavy flows with weak fit.

This is a research/prioritization rule. Once the user authorizes filling a target, missing materials do not automatically cancel the fill pass: complete independent reachable sections, then report the affected scope and remaining prerequisites under the playbook.

### 4. Compare Specific Positions and Resume Variants

Compare multiple genuine matches at the company when available before filling. Present exact title/ID, team, city, official URL, eligibility, concrete experience evidence and gaps, work arrangements, career/business context, compensation basis and recommended resume. Report fewer matches honestly rather than padding with unrelated roles. Label facts, inferences and unknowns, following `references/lead-discovery.md`.

If a company limits applicants to one or two total submissions in the cycle, say so before the user picks. Present the role, city and recommended resume together when the choice is still open. Reuse an approved pairing or explicitly delegated selection; do not re-ask during filling or resuming. A routing recommendation alone does not authorize an application.

### 5. Match Experience to the Role

Read the chosen resume before creating structured internship and project entries. Those entries should mirror the resume and any explicit user-required additions; do not independently choose a shorter JD-matched subset from the experience bank. State the intended entries in a brief progress notice and continue the already authorized work. If the site caps entries, reuse an applicable authorized selection or queue that choice while completing independent sections; do not silently omit experiences.

Use `experience_bank.md` earlier to compare resume variants and later to support tailored free-text answers. Emphasize the verified experiences that best fit the specific JD and field length; a relevance matrix is not permission to invent facts or remove structured resume entries. Self-evaluation and cover-letter text should connect the candidate's evidence to this role rather than dump a generic biography. After submission, record which entries and materials were actually used.

### 6. Route the Resume Strategy

Use the user's chosen strategy:

- Precision mode: screen for high-fit jobs first, then tailor resume/materials before applying.
- Volume mode: use prebuilt resume variants by role family and move quickly.

Default to Volume mode unless the user explicitly asks for Precision. Individual high-fit roles can be promoted from Volume to Precision.

Preserve an approved role/resume pairing. Do not silently switch files during filling; resolve a genuinely new material choice together with other outstanding decisions.

Whenever a resume is created or tailored for a posting, treat these as acceptance criteria:

- Select the internships and projects that best support the JD from the candidate's verified experience inventory; preserve the chosen entries' material facts and avoid repetitive evidence.
- Write every internship and project entry using STAR. Across the entry's bullets, make the situation/task, the candidate's specific actions, and the result explicit. Do not invent a result or metric; if the source material cannot support a complete STAR account, obtain the missing fact or use an honest qualitative outcome.
- Sort education, internships, and projects independently in reverse chronological order. An ongoing entry comes first; otherwise compare end date, then start date when end dates tie. Do not reorder these sections by JD relevance.
- Deliver a PDF that is exactly one page and visually fills that page without overflow or a conspicuously empty bottom area. Iterate on wording, the number and length of non-duplicative bullets, spacing, and readable typography; do not omit material information merely to fit or repeat content merely to fill space.
- Render the final PDF, verify that its page count is exactly one, and inspect the rendered page before considering the tailored resume complete.

Never fabricate experience, credentials, degrees, employers, dates, work authorization, or portfolio artifacts.

### 7. Fill Out the Application

Read `references/application-playbook.md` before operating browser-based applications, LinkedIn Easy Apply, Simplify, Greenhouse, Lever, Ashby, Workday, or other ATS flows.

Read the user's `application_rules.md` for current execution preferences. Default to the playbook's **Batch Filling & Consolidated Verification**: prepare confirmed answers once, fill the largest predictable group of fields in one tool call, then inspect the saved module together and repair only discrepancies. Group adjacent simple modules when the page and controls remain predictable; avoid a separate model turn or full-page read after each field.

On a new form, prefer uploading the chosen resume first and auditing the parsed entries together. Avoid re-parsing an already repaired form unless necessary, since parsing can overwrite corrections. Fill whatever you confidently can from `candidate_profile.json`, `resume_routing.md`, `experience_bank.md` (for relevant-experience/self-evaluation fields, using the combo picked in step 5), and `answer_bank.md`. Collect questions together for anything on the `never_guess` list, anything requiring a subjective call, or anything not backed by the résumé or profile; leave those fields pending while filling independent confirmed fields. Verify saved-account bio text before retaining it in a real submission.

Do not bypass verification, login, permission or other site controls. Queue local missing facts, materials and widget failures while filling independent reachable sections. Hand off immediately only when a whole-application gate leaves no further authorized form work reachable; report uninspected pages honestly. Use `templates/application-progress.template.json` for a private resumable draft, separate from disposable working files.

### 8. Verify the Application and Submission Authorization

Before final submission, verify the whole reachable application and show a concise summary of company, role, resume, actual experiences, key answers and gaps. Reuse existing explicit submission authorization for this unchanged application, including “complete it and submit,” once required facts/materials and checks are complete. Otherwise request approval together with the consolidated missing-information review; permission to fill or an informative preview is not submission consent. A consequential change outside the authorization needs a focused decision. Verify real confirmation evidence before recording `Submitted`; inspect application history before retrying an uncertain submission to avoid duplicates.

### 9. Sync Everything — Dashboard and Profile

The bundled dashboard has separate Applied, Pending, Rejected and Offer views plus a consolidated action queue. Pending groups active leads by company and excludes companies with submitted or ended history; this display rule does not exclude permitted additional applications from research. The other progress views count role records, not `company_summary` rows. The action queue combines open/retry-later blockers and `Needs user` / `Blocked` jobs, including gaps at companies already applied to.

Every job lead or attempt must end in one of these states:

- `Submitted`: explicit confirmation was seen.
- `Skipped`: not worth applying, with reason.
- `Blocked`: automation could not proceed, with blocker and next step.
- `Needs user`: user must provide a missing high-impact fact, complete CAPTCHA/login/upload, answer a sensitive question, or make a required judgment before the agent can decide.
- `Pending`: selected for later action because it appears worth reviewing or applying after known prerequisites are satisfied.
- `Rejected`: a confirmed rejection for this application; keep its history.
- `Offer`: the user or reliable evidence confirms an offer was received. Passing an interview stage is not an offer, and receipt is not acceptance.

Count only confirmed submissions. Saved jobs, trackers, autofill badges, or "quick apply" labels do not count.

For a first trial or demo run, default to lead finding only: find, screen, classify, and update the dashboard without opening real application flows or submitting anything. In lead-finding-only runs, update `job_pool`, `daily_dashboard`, `blocker_queue`, and `automation_rules` as needed; leave `application_log` empty because no application attempt occurred.

For an existing tracker, preserve historical application logs during lead-only work. Record an externally reported offer or rejection with its confirmation source and known facts; do not fabricate a submission, receipt date, acceptance or calendar event. Preserve the original compensation wording and label any annualized calculation and unknown assumptions.

For a real submission, update the same dashboard files (`job_pool` status, `application_log` with the resume version/evidence/answers used, `follow_up` if a next step is already known, `daily_dashboard` summary) *and* the candidate's own profile: if filling the form surfaced a fact that isn't already in `candidate_profile.json` (a new internship detail, an updated exam/grade result, a preference the user stated on the spot, anything), write it back into the profile before moving on — don't let it live only in the one application you just filed. Same discipline as everywhere else in this skill: record what you've confirmed, don't invent what you haven't.

When recording a submission in `application_log`, also capture the full job description text (responsibilities and requirements) from the official posting into the `job_description` field, copied verbatim from the source — not summarized or paraphrased. This is what makes later interview prep possible without having to re-find a posting that may since have been taken down.

For the bundled CSV dashboard, use `dashboard/csv-store.js` snapshot reads and atomic writes, preserve unrelated rows, and match dates/JDs by exact role rather than borrowing another role at the company. Run `node dashboard/scripts/audit-data.js` after data edits and `node dashboard/scripts/company-categories.js --check` after discovery/classification changes. Use the relevant dashboard tests for code changes. Report historical gaps without inventing missing evidence.

### 10. Learn From Blockers

After each run, summarize blockers and convert repeated issues into rules. JobHuntBot should improve through use: address matching, dropdown handling, resume upload checks, account/session checks, and ATS-specific lessons belong in the dashboard and rules.

## Safety

Read `references/safety-and-boundaries.md` when the user asks about automation limits, CAPTCHA, email verification, account login, privacy, public sharing, or what should not be included in a repo.

Do not publish or copy private resumes, phone numbers, emails, addresses, immigration documents, application history, browser sessions, cookies, OTPs, or user-specific secrets into a public JobHuntBot package.
