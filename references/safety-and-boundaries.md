# Safety and Boundaries

Use this reference for privacy, public sharing, browser automation limits, and uncertain application questions.

## Public Package Rules

Never include the user's private materials in a public JobHuntBot repo:

- Real resumes.
- Phone numbers, email addresses, addresses, or IDs.
- Immigration documents or work authorization evidence.
- Application history.
- Browser sessions, cookies, local storage, or screenshots with private data.
- OTPs or security codes.
- Private scripts that contain real job URLs, account state, or personal information.

Use templates and placeholders instead.

Keep the operational workspace separate from the public package. Before a user-authorized release, run `node scripts/check-public-package.js`, inspect the staged diff, and verify all dashboard CSVs contain headers only and `company_categories.json` has no real entries. `.gitignore` does not remove already tracked data or sanitize commit history. Share reusable rules and synthetic examples, never renamed copies of real applications, offer terms or candidate records.

## Truthfulness Rules

Do not fabricate or alter:

- Legal name.
- Work authorization.
- Sponsorship needs.
- Employment history.
- Degree, school, dates, GPA, certificates, or licenses.
- Compensation history or expectations if not provided.
- Portfolio, work samples, publications, or references.
- Disability, veteran, gender, ethnicity, or other voluntary self-ID answers.

If unsure, leave the affected answer pending and continue independent confirmed fields. Collect unresolved facts into one review after the reachable fill pass; `Needs user` records what remains, not permission to abandon other fillable sections.

## Browser Automation Boundaries

Allowed with user authorization:

- Reading public job pages.
- Filling application forms with user-provided facts.
- Uploading user-provided resumes.
- Using autofill tools as accelerators.
- Reading email verification codes if the user connected an email tool and requested it.
- Recording outcomes.

Do not proceed through unresolved gates or answer unsupported questions:

- CAPTCHA, hCaptcha, reCAPTCHA, Cloudflare, or anti-bot checks.
- Login, password, 2FA, or unknown account switching.
- Payment, subscription, or purchase prompts.
- Camera, microphone, location, or extension permission prompts.
- Missing resume, portfolio, video, writing sample, or reference materials.
- Unclear legal, identity, employment, sponsorship, or compensation questions.

Apply the smallest blocked scope. Missing materials and unclear answers usually affect a field or section: finish independent reachable work before the consolidated handoff. Login, verification, or a blocking permission prompt can require immediate handoff when no further authorized work is reachable. Follow `application-playbook.md` for saving progress, unseen sections and recovery. Reuse existing scoped authorization, but never infer a new submission or consent from permission to fill.

## Submission Counting

Only count an application after explicit evidence.

If the agent clicked submit but did not see confirmation, use supported status `Blocked` with a pending-confirmation explanation; do not invent an unsupported status or mark `Submitted`. Inspect application history before retrying to avoid a duplicate.

Record `Offer` and `Rejected` separately from submission and interview progress. A user-reported external outcome may be recorded with that source without fabricating an application-log entry or an event date. Receipt of an offer does not mean acceptance.

## User Responsibility

The user remains responsible for:

- Truthfulness of all application materials.
- Final review of sensitive answers.
- Compliance with job board and employer terms.
- Handling human verification.
- Deciding whether Volume or Precision mode matches their job search.

JobHuntBot should make the workflow more structured and less draining, not remove human responsibility.
