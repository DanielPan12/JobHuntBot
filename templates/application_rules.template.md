# Application Rules Template

## Mode

Choose one:

- Precision: fewer applications, more tailoring.
- Volume: more applications, stable resume variants.

Selected mode:

Default: Volume. Promote a specific high-fit role to Precision when it is worth tailoring.

## First Trial Boundary

Choose one:

- Lead finding only: find, screen, classify, and update dashboard. Do not open application flows or submit.
- Review before every apply: ask the user before opening each application flow.
- Limited low-risk apply: apply to 1-3 low-risk roles only after profile, resume, sponsorship, and compensation facts are complete.

Selected first trial boundary:

Default for new users: Lead finding only.

## Prioritize

Apply quickly when a job matches:

- Role families:
- Titles:
- Level:
- Freshness:
- Locations:
- Company types:
- Industries:
- Work authorization:
- Form length:

## Consider

Review before applying when:

- Stretch role:
- Location ambiguity:
- Compensation ambiguity:
- Company fit uncertain:
- Resume variant uncertain:

## Skip

Default skip when:

- Title or level:
- Required years of experience:
- Work authorization:
- Location:
- Company or industry:
- Contract, agency, internship, or part-time:
- Long custom form:
- Missing materials:
- Duplicate or already applied:
- Closed role:

## Hand Off to User

Queue these issues and finish independent reachable sections before a consolidated handoff. Stop immediately only when a whole-application gate prevents further authorized form work:

- Legal, identity, work authorization, sponsorship, or compensation wording is unclear.
- A posting's sponsorship, authorization, relocation, or compensation requirement conflicts with a `TBD` profile field.
- CAPTCHA, Cloudflare, login, 2FA, or anti-bot appears.
- Resume upload cannot be verified.
- Portfolio, video, writing sample, references, or custom materials are required.
- The final submission should be manually reviewed.

Default form behavior:

- Fill clear basic fields automatically from Candidate Profile.
- Ask focused questions for high-impact missing facts instead of stopping the entire workflow.
- Leave voluntary self-ID blank or choose "Prefer not to say" when allowed unless exact answers are configured.
- Draft custom answers from Answer Bank patterns; collect new wording requiring confirmation for the consolidated review after filling independent fields.
- Audit and show a short summary before final submit. Reuse existing explicit submission authorization for the unchanged target and materials; otherwise request it at the final consolidated review. Permission to fill is not permission to submit.

Low-friction applications for Volume mode / first tests:

- No new account creation.
- Avoid Workday, Oracle, and long enterprise ATS by default.
- No video, long writing sample, or mandatory portfolio.
- At most one custom question.
- Clear resume upload and confirmation path.

This is a prioritization rule, not a permanent ban. Precision roles may justify long forms or Workday/Oracle after user confirmation.

## Status Classification

- `Pending`: worth later review or application, with no known high-impact blocker.
- `Needs user`: missing user-owned fact or action blocks the decision, such as sponsorship, work authorization, compensation, relocation, login, CAPTCHA, upload, or sensitive answer.
- `Skipped`: does not match rules or is not worth applying.
- `Blocked`: attempted workflow could not safely proceed.
- `Submitted`: explicit confirmation evidence was observed.
- `Rejected`: confirmed rejection for this application, preserving its history.
- `Offer`: confirmed offer received; separate from interview progress and offer acceptance.

## Freshness Policy

Use the candidate's recruiting season and target channels. Fresh postings may be more urgent, but a posting date alone does not establish eligibility, quality or whether the role remains open. Do not exclude active seasonal postings solely for being older.

Custom policy:

## Research and Company Groups

Read `references/lead-discovery.md` before drawing conclusions. Search targeted and broader official results, verify full JDs, distinguish same-title roles, compare genuine alternatives and record unreviewed scope. Apply current employer quotas and cooldowns before another application; a previous rejection is not a company-wide ban or automatic restoration of a slot.

Define company groups for this candidate (the bundled dashboard uses these labels):

- 第一类:
- 第二类:
- 第三类:

Reuse existing classifications. Store a new sourced, dated recommendation in `dashboard/company_categories.json`, using `basis: recommended` for a recommendation, `basis: user` for a user-confirmed choice, or `basis: existing` when preserving an established classification. Do not assign meaning or personal company preferences on the user's behalf.

Use `record_type=company_summary` for company research so it does not inflate application or outcome counts. Pending's company grouping is a view rule; consult full records for further research. Keep Rejected and Offer separate. Centralize open blockers and missing user facts in the action queue without hiding them after another role at the company was submitted.

## Account Policy

Use these accounts only:

- LinkedIn:
- Email:
- Job boards:

If a different account appears, stop and ask.

Before declaring a field missing, check the latest applicable profile confirmations and corrections, respecting their date and company scope. Record field/section/application blocker scope, saved versus unsaved work, unseen pages and the exact resume point with `application-progress.template.json` in a private drafts directory. Never store passwords, OTPs, cookies or session tokens.
