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

When the user names a specific company (or you're evaluating one you found), work it one company at a time:

- Check whether the company already has a row in `job_pool`. If not, add one (role family, target city, etc.) before doing anything else — every company you touch should be traceable in the dashboard.
- Confirm whether the target class/届 recruiting cycle is actually open, not just "the company has a careers page." Search the company's own official site/campus portal first for the specific application entry point (not just the homepage). Cross-check with a general web search to corroborate posting dates and see if the role is still live.
- Watch for the "internship confirmed, full-time not confirmed" trap and the "届/year label doesn't match the actual eligibility window" trap — both have burned real trials. Don't mark a role as confirmed-open on a hedge-word search summary; write down the actual eligibility text.
- Write findings back into `job_pool` immediately (job_url, next_action, notes, and a status update if warranted) — don't hold research in your head until the end of the session.
- If you add a structured status column to `job_pool` for tracking a specific recurring question (e.g. whether a hiring cycle is confirmed open), set it explicitly every time you finish checking a row rather than leaving the dashboard to infer it from free-text `notes` — notes-based regex guessing quietly rots into false positives once notes get detailed. A stale structured column means the dashboard won't reflect what you just learned, even after a refresh.

### 3. Screen Before Applying

Prioritize jobs by freshness, fit, feasibility, and conversion likelihood. Default to fresh jobs from the last 24 hours, then 48 hours if needed.

Skip or defer roles that violate the user's rules, are clearly overleveled, are closed or duplicate, require unsupported work authorization, need missing materials, or involve long account-heavy flows with weak fit.

### 4. Shortlist Specific Positions and Let the User Choose

Once a company's opening is confirmed, don't jump straight to filling out a form. Find the *specific* postings that match the user's target role families (search the portal by keyword — job categories on a careers site often don't literally say "supply chain" even when a matching role exists) and present a short list: title, one-line fit summary, level/eligibility, location, and whether it's full-time campus recruiting (not an internship or a stale prior-cycle posting).

If a company limits applicants to one or two total submissions in the cycle, say so before the user picks — it changes the decision. Let the user pick which posting to pursue; only proceed on your own initiative if the user has already named the exact posting.

### 5. Match Experience to the Role

Before touching the application, decide which of the candidate's experiences to actually feature for this specific posting — this is a separate decision from which resume file to use.

- Check `experience_bank.md` (created from `templates/experience_bank.template.md` during setup) for the target role family's candidate pool — it deliberately keeps a wide, overlapping pool per role family (aim for 3-5 internships + 3+ projects rated `强`/`中`, fewer only where the candidate's real background is genuinely thin in that direction) rather than one narrow "owned" set, since closely related role families usually share supporting evidence.
- Read this posting's actual JD and pick 2-4 experiences from that candidate pool that best fit it — favor `强` matches, but a `中` match that happens to hit something the JD specifically calls out can outrank a `强` match that doesn't. If the JD emphasizes something the whole pool underrepresents, pull in a different experience from the full inventory instead of forcing a weak fit.
- **Before using them, tell the user which experiences (internships and projects) were selected for this application and why.** Keep it short (a list of names + one-line reasoning), but always surface it as a checkpoint — don't silently pick and move on.
- Use the selected 2-4 experiences — not the full inventory — when answering resume-adjacent free-text fields: "relevant experience/project" custom questions, self-evaluation/cover-letter fields (synthesize personality + the selected experiences + this specific company/role fit; don't dump a generic bio), and Precision-mode resume bullet emphasis.
- After submitting, note which experiences were actually used in `application_log`'s notes — this lets a later application to a similar role or company reuse the same reasoning instead of re-deriving it.
- Same truthfulness rule as everywhere else: reorder, select, and emphasize freely; never invent, exaggerate, or stretch an experience to make it look like a better fit than it is. If nothing in the bank fits well, say so and use the closest honest match.

### 6. Route the Resume Strategy

Use the user's chosen strategy:

- Precision mode: screen for high-fit jobs first, then tailor resume/materials before applying.
- Volume mode: use prebuilt resume variants by role family and move quickly.

Default to Volume mode unless the user explicitly asks for Precision. Individual high-fit roles can be promoted from Volume to Precision.

Never fabricate experience, credentials, degrees, employers, dates, work authorization, or portfolio artifacts.

### 7. Fill Out the Application

Read `references/application-playbook.md` before operating browser-based applications, LinkedIn Easy Apply, Simplify, Greenhouse, Lever, Ashby, Workday, or other ATS flows.

Read the user's `application_rules.md` for current execution preferences. Default to the playbook's **Batch Filling & Consolidated Verification**: prepare confirmed answers once, fill the largest predictable group of fields in one tool call, then inspect the saved module together and repair only discrepancies. Group adjacent simple modules when the page and controls remain predictable; avoid a separate model turn or full-page read after each field.

On a new form, prefer uploading the chosen resume first and auditing the parsed entries together. Avoid re-parsing an already repaired form unless necessary, since parsing can overwrite corrections. Fill whatever you confidently can from `candidate_profile.json`, `resume_routing.md`, `experience_bank.md` (for relevant-experience/self-evaluation fields, using the combo picked in step 5), and `answer_bank.md`. Collect questions together for anything on the `never_guess` list, anything requiring a subjective call, or anything not backed by the résumé or profile; leave those fields pending while filling independent confirmed fields. Verify saved-account bio text before retaining it in a real submission.

Stop or hand off for CAPTCHA, Cloudflare, anti-bot checks, login or 2FA, unclear legal/identity questions, missing files, payment prompts, permission prompts, or anything that would require bypassing a site control.

### 8. Preview, User Confirms, Submit

Before the final submit click, show the user a summary (company, role, resume version, the internship/project experiences selected in step 5, key answers, compensation figures). **Do not click final submit until the user explicitly says to** — a preview screen is not consent. After submitting, look for real confirmation evidence (success text, a thank-you/confirmation URL, a candidate ID) before recording anything as `Submitted`.

### 9. Sync Everything — Dashboard and Profile

Every job lead or attempt must end in one of these states:

- `Submitted`: explicit confirmation was seen.
- `Skipped`: not worth applying, with reason.
- `Blocked`: automation could not proceed, with blocker and next step.
- `Needs user`: user must provide a missing high-impact fact, complete CAPTCHA/login/upload, answer a sensitive question, or make a required judgment before the agent can decide.
- `Pending`: selected for later action because it appears worth reviewing or applying after known prerequisites are satisfied.

Count only confirmed submissions. Saved jobs, trackers, autofill badges, or "quick apply" labels do not count.

For a first trial or demo run, default to lead finding only: find, screen, classify, and update the dashboard without opening real application flows or submitting anything. In lead-finding-only runs, update `job_pool`, `daily_dashboard`, `blocker_queue`, and `automation_rules` as needed; leave `application_log` empty because no application attempt occurred.

For a real submission, update the same dashboard files (`job_pool` status, `application_log` with the resume version/evidence/answers used, `follow_up` if a next step is already known, `daily_dashboard` summary) *and* the candidate's own profile: if filling the form surfaced a fact that isn't already in `candidate_profile.json` (a new internship detail, an updated exam/grade result, a preference the user stated on the spot, anything), write it back into the profile before moving on — don't let it live only in the one application you just filed. Same discipline as everywhere else in this skill: record what you've confirmed, don't invent what you haven't.

When recording a submission in `application_log`, also capture the full job description text (responsibilities and requirements) from the official posting into the `job_description` field, copied verbatim from the source — not summarized or paraphrased. This is what makes later interview prep possible without having to re-find a posting that may since have been taken down.

### 10. Learn From Blockers

After each run, summarize blockers and convert repeated issues into rules. JobHuntBot should improve through use: address matching, dropdown handling, resume upload checks, account/session checks, and ATS-specific lessons belong in the dashboard and rules.

## Safety

Read `references/safety-and-boundaries.md` when the user asks about automation limits, CAPTCHA, email verification, account login, privacy, public sharing, or what should not be included in a repo.

Do not publish or copy private resumes, phone numbers, emails, addresses, immigration documents, application history, browser sessions, cookies, OTPs, or user-specific secrets into a public JobHuntBot package.
