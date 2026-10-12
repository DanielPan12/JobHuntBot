const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pendingCompanies } = require('../dashboard-model.js');
const { companyKey, companyClassification, isRoleRecord, sameRole, recordsForRole, latestApplication, actionItems } = require('../dashboard-model.js');
const { readJobs, readRegistry, checkCoverage, parseCSV } = require('../scripts/company-categories.js');

const role = (company, status = 'Pending', extra = {}) => ({ company, status, ...extra });

test('one company card keeps all pending roles and has one open-state group', () => {
  const rows = [role('甲', 'Pending', { job_title: '规划', cohort_match_status: 'No' }),
    role('甲', 'Needs user', { job_title: '产品', cohort_match_status: 'Yes' }), role('乙')];
  const groups = pendingCompanies(rows, []);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].rows, rows.slice(0, 2));
  assert.equal(groups[0].cohort_match_status, 'Yes');
  assert.equal(groups[1].cohort_match_status, 'Unclear');
});

test('any submitted or ended role removes the whole company before filters', () => {
  for (const status of ['Submitted', 'Offer', 'Rejected']) {
    const rows = [role('甲', 'Pending', { location: '城市A' }),
      role('甲', status, { location: '城市B' }), role('乙')];
    assert.equal(pendingCompanies(rows, [], r => r.location === '城市A').length, 0);
    assert.deepEqual(pendingCompanies(rows, []).map(g => g.company), ['乙']);
  }
});

test('application history excludes a company even if its pool row is stale', () => {
  for (const status of ['Submitted', 'Offer', 'Rejected']) {
    assert.equal(pendingCompanies([role('甲')], [role('甲', status)]).length, 0);
  }
  assert.equal(pendingCompanies([role('甲')], [role('甲', 'Blocked', { notes: '未提交' })]).length, 1);
});

test('normalizes whitespace, case and full-width forms without fuzzy subsidiary merging', () => {
  const groups = pendingCompanies([role('  Acme  '), role('ＡＣＭＥ'), role('Acme Robotics')], []);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].rows.length, 2);
  assert.deepEqual(pendingCompanies([role(' ACME '), role('Acme Robotics')], [role('acme', 'Submitted')])
    .map(g => g.company), ['Acme Robotics']);
});

test('filters match a single role and aggregate its state, not unrelated roles', () => {
  const rows = [role('甲', 'Pending', { location: '城市A', priority: 'High', cohort_match_status: 'Yes' }),
    role('甲', 'Pending', { location: '城市C', priority: 'Low', cohort_match_status: 'No' })];
  assert.equal(pendingCompanies(rows, [], r => r.location === '城市C' && r.priority === 'High').length, 0);
  const [group] = pendingCompanies(rows, [], r => r.location === '城市C');
  assert.equal(group.rows.length, 1);
  assert.equal(group.cohort_match_status, 'No');
});

test('blocked/skipped/empty companies stay outside the candidate view', () => {
  assert.deepEqual(pendingCompanies([role('甲', 'Blocked'), role('乙', 'Skipped'), role('  ')], []), []);
});

test('submission transitions remove candidates without collapsing applied or ended records', () => {
  const rows = [role('甲', 'Pending', { __rowIndex: 0 }), role('甲', 'Pending', { __rowIndex: 1 }),
    role('乙', 'Submitted', { __rowIndex: 2 }), role('乙', 'Submitted', { __rowIndex: 3 }),
    role('丙', 'Rejected', { __rowIndex: 4 }), role('丙', 'Offer', { __rowIndex: 5 })];
  const before = structuredClone(rows);
  assert.equal(pendingCompanies(rows, []).length, 1);
  assert.deepEqual(rows, before);
  rows[0].status = 'Submitted';
  assert.equal(pendingCompanies(rows, []).length, 0);
  rows[0].status = 'Rejected';
  assert.equal(pendingCompanies(rows, []).length, 0);
  assert.equal(rows.filter(r => r.company === '乙' && r.status === 'Submitted').length, 2);
  assert.equal(rows.filter(r => r.company === '丙').length, 2);
});

test('company categories propagate to new roles and user changes override stale notes', () => {
  const registry = { [companyKey('Acme')]: { company: 'Acme', category: '第二类', basis: 'user', reason: '用户调整' } };
  assert.equal(companyClassification(role('ＡＣＭＥ'), registry).category, '第二类');
  assert.equal(companyClassification(role('Acme', 'Rejected', { notes: '分类:第一类' }), registry).basis, 'user');
  assert.equal(companyClassification(role('Acme subsidiary'), registry), null);
  assert.equal(companyClassification(role('Other', 'Pending', { notes: '分类：第三类' }), registry).category, '第三类');
});

test('unknown or invalid classifications require review instead of a third-class default', () => {
  const registry = { companies: { bad: { company: 'Bad', category: '第四类', basis: 'recommended', reason: 'x' } } };
  assert.deepEqual(checkCoverage([role('New'), role('Bad')], registry).missing, ['New']);
  assert.deepEqual(checkCoverage([role('New'), role('Bad')], registry).invalid, ['Bad']);
  assert.equal(companyClassification(role('New'), registry.companies), null);
});

test('classification migration reads quoted and multiline CSV without changing source records', () => {
  assert.deepEqual(parseCSV('\uFEFFcompany,notes\r\n"A","line1\nline2, ""quoted"""\r\n'),
    [{ company: 'A', notes: 'line1\nline2, "quoted"' }]);
});

