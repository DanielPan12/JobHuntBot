# Dashboard Template

Use these CSV files as a lightweight dashboard. They can be imported into Excel, Google Sheets, Airtable, Notion, or converted into a workbook.

## Sheet Purposes

### `daily_dashboard.csv`

Daily operator summary.

Fields:

- `date`: run date.
- `found_count`: jobs found.
- `submitted_count`: confirmed submissions only.
- `skipped_count`: intentionally skipped jobs.
- `blocked_count`: attempted but automation could not complete.
- `needs_user_count`: waiting for user action.
- `pending_count`: queued for later.
- `top_sources`: LinkedIn, company sites, job boards, etc.
- `summary`: short run summary.
- `user_actions_needed`: concrete next actions for the user.

### `job_pool.csv`

Main job lead table and current state.

Fields:

- `date_found`: when the job was found.
- `company`, `job_title`, `role_family`, `level`, `location`, `remote_policy`.
- `source`, `job_url`, `posted_date`.
- `priority`: High, Medium, Low, Stretch.
- `status`: Submitted, Skipped, Blocked, Needs user, Pending, Offer, Rejected.
- `record_type` (optional): `role` by default; `company_summary` preserves research/history without counting as another submitted or ended role.
- `resume_variant`: selected resume route.
- `skip_reason`: why skipped.
- `blocker`: current blocker if any.
- `next_action`: what should happen next.
- `notes`: short context.
- `cohort_match_status`: `Yes` / `No` / `Unclear` — whether the target hiring cycle (e.g. a specific graduating class / 届 for campus recruiting) has been explicitly confirmed open for this row. Set this explicitly every time you finish checking a company; don't leave the dashboard to guess it from free-text `notes`. The dashboard's "confirmed open, not yet applied" view is driven entirely by this column.
- `current_stage`: free-text label for where an already-submitted application currently stands (e.g. "笔试", "二面"). Set by the dashboard's calendar "add/edit event" action, verbatim as typed — it does not add a suffix or normalize wording, since every company's process reads differently. Left blank until the first calendar event is scheduled for that job.

### `application_log.csv`

Audit trail for actual attempts.

Fields:

- `attempt_date`, `company`, `job_title`, `job_url`, `platform`.
- `status`: final attempt outcome.
- `submission_evidence`: what proved submission.
- `resume_used`: exact resume file or variant.
- `answers_used`: answer bank sections or custom answers used.
- `confirmation_url`, `confirmation_text`.
- `notes`.
- `job_description`: saved official posting text when available; missing historical originals must stay explicit.

### `blocker_queue.csv`

Retry and handoff queue.

Fields:

- `date`, `company`, `job_title`, `job_url`.
- `blocker_category`: CAPTCHA, login, dropdown, upload, missing material, etc.
- `what_happened`: observed failure.
- `why_blocked`: why the agent stopped.
- `can_retry`: yes/no.
- `next_retry_strategy`: browser automation, visual control, user handoff, skip.
- `user_action_needed`: exact user action.
- `status`: open, retry later, resolved, abandoned.

### `follow_up.csv`

Post-application pipeline.

Fields:

- `date`, `time`, `company`, `job_title`, `contact`, `channel`.
- `event_type`: recruiter reply, rejection, interview, assessment, follow-up. Rows added via the dashboard's calendar UI use this field as free-text event content and also copy it into `job_pool.csv`'s `current_stage` for that job.
- `deadline`, `next_action`, `status`, `notes`.

### `resume_rules.csv`

Resume routing table.

Fields:

- `role_family`.
- `resume_file_path`.
- `use_for_titles`.
- `avoid_for_titles`.
- `tailor_threshold`: external score or qualitative threshold.
- `notes`.

### `automation_rules.csv`

Lessons learned.

Fields:

- `date`.
- `rule_category`: screening, browser, ATS, answer, resume, safety.
- `rule`: new or updated rule.
- `reason`: why it exists.
- `source_blocker_or_lesson`: link to blocker, application, or observation.
- `status`: active, testing, retired.

## Counting Rules

- Count only confirmed submissions in `submitted_count`.
- Deduplicate `job_pool.csv` by company, requisition and recruiting cycle, not title alone. Preserve distinguishable, explicitly permitted repeat attempts and previous outcomes.
- `company_summary` rows retain research without inflating Applied/Rejected/Offer counts. Blank `record_type` is treated as `role` for compatibility.
- Keep `Offer` and `Rejected` separate; passing an interview does not mean an offer was received. User-reported outcomes can be recorded with source and known terms without fabricating submission history, acceptance or receipt dates.
- Pending is grouped by company and excludes companies with submitted/ended history. This display rule does not prohibit a permitted additional application. Read full records and verify current application limits.
- The action queue merges open/retry-later blockers and `Needs user` / `Blocked` roles, preserving multiple gaps and post-submission issues. Resolve the relevant blockers when the issue is actually fixed.
- Put every real application attempt in `application_log.csv`, even if it failed.
- For a fresh lead-finding-only trial, leave `application_log.csv` empty. In an existing tracker, preserve historical log rows unchanged.
- Put repeatable failures in `blocker_queue.csv`.
- Convert repeated blockers into `automation_rules.csv`.

## Integrity Checks

Use the bundled `dashboard/csv-store.js` snapshot-read and atomic-write helpers rather than manually splitting or joining CSV strings. Match dates and job descriptions by exact role; do not borrow another role's facts solely because the company matches. Preserve unknown historical facts as unknown.

From the private workspace root, run:

```sh
node dashboard/scripts/audit-data.js
node dashboard/scripts/company-categories.js --check
```

`company_categories.json` stores the user's company groups separately from CSVs. Define the three supported category labels during setup, reuse existing choices, and record dated evidence and recommendation provenance for new entries. The public package ships an empty map.

## Lead-Finding Trial Rules

For a first clean-room trial or demo:

- Find 3-5 jobs.
- Update `job_pool.csv` and `daily_dashboard.csv`.
- Use `Pending` only for jobs worth later review or application.
- Use `Needs user` when a missing high-impact fact blocks the decision, such as sponsorship, work authorization, compensation, relocation, or real resume file.
- Use `Skipped` for roles that clearly violate rules.
- Use `Blocked` only when an attempted workflow or site interaction cannot proceed.
- Do not write to `application_log.csv` unless the agent actually opened or attempted an application flow.
