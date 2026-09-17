# Application Playbook

Use this reference for browser-based job applications, LinkedIn Easy Apply, Simplify, Greenhouse, Lever, Ashby, Workday, and other ATS pages.

## Global Rules

- Count only confirmed submissions.
- Prefer short, reliable paths over long custom forms.
- Close each completed or skipped job tab before moving on.
- Keep only tabs that need user handoff.
- Record every outcome in the dashboard.
- Stop rather than bypass verification or guess high-impact answers.
- Do not create separate "test" and "normal" behavior modes. Use one default behavior: automate clear low-risk fields, ask focused questions for missing high-impact facts, and always stop before final submit.

## Batch Filling & Consolidated Verification

Use this execution pattern by default with the current authorized browser tool:

1. **Prepare once.** Assemble the chosen resume, selected structured entries, confirmed profile answers, and unresolved questions into a compact application packet. Inspect the relevant form sections together for field labels/types, required fields, existing values, and validation errors. Reuse this packet during the application; refresh only changed facts or newly exposed requirements.
2. **Fill a predictable batch.** In one tool call, execute as many known actions as the tool supports within its timeout: normally a complete basic-information, education, internship, or project module; combine adjacent simple modules when practical. Use sequential awaited UI actions on the same page, not concurrent mutations. Include save and readback in that call when their controls and resulting state are known. A normal text field does not need its own model turn.
3. **Respect dependencies.** For dependent dropdowns, autocomplete, dates, and newly added entries, wait for the actual options or controls to appear and select real options. Continue within the batch when the next step is observed and unambiguous. An unexpected modal, navigation, or ambiguous control ends that batch with its progress and relevant state returned. Do not guess stale locators, use hidden write APIs, or remove necessary waits to increase batch size; avoid arbitrary sleeps when an observable readiness condition is available.
4. **Audit together.** After the module is saved, read back all its values, entry counts, date controls, save status, and validation errors in one inspection. Return a compact coverage/result summary plus mismatches, missing values, and errors. Do not read the full page or take a screenshot after every successful field. Use broader inspection for an unfamiliar page, the final whole-application review, or a problem that scoped inspection cannot explain.
5. **Repair only differences.** If a batch partially fails, inspect the current state and resume from the unfinished fields. Preserve correct values and saved entries; check before adding an entry again to avoid duplicates. Retry a failed interaction once with a targeted alternative, then report the remaining blocker instead of replaying the entire batch.

Collect missing facts and custom-answer confirmations into one focused request where possible, and continue independent confirmed fields while waiting. Keep verification, login, permission, and final-submission boundaries intact. Before final approval, audit the whole application together, including attachments and every required experience; batching changes the number of round trips, not the coverage of checks. After an authorized submission is confirmed, batch the required local dashboard updates and their consistency checks immediately, before starting another company.

### Completion Audit Coverage

- Inspect every structured entry after parsing and after saving, grouping checks by module: start/end date controls, institution/company, title/major, descriptions, and project responsibilities. Dates embedded in prose do not fill date controls. Keep the source date precision; ask for an exact date or an authorized placeholder convention if the form requires more precision.
- Check all user-required sections and entries, including campus roles, certificate dates, and photos when applicable. Every field must be covered, but does not require an individual tool call.
- Verify the primary resume is the chosen version, not merely an extra attachment. Re-parsing can overwrite repaired fields, so audit again after replacement.
- Read saved values and validation messages back. A completeness percentage alone is not proof of completeness; report unresolved fields before requesting final submission approval.

## Form Answer Defaults

- Basic fields with clear profile values can be filled automatically: name, email, phone, LinkedIn, location, resume upload, and start date.
- Work authorization, sponsorship, and compensation can be filled only when wording matches the profile or answer bank closely.
- Voluntary self-ID defaults to blank, "Prefer not to say", or decline/skip when available unless the user configured exact answers.
- Custom questions should use answer-bank patterns when available. If no pattern exists, draft the specific answer and ask the user to confirm it.
- Final submit always requires user approval. Show a concise summary before the final click.

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
4. User handoff: use for CAPTCHA, Cloudflare, login, 2FA, sensitive legal questions, missing materials, or permission prompts.

Playwright is an implementation detail, not the user-facing concept. Describe it to users as fast browser automation unless they ask for the technical details.

## The 10 Common Cardpoints

### 1. Permissions

Before long runs, verify that the agent can click, read pages, switch tabs, and upload files. Also verify browser extension permissions for the target websites.

If permissions fail mid-run, record the exact permission needed and stop that application.

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

If a login page appears, stop and record `Login required` or `Session expired`.

Do not attempt automatic login unless the user explicitly instructs it and the flow is safe. If multiple LinkedIn or email accounts exist, use the account specified in the candidate profile or rules.

### 9. Resume Upload Verification

After uploading a resume, verify the file is attached before submitting.

Watch for:

- Sites that accept PDF only.
- Custom upload widgets.
- Silent upload failure.
- Wrong resume variant attached.
- Browser permission failure.

If upload cannot be verified, mark `Needs user` or `Blocked`; do not submit without a resume unless the user explicitly allows it.

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