test('all dashboard company records have a valid classification with provenance and rationale', () => {
  const jobs = readJobs(), registry = readRegistry();
  const coverage = checkCoverage(jobs, registry);
  assert.deepEqual(coverage.missing, []);
  assert.deepEqual(coverage.invalid, []);
  for (const row of jobs) {
    const info = companyClassification(row, registry.companies);
    assert.ok(info.reason);
    const legacy = (row.notes || '').match(/分类[:：]\s*(第[一二三]类)/)?.[1];
    if (legacy && info.basis === 'existing') assert.equal(info.category, legacy);
  }
});

test('role history uses exact posting identity and latest successful date, not CSV order or company', () => {
  const job = role('ＡＣＭＥ', 'Submitted', { job_title: '供应链 (A)', job_url: 'https://example.com/#/job/A' });
  const logs = [
    role('Acme', 'Submitted', { job_title: '供应链', job_url: job.job_url, attempt_date: '2026-10-10', job_description: 'A最新JD' }),
    role('Acme', 'Submitted', { job_title: '产品 (B)', job_url: 'https://example.com/#/job/B', attempt_date: '2026-10-11', job_description: 'B的JD' }),
    role('Acme', 'Blocked', { job_title: job.job_title, job_url: job.job_url, attempt_date: '2026-10-12' }),
    role('Acme', 'Submitted', { job_title: job.job_title, job_url: job.job_url, attempt_date: '2026-09-01', job_description: 'A旧JD' }),
  ];
  const before = structuredClone(logs);
  assert.equal(latestApplication(job, logs).job_description, 'A最新JD');
  assert.equal(latestApplication({ ...job, job_url: 'https://example.com/#/job/C' }, logs), null);
  assert.deepEqual(logs, before);
  assert.equal(sameRole(job, { ...job, job_url: 'https://example.com/#/job/B' }), false);
  assert.equal(sameRole(job, { ...job, company: 'Acme Subsidiary' }), false);
  assert.deepEqual(recordsForRole(job, [{ company: 'Acme', job_title: '供应链 (A)', date: '2026-10-11' },
    { company: 'Acme', job_title: '产品 (B)', date: '2026-10-12' }]).map(row => row.date), ['2026-10-11']);
});

test('consolidated actions preserve all gaps, pool-only blockers and post-submission corrections', () => {
  const jobs = [role('Acme', 'Submitted', { job_title: '已投岗位', job_url: 'https://example.com/1' }),
    role('Acme', 'Needs user', { job_title: '待填岗位', job_url: 'https://example.com/2', current_stage: '基础信息已完成' }),
    role('Other', 'Blocked', { job_title: '计划员', blocker: '用户已登录；浏览器连接失败', next_action: '恢复已登录浏览器' })];
  const blockers = [
    role('Acme', 'open', { job_title: '旧标题', job_url: 'https://example.com/2', blocker_category: 'missing fact', user_action_needed: '确认薪资' }),
    role('Acme', 'open', { job_title: '待填岗位', job_url: 'https://example.com/2', blocker_category: 'missing fact', user_action_needed: '补毕业日期' }),
    role('Acme', 'open', { job_title: '已投岗位', job_url: 'https://example.com/1', blocker_category: 'Post-submission discrepancy' }),
    role('Acme', 'resolved', { job_title: '待填岗位', job_url: 'https://example.com/2' }),
    role('Acme', 'abandoned', { job_title: '放弃岗位', job_url: 'https://example.com/3' }),
    role('Later', 'retry later', { job_title: '待重试' }),
  ];
  const before = structuredClone({ jobs, blockers });
  const groups = actionItems(jobs, blockers);
  assert.equal(groups.length, 4);
  const fill = groups.find(group => group.rows[0]?.job_title === '待填岗位');
  assert.deepEqual(fill.blockers.map(row => row.user_action_needed), ['确认薪资', '补毕业日期']);
  assert.equal(fill.rows[0].current_stage, '基础信息已完成');
  assert.ok(groups.some(group => group.blockers[0]?.blocker_category === 'Post-submission discrepancy'));
  assert.ok(groups.some(group => group.rows[0]?.next_action === '恢复已登录浏览器'));
  assert.ok(groups.some(group => group.company === 'Later'));
  assert.deepEqual({ jobs, blockers }, before);
});

test('same title on different posting URLs remains separate and ambiguous gaps are not discarded', () => {
  const jobs = [role('Acme', 'Needs user', { job_title: '产品经理', job_url: 'https://example.com/1' }),
    role('Acme', 'Needs user', { job_title: '产品经理', job_url: 'https://example.com/2' })];
  const gaps = [role('Acme', 'open', { job_title: '产品经理', user_action_needed: '尚未确定属于哪个岗位' })];
  const groups = actionItems(jobs, gaps);
  assert.equal(groups.length, 3);
  assert.equal(groups.flatMap(group => group.rows).length, 2);
  assert.equal(groups.flatMap(group => group.blockers).length, 1);
  assert.deepEqual(recordsForRole(jobs[0], [{ company: 'Acme', job_title: '产品经理', date: '2026-10-12' }], jobs), []);
});

test('company summary history excludes candidates without inflating role counts', () => {
  const jobs = [role('Acme', 'Submitted', { record_type: 'company_summary', job_title: '公司汇总' }),
    role('Acme', 'Submitted', { record_type: 'role', job_title: '产品经理' }),
    role('Acme', 'Pending', { job_title: '供应链经理' }), role('Legacy', 'Submitted')];
  assert.equal(jobs.filter(isRoleRecord).filter(row => row.status === 'Submitted').length, 2);
  assert.equal(pendingCompanies(jobs, []).length, 0);
});
