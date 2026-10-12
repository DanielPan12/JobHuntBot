# Application Playbook

Use this reference for browser-based job applications, LinkedIn Easy Apply, Simplify, Greenhouse, Lever, Ashby, Workday, and other ATS pages.

## Global Rules

- Count only confirmed submissions.
- Prefer short, reliable paths over long custom forms.
- Close each completed or skipped job tab before moving on.
- Keep only tabs that need user handoff.
- Record every outcome in the dashboard.
- Do not bypass verification or guess high-impact answers. Isolate the affected scope and complete independent authorized work.
- Fill all reachable confirmed fields, collect unresolved items, and submit only with explicit authorization that covers the current application. Existing scoped authorization need not be repeated.

## Completion Scope and Interruption Rules

The goal of a fill pass is to exhaust reachable, independent work, not merely finish one tool batch. A tool result, module save, or local validation error is not by itself a reason to end the turn or ask the user to take over.

1. **Resolve sources and authorization once.** Read the current conversation, private rules, candidate profile (including dated confirmations and application-specific updates), chosen resume, answer bank, and existing draft. Record the target company/role/cycle, resume and authorized actions. For a fact, prefer the latest applicable user confirmation or explicit correction over older defaults; use scope as well as date. Candidate Profile owns facts, Answer Bank owns phrasing, Resume Routing owns material selection, and application logs own historical outcomes. A per-company salary, consent, start date, adjustment preference, or placeholder is not a general preference. Do not mistake a newer upload authorization for a new personal fact. When sources genuinely conflict without a clear correction, queue only that fact. Do not re-ask a confirmed value just because it is absent from the first profile section read.
2. **Map the reachable form.** Inspect visible sections, tabs, required/optional fields, attachments, parsed entries and validation messages. Record sections hidden behind a required-field gate as `unreachable` or `uninspected`, not complete. Open other sections through the site's supported navigation when safe; do not clear correct data or trigger submission to explore. Upload the chosen resume before manual repair when practical, then audit the parsed result.
3. **Classify each unresolved item by scope.** `field`: one missing answer, unknown date or failed widget; `section`: a required field prevents saving or advancing that module; `application`: login, CAPTCHA/anti-bot, permission, or navigation gate makes all remaining form work unreachable. Record the actual observed scope; an upload failure or sensitive question is not automatically application-wide. For a local technical failure, inspect once and try one targeted supported alternative; stop retrying that control if it still fails and continue elsewhere. Never bypass a control or supply invented values to unlock later pages.
4. **Complete every independent reachable section.** Fill and verify known values, all selected experiences, user-required optional sections and authorized files. Missing portfolio/video, unclear salary/legal wording, an experience cap, or one unknown self-ID answer joins a pending list while the rest proceeds. Draft unconfirmed custom wording from known facts and reserve its approval for the same list. Save valid sections through an available save-draft action; when validation prevents saving, explicitly record `filled_unsaved` and preserve the browser tab plus a minimal private checkpoint. Do not describe unsaved text as saved.
5. **Use one consolidated handoff after the pass.** Report completed and saved sections, remaining gaps grouped by user answer/action, the relevant form labels and why each item needs input, unseen pages and the resume point. Include proposed wording or choices when useful, without inventing facts. Distinguish required gaps from optional blanks; an unknown optional field does not require the user to answer it unless their rules require that section. If final submission authorization is also absent, combine it with this review when the consequence is clear. Progress notices and the experience list are informational, not additional confirmation requests.
6. **Resume from the checkpoint.** On return, read the user's answers and current page before mutating it. Apply only the gaps/corrections, recheck dependent values and newly unlocked pages, and avoid duplicate experiences, uploads, or submissions. Newly revealed requirements may justify a further consolidated request after that newly reachable pass; do not claim all pages were reviewed before they were reachable.

An immediate handoff is appropriate when a whole-application gate prevents further authorized work, an action exceeds existing permissions, or continuing would lose unsaved data. Before handing off, capture the current progress and exact user action; do any independent local preparation that remains useful. A login or anti-bot page must not be bypassed. When the user authorized several applications, one blocked application does not cancel the other authorized targets, but it does not authorize adding targets either.

Use `../templates/application-progress.template.json` as a lightweight checkpoint at `drafts/<company>-<job-id>-<cycle>.json`. Keep field-level facts in Candidate Profile; checkpoint source paths and unresolved labels rather than duplicating sensitive values. Record `blocked_scope`, filled/saved/readback state, unseen sections and next action. Never store passwords, OTPs, cookies or session tokens. Before handing off, link this draft from the existing blocker record/next action; after resolution, close the related blocker and mark the checkpoint complete only when the observed result supports it.

## Batch Filling & Consolidated Verification

Use this execution pattern by default with the current authorized browser tool:

