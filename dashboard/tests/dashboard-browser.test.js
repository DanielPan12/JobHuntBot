const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createDashboardServer } = require('../server.js');

// Optional browser verification; the core dashboard still has no npm dependency.
// Set DASHBOARD_PLAYWRIGHT_MODULE to an installed Playwright module when needed.
let chromium;
try { ({ chromium } = require(process.env.DASHBOARD_PLAYWRIGHT_MODULE || 'playwright')); }
catch (error) { if (process.env.DASHBOARD_PLAYWRIGHT_MODULE) throw error; }

function csv(rows) {
  const columns = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const quote = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
  return [columns, ...rows.map(row => columns.map(column => row[column]))]
    .map(row => row.map(quote).join(',')).join('\r\n') + '\r\n';
}

test('dashboard renders all gaps, separates role histories, and preserves calendar edit identity',
  { skip: !chromium && 'Install Playwright or set DASHBOARD_PLAYWRIGHT_MODULE', timeout: 60000 }, async () => {
    const tmpRoot = path.resolve(os.tmpdir());
    const fixture = fs.mkdtempSync(path.join(tmpRoot, 'jobhuntbot-dashboard-ui-'));
    let server, browser;
    try {
      for (const name of ['dashboard.html', 'dashboard-model.js']) {
        fs.copyFileSync(path.join(__dirname, '..', name), path.join(fixture, name));
      }
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
      const jobs = [
        { company: 'Acme', job_title: '公司汇总', job_url: 'https://example.com', status: 'Submitted', record_type: 'company_summary' },
        { company: 'Acme', job_title: 'A岗位', job_url: 'https://example.com/A', status: 'Submitted', current_stage: '', date_found: '2026-07-01' },
        { company: 'Acme', job_title: 'B岗位', job_url: 'https://example.com/B', status: 'Submitted', current_stage: '', date_found: '2026-07-02' },
        { company: 'Acme', job_title: '待填岗位', job_url: 'https://example.com/C', status: 'Needs user', current_stage: '教育与实习已填写', blocker: '缺薪资、日期', next_action: '集中补齐缺漏' },
        { company: '示例制造', job_title: '计划员', status: 'Blocked', current_stage: '用户已登录；浏览器连接失败', blocker: '连接超时', next_action: '恢复已登录浏览器连接' },
        { company: 'Success', job_title: '产品Offer', status: 'Offer', notes: '分类:第一类' },
        { company: 'Declined', job_title: '采购已挂', status: 'Rejected', notes: '分类:第二类' },
        { company: 'Success', job_title: 'Offer汇总', status: 'Offer', record_type: 'company_summary' },
        { company: 'Declined', job_title: '已挂汇总', status: 'Rejected', record_type: 'company_summary' },
      ];
      fs.writeFileSync(path.join(fixture, 'job_pool.csv'), csv(jobs));
      fs.writeFileSync(path.join(fixture, 'application_log.csv'), csv([
        { ...jobs[1], status: 'Submitted', attempt_date: '2026-10-10', job_description: 'A最新JD', submission_evidence: '官网成功' },
        { ...jobs[2], status: 'Submitted', attempt_date: '2026-10-11', job_description: 'B专属JD' },
        { ...jobs[1], status: 'Submitted', attempt_date: '2026-07-02', job_description: 'A旧JD' },
      ]));
      fs.writeFileSync(path.join(fixture, 'follow_up.csv'), csv([
        { date: today, company: 'Acme', job_title: 'A岗位', contact: '', channel: '', event_type: '一面', deadline: '', next_action: '本人参加', status: 'pending', notes: '', time: '10:00' },
      ]));
      fs.writeFileSync(path.join(fixture, 'blocker_queue.csv'), csv([
        { company: 'Acme', job_title: '待填岗位', job_url: 'https://example.com/C', status: 'open', blocker_category: 'missing fact', user_action_needed: '确认薪资' },
        { company: 'Acme', job_title: '待填岗位', job_url: 'https://example.com/C', status: 'open', blocker_category: 'missing fact', user_action_needed: '补毕业日期' },
        { company: 'Acme', job_title: 'A岗位', job_url: 'https://example.com/A', status: 'open', blocker_category: 'Post-submission discrepancy', user_action_needed: '核实志愿顺序' },
        { company: 'Acme', job_title: '已解决', status: 'resolved' },
      ]));
      fs.writeFileSync(path.join(fixture, 'company_categories.json'), JSON.stringify({ companies: {} }));
      server = createDashboardServer({ root: fixture });
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      const base = 'http://127.0.0.1:' + server.address().port;
      browser = await chromium.launch({ channel: process.env.DASHBOARD_BROWSER_CHANNEL || 'msedge', headless: true });
      const page = await browser.newPage({ timezoneId: 'Asia/Shanghai', viewport: { width: 1100, height: 850 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/dashboard.html');
      await page.locator('#app').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#tile-applied').textContent(), '2');
      assert.equal(await page.locator('#tile-pending').textContent(), '0');
      assert.equal(await page.locator('#tile-actions').textContent(), '3');
      assert.equal(await page.locator('#tile-offers').textContent(), '1');
      assert.equal(await page.locator('#tile-rejected').textContent(), '1');

      for (const [view, title, category, otherTitle] of [
        ['offers', '产品Offer', '第一类', '采购已挂'],
        ['rejected', '采购已挂', '第二类', '产品Offer'],
      ]) {
        await page.locator(`[data-view="${view}"]`).click();
        const list = page.locator(`#${view}-list`);
        assert.equal(await list.locator('.card').count(), 1);
        assert.ok((await list.innerText()).includes(title));
        assert.ok(!(await list.innerText()).includes(otherTitle));
        await page.locator(`#${view}-search`).fill(title);
        await page.locator(`#${view}-filter-cat`).selectOption(category);
        assert.equal(await list.locator('.card').count(), 1);
        await page.locator(`#${view}-search`).fill('不存在');
        assert.equal(await list.locator('.card').count(), 0);
        await page.locator(`#${view}-search`).fill('');
        await page.locator(`#${view}-filter-cat`).selectOption('');
        await page.locator(`#${view}-view [data-back]`).click();
      }

      await page.locator('[data-view="actions"]').click();
      await page.locator('#actions-expand').click();
      const actions = await page.locator('#actions-list').innerText();
      for (const text of ['教育与实习已填写', '确认薪资', '补毕业日期', '核实志愿顺序', '恢复已登录浏览器连接']) assert.ok(actions.includes(text), text);
      assert.equal(await page.locator('#actions-list .card.open').count(), 3);
      await page.locator('#actions-search').fill('薪资');
      assert.equal(await page.locator('#actions-list .card').count(), 1);
      await page.locator('#actions-view [data-back]').click();

      await page.locator('[data-view="applied"]').click();
      const firstRole = page.locator('#applied-list .card').filter({ hasText: 'Acme · A岗位' });
      await firstRole.click();
      const firstText = await firstRole.innerText();
      assert.ok(firstText.includes('投递于 2026-10-10'));
      assert.ok(firstText.includes('A最新JD'));
      assert.ok(!firstText.includes('B专属JD') && !firstText.includes('A旧JD'));
      assert.ok(!await page.locator('#applied-list').innerText().then(text => text.includes('公司汇总')));
      await page.locator('#applied-view [data-back]').click();

      await page.locator('.calendar-event [data-act="edit"]').click();
      await page.locator('#cal-time').fill('11:00');
      await page.locator('#cal-event-type').fill('二面');
      const requestPromise = page.waitForRequest(request => request.url().endsWith('/api/calendar/update'));
      await page.locator('#cal-save-btn').click();
      const request = await requestPromise;
      assert.deepEqual(request.postDataJSON().expectedEvent, { date: today, time: '10:00', event_type: '一面' });
      assert.equal(request.postDataJSON().job_url, 'https://example.com/A');
      await page.waitForFunction(() => document.querySelector('.calendar-event')?.textContent.includes('二面'));
      assert.ok(fs.readFileSync(path.join(fixture, 'follow_up.csv'), 'utf8').includes('11:00'));

      // Exercise each result button against isolated data, including the reload.
      for (const [title, status, tile] of [['A岗位', 'Offer', 'offers'], ['B岗位', 'Rejected', 'rejected']]) {
        await page.locator('[data-view="applied"]').click();
        const card = page.locator('#applied-list .card').filter({ hasText: `Acme · ${title}` });
        await card.click();
        await card.locator('.end-trigger').click();
        await card.locator(`[data-status="${status}"]`).click();
        await page.waitForFunction(id => document.getElementById(id)?.textContent === '2', `tile-${tile}`);
        await page.locator(`[data-view="${tile}"]`).click();
        assert.ok((await page.locator(`#${tile}-list`).innerText()).includes(title));
        await page.locator(`#${tile}-view [data-back]`).click();
      }
      assert.equal(await page.locator('#tile-applied').textContent(), '0');

      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await page.locator('[data-view="actions"]').click();
      await page.locator('#actions-expand').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      assert.deepEqual(errors, []);

      await page.route('**/blocker_queue.csv*', route => route.abort());
      await page.reload();
      await page.waitForFunction(() => document.querySelector('#connect-title')?.textContent === '读取数据失败');
      assert.equal(await page.locator('#app').isVisible(), false);
    } finally {
      if (browser) await browser.close();
      if (server) await new Promise(resolve => server.close(resolve));
      const relative = path.relative(tmpRoot, fixture);
      assert.ok(relative.startsWith('jobhuntbot-dashboard-ui-') && !relative.includes(path.sep));
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });
