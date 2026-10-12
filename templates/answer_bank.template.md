# Answer Bank Template

Use truthful reusable answers. The user can provide them directly, or the agent can draft them from Candidate Profile and ask the user to confirm the first version.

Candidate Profile stores facts. Answer Bank stores reusable wording for repeated form questions.

Do not make onboarding heavy:

- Draft low-risk answers when enough facts exist.
- Ask the user to review the first version.
- Reuse confirmed answers later.
- Ask again only when wording is ambiguous, high-impact, or outside the profile.

Never auto-fill these unless the user has provided clear facts and wording:

- Work authorization.
- Sponsorship.
- Compensation outside the stored range.
- Voluntary self-ID.
- Background check, non-compete, legal, or identity questions.

Default handling:

- Basic profile facts can be reused automatically when clear.
- High-impact answers require exact profile facts or answer-bank wording.
- Voluntary self-ID defaults to blank, "Prefer not to say", or decline/skip when the form allows it. If the user does not configure exact answers, tell them JobHuntBot will default to non-disclosure.
- For custom questions, draft a concise answer from the user's facts and ask once before reuse.
- Reuse confirmed patterns. Queue unsupported new claims or materials while continuing other fields; collect genuinely missing information for one review after the fill pass.

Examples:

- Candidate Profile: actual work authorization status.
- Answer Bank: exact sentence to use when a form asks about sponsorship.
- Candidate Profile: compensation range.
- Answer Bank: exact wording for required salary fields.
- Candidate Profile: target locations.
- Answer Bank: relocation and remote/hybrid/onsite wording.

## Work Authorization

Default answer:

When to ask:

## Sponsorship

Default answer:

When to ask:

## Location

Default answer:

Relocation answer:

Remote/hybrid/onsite answer:

## Compensation

Default range:

Deferral wording:

When to ask:

## Start Date

Default answer:

## Why This Company

Reusable pattern:

## Why This Role

Reusable pattern:

## Portfolio / Work Samples

Default links:

When to ask:

## Voluntary Self-ID

Strategy:

- Default: Prefer not to say / decline / leave blank when available.
- Use stored answers:
- Ask each time:

User-provided answers, if any:

## Custom Questions

| Question pattern | Reusable answer or pattern | When to customize |
|---|---|---|
|  |  |  |

Before declaring a field missing, check the latest applicable profile confirmations and corrections, respecting their date and company scope. Record field/section/application blocker scope, saved versus unsaved work, unseen pages and the exact resume point with `application-progress.template.json` in a private drafts directory. Never store passwords, OTPs, cookies or session tokens.