1. **Prepare once.** Assemble the chosen resume, selected structured entries, confirmed profile answers, and unresolved questions into a compact application packet. Inspect the relevant form sections together for field labels/types, required fields, existing values, and validation errors. Reuse this packet during the application; refresh only changed facts or newly exposed requirements.
2. **Fill a predictable batch.** In one tool call, execute as many known actions as the tool supports within its timeout: normally a complete basic-information, education, internship, or project module; combine adjacent simple modules when practical. Use sequential awaited UI actions on the same page, not concurrent mutations. Include save and readback in that call when their controls and resulting state are known. A normal text field does not need its own model turn.
3. **Respect dependencies.** For dependent dropdowns, autocomplete, dates, and newly added entries, wait for the actual options or controls to appear and select real options. Continue within the batch when the next step is observed and unambiguous. An unexpected modal, navigation, or ambiguous control ends that batch with its progress and relevant state returned. Do not guess stale locators, use hidden write APIs, or remove necessary waits to increase batch size; avoid arbitrary sleeps when an observable readiness condition is available.
4. **Audit together.** After the module is saved, read back all its values, entry counts, date controls, save status, and validation errors in one inspection. Return a compact coverage/result summary plus mismatches, missing values, and errors. Do not read the full page or take a screenshot after every successful field. Use broader inspection for an unfamiliar page, the final whole-application review, or a problem that scoped inspection cannot explain.
5. **Repair only differences.** If a batch partially fails, inspect the current state and resume from the unfinished fields. Preserve correct values and saved entries; check before adding an entry again to avoid duplicates. Retry a failed interaction once with a targeted alternative, then queue the remaining blocker and continue other reachable sections instead of replaying the batch or ending the application pass.

Collect missing facts and custom-answer confirmations throughout the pass, complete independent confirmed fields, then request the unresolved items together. Keep verification, login, permission, and final-submission boundaries intact. Before final approval, audit the whole application together, including attachments and every required experience; batching changes the number of round trips, not the coverage of checks. After an authorized submission is confirmed, batch the required local dashboard updates and their consistency checks immediately, before starting another company.

### Completion Audit Coverage

- Inspect every structured entry after parsing and after saving, grouping checks by module: start/end date controls, institution/company, title/major, descriptions, and project responsibilities. Dates embedded in prose do not fill date controls. Keep the source date precision; ask for an exact date or an authorized placeholder convention if the form requires more precision.
- Check all user-required sections and entries, including campus roles, certificate dates, and photos when applicable. Every field must be covered, but does not require an individual tool call.
- Verify the primary resume is the chosen version, not merely an extra attachment. Re-parsing can overwrite repaired fields, so audit again after replacement.
- Read saved values and validation messages back. A completeness percentage alone is not proof of completeness; report unresolved fields before requesting final submission approval.

## Form Answer Defaults

- Basic fields with clear profile values can be filled automatically: name, email, phone, LinkedIn, location, resume upload, and start date.
- Work authorization, sponsorship, and compensation can be filled only when wording matches the profile or answer bank closely.
- Voluntary self-ID defaults to blank, "Prefer not to say", or decline/skip when available unless the user configured exact answers.
- Reuse confirmed custom-answer patterns. If none applies, draft from known facts and collect it for the consolidated review while continuing other fields.
- Final submit requires explicit user authorization for this application. Reuse valid existing authorization for the unchanged target and materials; otherwise request it at the final consolidated review.

## Low-Friction Applications

Volume mode and first real application tests should prefer low-friction applications:

- No new account creation.
- Not Workday, Oracle, or another long enterprise ATS by default.
- No video, long writing sample, or mandatory portfolio submission.
- At most one custom question.
- Clear resume upload and final confirmation path.
- No CAPTCHA, Cloudflare, login, or 2FA interruption.

This is a prioritization rule, not a permanent ban. In Precision mode, a high-value role may justify Workday, Oracle, long forms, or deeper custom work after the user confirms it is worth the extra time.

## Automation Ladder

Use the fastest reliable method first, then escalate only when needed:

1. Browser automation / Playwright-style control: best for batch work, normal buttons, form fields, tab cleanup, and repeatable ATS flows.
2. DOM plus keyboard repair: use Escape, Tab, Enter, arrow keys, and real option selection when dropdowns or overlays misbehave.
3. Visual or computer-use control: use when the page state matters visually, buttons are covered, dropdowns are custom, uploads are silent, or DOM state and visible state disagree.
4. Scoped user handoff: queue missing materials, unclear legal answers and local permission failures while completing independent reachable work. Hand off immediately for CAPTCHA, Cloudflare, login/2FA or another gate only when all remaining authorized work is unreachable; do not bypass the control.

Playwright is an implementation detail, not the user-facing concept. Describe it to users as fast browser automation unless they ask for the technical details.

## The 10 Common Cardpoints

### 1. Permissions

