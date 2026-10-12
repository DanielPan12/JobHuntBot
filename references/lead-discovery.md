# Lead Discovery: Coverage and Evidence

Read before finding, comparing, excluding, or rechecking openings. Use the candidate's configured roles, constraints and recruiting season; examples are not default preferences. Research does not authorize an application or publication.

## Search coverage

- Start with official recruitment entry points. Verify the actual posting and eligibility text, not a search-summary hedge or the existence of a careers homepage.
- Use targeted searches and a cross-check without restrictive cohort, function, city or employment-type filters. Search related responsibilities as well as job titles, including the candidate's configured adjacent interests. A missing tag or zero-result filter is not proof that no matching role exists.
- Review the relevant result pages and the full official JDs of shortlisted jobs and plausible near-matches. Follow named external leads to their official details before dismissing them. Distinguish a title/card reviewed from a full JD read.
- Keep campus, internship, graduate programs and experienced-hire channels distinct. Verify degree, major, graduation window, experience and work authorization independently. An open detail page is not proof that the candidate is eligible or the form still accepts applications.
- Record portal, date, active filters, displayed count, pages/cards checked, unique requisition IDs, full JDs read, unresolved leads and channels not checked. If coverage is incomplete, say “not found within this scope,” not “none exists.”

## Reliable navigation and public sources

- Use a stable, task-owned tab identity or URL. Preserve unrelated user tabs and application drafts.
- After changing filters or pages, verify the settled state, active page, result count and representative job IDs. Detect repeated pages and transient empty/loading states; neither a URL change nor a timeout proves coverage or zero results. Save verified batches so an interruption does not erase the research record.
- Where the available tools and site policies permit it, prefer official public read-only sources. A public same-origin HTML/JSON endpoint visibly used by the frontend may be used only when it requires no login, account cookies or private token; verify representative results against the official page and retain official posting URLs. Do not replay sessions, call mutation endpoints or bypass access controls. A denied browser action is not permission to switch methods to evade the denial.

## Compare duties, eligibility and preferences

For each plausible role record exact title, ID, department, location, official URL, employment type, eligibility evidence, required experience, core duties, work arrangements, candidate evidence, gaps and recommended resume.

- Apply the user's boundaries to actual duties. A workplace setting or site category does not establish what the job does; disclose uncertain onsite, travel or rotation requirements where they matter.
- Keep same-title requisitions distinct when teams, locations or requirements differ. Distinguish a preferred background from an accepted qualification, and both from a hard requirement.
- Use verified experience and transferable evidence. Do not turn portfolio work into employment tenure, double-count overlapping projects, or promote the candidate's preferences into employer facts.
- Present adjacent career directions separately when they change the requested role family. Do not pad a shortlist with weak matches to reach an arbitrary count.
- Compare multiple genuine options at a company when available, even if only one application slot is allowed. Report fewer matches honestly and explain the search limits.
- Rank using the user's combined preferences: concrete experience fit, city/work arrangements, business and industry outlook, career development, business importance, compensation and application feasibility. Explain tradeoffs; do not invent precise scores or weights. Freshness affects urgency, not eligibility or quality by itself.
- Use current, linked evidence for business and compensation claims. Prefer official JDs, recruitment FAQs, disclosures and recruiter statements; label third-party estimates and anecdotes with their date and relevance. Separate fact, inference and unknown.
- Separate fixed monthly pay, number of paid months, variable bonus, sign-on payments, allowances and equity. Annualize only explicit assumptions; do not present calculated compensation as guaranteed, infer tax treatment or use the candidate's desired salary as an employer offer. Unknown pay remains unknown.

Present a comparable shortlist: role/ID/team/city/URL, evidence and gaps, preference fit, career/business context, compensation basis, application limits, recommendation and resume. Resolve the role/city/resume choice only if still open. Reuse an approved pairing or explicitly delegated choice without asking again during filling.

## Company categories and application history

- Reuse the company's existing category. For a new company, follow the user's category definitions and store a dated, sourced recommendation in `dashboard/company_categories.json`, using `basis: recommended` for recommendations and `basis: user` for user-confirmed choices (`existing` preserves an established classification). Preserve user choices and distinct subsidiaries; do not mark a recommendation as confirmed or classify every unknown company into one fallback bucket.
- The bundled UI supports `第一类`, `第二类` and `第三类`. Define what these mean during setup; they are user-defined groups, not universal quality grades. Check the companion script's accepted schema before writing a category. Validate coverage with `node dashboard/scripts/company-categories.js --check`.
- A historical rejection concerns that attempt, not a permanent company-wide ban. Before applying again, verify cooldowns, per-role/project/cycle limits, shared quotas and applicable remaining slots using official rules and authorized candidate records. Rejection does not automatically restore a slot. Unknown permission remains pending verification.
- Preserve old outcomes. Track distinct roles/cycles separately; distinguish an explicitly permitted repeat attempt from its previous result without erasing history. The Pending view's company-level grouping is a display rule, not the full research inventory or permission to apply.

## Record the conclusion

Update `job_pool` as findings become verified. Use `record_type=company_summary` for company-level research and `role` for actual jobs; summaries must not inflate submitted, rejected or offer counts.

Set `cohort_match_status` explicitly for active research rows: `Yes` needs row-specific open-cycle/eligibility evidence, `No` needs evidence of mismatch, and `Unclear` covers missing or ambiguous evidence. A company-level `Yes` does not establish every role's eligibility. Use `Pending` for unfinished external research and `Needs user` for candidate-owned missing facts or decisions.

On a correction, update the current summary and affected role rows together, including stale next actions and daily recommendations. Preserve dated evidence as superseded and deduplicate by company, requisition and recruiting cycle. Leave historical application logs intact during lead-only work; research is not an application attempt.

Longer private research notes can use:

```text
Checked at / company / official portal:
Filters / displayed count / pages and unique cards checked:
Full JDs read / unresolved leads / channels not checked:
Role decisions / eligibility evidence / candidate gaps / resume routes:
Work-arrangement fit / career and business context / compensation sources:
Ranking and tradeoffs / application quota / next action:
Correction of prior conclusion, if any:
```

Read back changed rows and run the data audit and classification check. Report remaining historical gaps rather than guessing them away.
