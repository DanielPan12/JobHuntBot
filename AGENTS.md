# JobHuntBot workspace entry

For JobHuntBot setup, job research, applications or dashboard work, read `SKILL.md` first and the references relevant to the task. Follow the user's current instructions and scoped authorization.

- This repository is a public workflow and empty starter dashboard. Initialize personal files in a separate private workspace by copying the templates; do not fill the tracked templates with real data.
- Read current candidate facts, application rules, resume routing, the answer bank and chosen resume before applying. Respect confirmation dates and company/role scope.
- Finish all independent reachable fields before one consolidated gap review. Save a private checkpoint using `templates/application-progress.template.json`; on recovery inspect actual saved state before adding entries again.
- Preserve application evidence and outcome history. Use `record_type=company_summary` for non-counting company research. Offer and Rejected are separate outcomes; an interview pass is not an offer.
- For local CSV changes use the snapshot and atomic-write helpers in `dashboard/csv-store.js`. Run the relevant data checks and tests after modifications; never invent historical facts to clear warnings.
- Before publishing, run `node scripts/check-public-package.js` and inspect the staged diff. Publish reusable code, documentation and empty templates only. Exclude personal materials, filled databases, screenshots, drafts, backups and credentials. A workflow repair is not authorization to apply or publish.