Before long runs, verify that the agent can click, read pages, switch tabs, and upload files. Also verify browser extension permissions for the target websites.

If permissions fail mid-run, record the exact permission and affected scope. Do not bypass it. An upload permission failure can leave other form modules usable: finish those before the consolidated handoff. Stop the whole application pass only when no independent authorized work remains reachable.

### 2. Dropdowns That Look Selected But Are Not

ATS dropdowns may show a value visually while internal validation still fails.

Try:

- Press Escape to close autofill overlays.
- Click the real dropdown option text.
- Use keyboard navigation.
- Use visual/computer control if ordinary DOM interaction fails.
- After fixing, verify that the site no longer reports the field invalid.

If the same field repeatedly fails, record a blocker instead of burning time.

### 3. Address and Option Matching

Address fields may require full names, abbreviations, city, state, country, or localized text.

Try in this order, adapted to the user's profile:

1. Full city, state, country.
2. City only.
3. State only.
4. Country full name.
5. Country abbreviation.
6. Local-language variant if relevant.

For autocomplete fields, type, wait for candidates, then select a candidate. Do not submit raw typed text unless the site accepts free text.

### 4. Simplify or Extension Overlay Blocks Buttons

If Next, Review, or Submit does not respond:

- Close the Simplify side panel or other overlay.
- Focus the button and press Enter.
- Retry once.
- If still blocked, record a blocker.

Do not count an application as submitted unless the confirmation rule passes.

### 5. Close Completed Windows or Tabs

After each job is submitted, skipped, or blocked, close no-longer-needed tabs. This keeps memory, page scripts, and agent context under control.

Only keep tabs open when the user must act, such as CAPTCHA, login, upload, or final manual review.

### 6. Define Submission Success Strictly

Submission evidence can include:

- Visible text like `Application submitted`, `Application sent`, or `Thank you for applying`.
- A thank-you page.
- URL patterns like `thanks`, `thank-you`, `submitted`, or `confirmation`.
- A platform status that clearly says the application was sent.

Do not count:

- Saved jobs.
- Job trackers.
- Simplify quick apply labels.
- Autofill completion.
- A clicked submit button with no confirmation.

### 7. Email Verification vs CAPTCHA / Cloudflare

Email security codes may be handled if the user has connected an email tool and authorized code retrieval.

CAPTCHA, hCaptcha, reCAPTCHA, Cloudflare, and anti-bot checks must be treated as user handoff. Do not bypass them.

### 8. Login Sessions and Account Choice

If a login page appears, record `Login required` or `Session expired` and do not proceed through authentication without authorization. When the login gates all remaining application work, hand off with saved progress and unseen pages. If it affects only an optional integration or a separate attachment flow, preserve that local blocker and continue independent accessible sections without bypassing login.

Do not attempt automatic login unless the user explicitly instructs it and the flow is safe. If multiple LinkedIn or email accounts exist, use the account specified in the candidate profile or rules.

### 9. Resume Upload Verification

After uploading a resume, verify the file is attached before submitting.

Watch for:

- Sites that accept PDF only.
- Custom upload widgets.
- Silent upload failure.
- Wrong resume variant attached.
- Browser permission failure.

If upload cannot be verified, queue the attachment issue and complete independent reachable sections before handoff. Record whether the issue blocks one field or the whole application; do not silently submit without a required resume or substitute another file.

### 10. Goal Mode Expectations

Goal-style runs are best for volume mode and short application flows.

Expect the agent to skip or defer:

- Workday or Oracle account-heavy flows.
- Long custom applications.
- Forms requiring missing materials.
- Login, 2FA, CAPTCHA, or Cloudflare.

For high-value target roles, use a focused run instead of a volume goal.

## Common ATS Notes

### LinkedIn Easy Apply

- Prefer fresh filters and direct apply flows.
- Close overlays before clicking Next, Review, or Submit.
- Count only after visible submitted/sent confirmation.

### Greenhouse

- Dropdown validation may be stale even when the page looks correct.
- Confirm required fields visually before retrying submit.
- If invalid state persists, record exact field and blocker.

Greenhouse email security code SOP:

- Use only when the user authorized email access.
- Read the latest Greenhouse security code from email.
- Locate each single-character security input when possible.
- Clear each box before typing.
- Enter one character per box using focused keypresses rather than bulk paste.
- Read the values back and verify the joined code exactly matches the email code.
- Submit only after verification.
- If characters duplicate, show as `undefined`, fail to clear, or cannot be verified, stop and hand off to the user.

### Lever

- Watch for hCaptcha or final confirmation pages.
- Count only explicit confirmation or thank-you page.

### Ashby

- Often requires resume upload.
- Verify upload before continuing.
- Record file permission blockers exactly.

### Workday / Oracle / Enterprise ATS

- Skip or defer long login-heavy flows unless fit is strong.
- Record maintenance, account creation, or login blockers.
