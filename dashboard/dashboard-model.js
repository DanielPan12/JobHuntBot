(function (root) {
  'use strict';

  // Normalize spelling format only; similarly named subsidiaries remain distinct.
  function companyKey(name) {
    return String(name || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function isRoleRecord(row) {
    return row.record_type !== 'company_summary';
  }

  // URLs retain query strings and hashes: recruiting sites put role IDs there.
  // A title alone must not merge two different, explicitly identified postings.
  function sameRole(left, right) {
    if (!companyKey(left.company) || companyKey(left.company) !== companyKey(right.company)) return false;
    const leftUrl = String(left.job_url || '').trim();
    const rightUrl = String(right.job_url || '').trim();
    if (leftUrl && rightUrl) return leftUrl === rightUrl;
    const title = companyKey(left.job_title);
    return Boolean(title && title === companyKey(right.job_title));
  }

  function recordsForRole(row, records, jobPool = []) {
    return records.filter(record => {
      if (!sameRole(row, record)) return false;
      if (String(row.job_url || '').trim() && String(record.job_url || '').trim()) return true;
      // A title-only historical event is ambiguous when that title identifies
      // multiple known posting URLs. Do not assign it to every such posting.
      const urls = new Set([...jobPool, ...records].filter(candidate =>
        companyKey(candidate.company) === companyKey(row.company) &&
        companyKey(candidate.job_title) === companyKey(row.job_title))
        .map(candidate => String(candidate.job_url || '').trim()).filter(Boolean));
      return urls.size <= 1;
    });
  }

  function latestApplication(row, applicationLog, jobPool = []) {
    return recordsForRole(row, applicationLog, jobPool)
      .filter(record => ['Submitted', 'Offer', 'Rejected'].includes((record.status || '').trim()))
      .slice().sort((a, b) => String(b.attempt_date || '').localeCompare(String(a.attempt_date || '')))[0] || null;
  }

  function actionItems(jobPool, blockerQueue) {
    const groups = [];
    function add(row, source) {
      // Match against the canonical record only, avoiding transitive title-only
      // merges between different posting URLs. Ambiguous records stay visible.
      const matches = groups.filter(group => sameRole(group.reference, row));
      let group = matches.length === 1 ? matches[0] : null;
      if (!group) {
        group = { company: String(row.company || '').trim(), reference: row, rows: [], blockers: [] };
        groups.push(group);
      }
      group[source].push(row);
    }
    jobPool.filter(row => ['Needs user', 'Blocked'].includes((row.status || '').trim()))
      .forEach(row => add(row, 'rows'));
    blockerQueue.filter(row => !['resolved', 'closed', 'cancelled', 'canceled', 'dismissed', 'abandoned']
      .includes(companyKey(row.status))).forEach(row => add(row, 'blockers'));
    // Never exclude an open issue merely because this company has applied.
    // Post-submission corrections and other roles' issues still need attention.
    return groups.map(group => ({ ...group,
      titles: [...new Set([...group.rows, ...group.blockers].map(row => row.job_title).filter(Boolean))],
      updated_on: [...group.blockers.map(row => row.date), ...group.rows.map(row => row.date_found)]
        .filter(Boolean).sort().at(-1) || '',
    })).sort((a, b) => b.updated_on.localeCompare(a.updated_on));
  }

  function pendingCompanies(jobPool, applicationLog, matches = () => true) {
    const appliedStatuses = new Set(['Submitted', 'Offer', 'Rejected']);
    const applied = new Set([...jobPool, ...applicationLog]
      .filter(row => appliedStatuses.has((row.status || '').trim()))
      .map(row => companyKey(row.company)).filter(Boolean));
    const groups = new Map();

    for (const row of jobPool) {
      const key = companyKey(row.company);
      if (!key || applied.has(key) || !['Pending', 'Needs user'].includes((row.status || '').trim())) continue;
      if (!matches(row)) continue;
      if (!groups.has(key)) groups.set(key, { key, company: row.company.trim(), rows: [] });
      groups.get(key).rows.push(row);
    }

    return [...groups.values()].map(group => ({
      ...group,
      // A company appears in exactly one section. This summarizes the visible
      // candidate rows without changing any role's own eligibility evidence.
      cohort_match_status: group.rows.some(row => row.cohort_match_status === 'Yes') ? 'Yes'
        : group.rows.some(row => row.cohort_match_status !== 'No') ? 'Unclear' : 'No',
    }));
  }

  const categoryNames = ['第一类', '第二类', '第三类'];
  function companyClassification(row, registry = {}) {
    const entry = registry[companyKey(row.company)];
    if (entry && categoryNames.includes(entry.category)) return entry;
    const legacy = (row.notes || '').match(/分类[:：]\s*(第[一二三]类)/);
    return legacy ? { category: legacy[1], basis: 'existing', reason: '沿用历史分类' } : null;
  }

  const model = { companyKey, isRoleRecord, sameRole, recordsForRole, latestApplication, actionItems,
    pendingCompanies, companyClassification, categoryNames };
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  else root.DashboardModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
