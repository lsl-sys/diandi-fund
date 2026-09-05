/* ============================================================================
 * 点滴团队 · 资金公开公示网站 —— 交互与渲染逻辑（main.js）
 * ----------------------------------------------------------------------------
 * 【文件作用】读取 js/data.js 中的 FUND_DATA 数据，完成：
 *   1. 资金汇总计算（累计注入 / 累计支出 / 当前余额）
 *   2. 总览数字滚动、时间线、明细表格渲染与筛选
 *   3. 手写 Canvas 图表（余额走势折线图、支出占比环形图）
 *   4. 浅色科技粒子网络背景
 *   5. 滚动入场动画、手机导航、QQ 复制、邮件链接等交互
 * 【维护提示】
 *   · 日常改账目不碰本文件，只改 js/data.js
 *   · 本文件按“区块注释”划分，每块功能独立，可按《网页整体构建.md》扩展
 *   · 所有对外接口挂在 window.FundApp 上，方便未来升级调用
 * 【设计原则】零外部依赖、零网络请求；file:// 双击可运行；出错不白屏。
 * ========================================================================== */

(function () {
  'use strict';

  /* ========================== 区块 0：小工具函数 ========================== */

  /** 按选择器取单个元素 */
  const $ = (sel, root) => (root || document).querySelector(sel);
  /** 按选择器取元素数组 */
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /**
   * 金额格式化：数字 → "12,000.00"（千分位 + 两位小数）
   * 非数字时返回 '0.00'，保证页面不崩
   */
  function formatMoney(n) {
    const num = Number(n);
    if (!isFinite(num)) return '0.00';
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** HTML 转义：防止账目摘要里的特殊字符破坏页面（也防注入） */
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** 系统/用户是否偏好“减少动态效果”（无障碍） */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** 显示顶部轻提示 */
  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ========================== 区块 1：数据读取与校验 ========================== */

  /** 校验并清洗账目数据：坏数据跳过并在控制台中文提示，绝不让页面白屏 */
  function loadRecords() {
    if (typeof FUND_DATA === 'undefined' || !FUND_DATA) {
      throw new Error('未找到数据对象 FUND_DATA：请确认 js/data.js 已正确加载。');
    }
    const raw = Array.isArray(FUND_DATA.records) ? FUND_DATA.records : [];
    const valid = [];
    raw.forEach((r, i) => {
      const where = `第 ${i + 1} 条记录`;
      if (!r || typeof r !== 'object') { console.warn(`[资金公示] ${where}格式错误，已跳过。`); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date || '')) { console.warn(`[资金公示] ${where}日期格式应为 YYYY-MM-DD（当前：${r.date}），已跳过。`); return; }
      if (r.type !== 'income' && r.type !== 'expense') { console.warn(`[资金公示] ${where}type 只能是 'income' 或 'expense'（当前：${r.type}），已跳过。`); return; }
      const amount = Number(r.amount);
      if (!isFinite(amount) || amount <= 0) { console.warn(`[资金公示] ${where}金额必须是大于 0 的数字（当前：${r.amount}），已跳过。`); return; }
      // 清洗后的标准记录（voucher 为预留扩展字段，没有也不影响）
      valid.push({
        date: r.date,
        type: r.type,
        category: String(r.category || '未分类'),
        desc: String(r.desc || ''),
        amount: amount,
        voucher: r.voucher ? String(r.voucher) : '',
      });
    });
    return valid;
  }

  /** 按日期排序后的记录（asc=true 从旧到新，用于计算；false 从新到旧，用于展示） */
  function sortRecords(records, asc) {
    const arr = records.slice().sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0
    );
    return asc ? arr : arr.reverse();
  }

  /* ========================== 区块 2：资金计算核心（升级接口①） ========================== */

  /** 汇总：累计注入、累计支出、当前余额、笔数 */
  function calcSummary(records) {
    let income = 0, expense = 0, incomeCount = 0, expenseCount = 0;
    records.forEach(r => {
      if (r.type === 'income') { income += r.amount; incomeCount++; }
      else { expense += r.amount; expenseCount++; }
    });
    return { income, expense, balance: income - expense, incomeCount, expenseCount };
  }

  /**
   * 余额走势序列：按时间从旧到新逐笔累计余额。
   * 返回 [{ date, balance }]，供折线图使用（未来也可接任意图表库）。
   */
  function buildBalanceSeries(records) {
    const points = [];
    let balance = 0;
    sortRecords(records, true).forEach(r => {
      balance += r.type === 'income' ? r.amount : -r.amount;
      points.push({ date: r.date, balance: Math.round(balance * 100) / 100 });
    });
    return points;
  }

  /**
   * 【预留升级接口】按月聚合收支：返回 [{ month:'2026-09', income, expense, balanceEnd }]
   * 未来要加“月度柱状图/月报”时直接调用本函数即可。
   */
  function monthlyAggregate(records) {
    const map = new Map();
    let balance = 0;
    sortRecords(records, true).forEach(r => {
      const month = r.date.slice(0, 7); // YYYY-MM
      if (!map.has(month)) map.set(month, { month, income: 0, expense: 0, balanceEnd: 0 });
      const m = map.get(month);
      if (r.type === 'income') m.income += r.amount; else m.expense += r.amount;
      balance += r.type === 'income' ? r.amount : -r.amount;
      m.balanceEnd = Math.round(balance * 100) / 100;
    });
    return Array.from(map.values());
  }

  /* ========================== 区块 3：页面文字渲染（站点信息/用途/页脚） ========================== */

  function renderSiteText(records) {
    const site = FUND_DATA.site || {};

    // 联系信息
    const email = site.email || '';
    const qq = site.qq || '';
    const githubUrl = site.githubUrl || ('https://github.com/' + (site.githubUser || ''));
    $('#qq-text').textContent = qq;
    $('#email-text').innerHTML = '监督邮箱：<b>' + escapeHtml(email) + '</b>';
    $('#mailto-btn').href = 'mailto:' + email + '?subject=' + encodeURIComponent('点滴团队资金公示 · 监督反馈');
    $('#github-link').href = githubUrl;

    // 页脚：年份 + 数据最后更新日期（取最新一条记录日期）
    $('#footer-year').textContent = new Date().getFullYear();
    const latest = records.length ? sortRecords(records, false)[0].date : '';
    $('#last-updated').textContent = latest || '暂无记录';

    // 资金用途说明板块（文案来自 data.js，可自行修改）
    const purpose = site.purpose || {};
    $('#purpose-nature').textContent = purpose.nature || '—';
    const fillList = (elId, arr) => {
      const ul = $(elId);
      ul.innerHTML = (arr || []).map(t => '<li>' + escapeHtml(t) + '</li>').join('');
    };
    fillList('#purpose-principles', purpose.principles);
    fillList('#purpose-rules', purpose.rules);

    // 功能开关：关闭图表 / 时间线时隐藏对应板块
    const feats = site.features || {};
    if (feats.showCharts === false) $('#chart-section').style.display = 'none';
    if (feats.showTimeline === false) $('#timeline').style.display = 'none';
  }

  /* ========================== 区块 4：总览数字 + 滚动计数动画 ========================== */

  /** 数字滚动动画（easeOutCubic 缓动；附定时兜底，极端环境下动画不跑也会显示最终值） */
  function countUp(el, to, duration) {
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = '¥' + formatMoney(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    if (prefersReducedMotion) { el.textContent = '¥' + formatMoney(to); return; }
    requestAnimationFrame(tick);
    // 兜底：动画时长结束后强制写最终值（setTimeout 在后台/受限环境仍会触发）
    setTimeout(() => { el.textContent = '¥' + formatMoney(to); }, duration + 200);
  }

  function renderStats(summary) {
    countUp($('#stat-income'), summary.income, 1200);
    countUp($('#stat-expense'), summary.expense, 1200);
    countUp($('#stat-balance'), summary.balance, 1400);
    $('#stat-income-count').textContent = '共 ' + summary.incomeCount + ' 笔收入';
    $('#stat-expense-count').textContent = '共 ' + summary.expenseCount + ' 笔支出';
  }

  /* ========================== 区块 5：资金流水时间线渲染 ========================== */

  function renderTimeline(recordsDesc) {
    const wrap = $('#timeline-list');
    if (!recordsDesc.length) {
      wrap.innerHTML = '<div class="tl-empty">暂无收支记录，等待第一笔公示。</div>';
      return;
    }
    wrap.innerHTML = recordsDesc.map((r, i) => {
      const isIncome = r.type === 'income';
      return (
        '<div class="tl-item reveal" style="transition-delay:' + Math.min(i, 6) * 70 + 'ms">' +
          '<div class="tl-dot ' + (isIncome ? 'tl-dot--income' : 'tl-dot--expense') + '">' + (isIncome ? '+' : '−') + '</div>' +
          '<div class="tl-card">' +
            '<div>' +
              '<div class="tl-meta">' +
                '<span class="tl-date">' + r.date + '</span>' +
                '<span class="tl-chip ' + (isIncome ? 'tl-chip--income' : 'tl-chip--expense') + '">' + (isIncome ? '收入' : '支出') + '</span>' +
                '<span class="tl-cat">' + escapeHtml(r.category) + '</span>' +
              '</div>' +
              '<div class="tl-desc">' + escapeHtml(r.desc) + '</div>' +
            '</div>' +
            '<div class="tl-amount ' + (isIncome ? 'tl-amount--income' : 'tl-amount--expense') + '">' +
              (isIncome ? '+' : '−') + '¥' + formatMoney(r.amount) +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
    observeReveals(wrap);
  }

  /* ========================== 区块 6：明细表格渲染与筛选 ========================== */

  let allRecordsDesc = [];   // 全部记录（倒序）
  let currentFilter = 'all'; // 当前筛选：all / income / expense

  function renderTable() {
    const tbody = $('#table-body');
    const list = allRecordsDesc.filter(r =>
      currentFilter === 'all' ? true : r.type === currentFilter
    );

    $('#empty-state').hidden = list.length > 0;

    tbody.innerHTML = list.map(r => {
      const isIncome = r.type === 'income';
      return (
        '<tr>' +
          '<td data-label="日期" class="cell-date">' + r.date + '</td>' +
          '<td data-label="类型"><span class="type-badge ' + (isIncome ? 'type-badge--income' : 'type-badge--expense') + '">' +
            (isIncome ? '收入' : '支出') + '</span></td>' +
          '<td data-label="分类" class="cell-cat">' + escapeHtml(r.category) + '</td>' +
          '<td data-label="摘要">' + escapeHtml(r.desc) + '</td>' +
          '<td data-label="金额" class="amount-cell ' + (isIncome ? 'amount-cell--income' : 'amount-cell--expense') + '">' +
            (isIncome ? '+' : '−') + '¥' + formatMoney(r.amount) + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function bindFilters() {
    $$('#filter-bar .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTable();
      });
    });
  }

  /* ========================== 区块 7：手写 Canvas 图表（升级接口②） ========================== */

  /** 处理高分屏（Retina）：按设备像素比放大画布，避免模糊 */
  function fitCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 50);
    const h = Math.max(rect.height, 50);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  /* ---------- 7.1 余额走势折线图 ---------- */
  const lineChart = {
    canvas: null, points: [], progress: 1, tipEl: null, hoverIndex: -1,
  };

  /** 把数值向上取整为“好看”的刻度（如 12000 → 12000 或 15000） */
  function niceCeil(v) {
    if (v <= 0) return 100;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / pow;
    const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return nice * pow;
  }

  function drawLineChart(animated) {
    const { ctx, w, h } = fitCanvas(lineChart.canvas);
    ctx.clearRect(0, 0, w, h);

    const pad = { left: 56, right: 18, top: 16, bottom: 30 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;
    const pts = lineChart.points;

    // 无数据时的提示
    if (!pts.length) {
      ctx.fillStyle = '#8a97b5';
      ctx.font = '13px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', w / 2, h / 2);
      return;
    }

    const maxV = niceCeil(Math.max.apply(null, pts.map(p => p.balance).concat([1])));
    const xOf = i => pts.length === 1 ? pad.left + cw / 2 : pad.left + (i / (pts.length - 1)) * cw;
    const yOf = v => pad.top + ch - (v / maxV) * ch;

    // —— 网格横线 + Y 轴金额刻度 ——
    ctx.strokeStyle = 'rgba(37,99,235,0.10)';
    ctx.fillStyle = '#8a97b5';
    ctx.lineWidth = 1;
    ctx.font = '11px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const rows = 4;
    for (let i = 0; i <= rows; i++) {
      const y = pad.top + (i / rows) * ch;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      const val = maxV * (1 - i / rows);
      ctx.fillText(val >= 10000 ? (val / 10000) + '万' : String(Math.round(val)), pad.left - 8, y);
    }

    // —— X 轴日期（最多显示 6 个，均匀抽样） ——
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelCount = Math.min(pts.length, 6);
    for (let i = 0; i < labelCount; i++) {
      const idx = pts.length === 1 ? 0 : Math.round(i * (pts.length - 1) / (labelCount - 1));
      ctx.fillStyle = '#8a97b5';
      ctx.fillText(pts[idx].date.slice(5), xOf(idx), h - pad.bottom + 8);
    }

    // —— 面积渐变填充 + 折线（按 progress 做绘制动画） ——
    const endX = pad.left + cw * (animated ? lineChart.progress : 1);

    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.left - 2, 0, (endX - pad.left) + 4, h); // 裁剪到动画进度
    ctx.clip();

    // 渐变面积
    const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    areaGrad.addColorStop(0, 'rgba(37,99,235,0.22)');
    areaGrad.addColorStop(1, 'rgba(6,182,212,0.02)');
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(pts[0].balance));
    pts.forEach((p, i) => ctx.lineTo(xOf(i), yOf(p.balance)));
    ctx.lineTo(xOf(pts.length - 1), pad.top + ch);
    ctx.lineTo(xOf(0), pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // 折线本身（蓝→青渐变描边）
    const lineGrad = ctx.createLinearGradient(pad.left, 0, w - pad.right, 0);
    lineGrad.addColorStop(0, '#2563eb');
    lineGrad.addColorStop(1, '#06b6d4');
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(p.balance)) : ctx.lineTo(xOf(i), yOf(p.balance)));
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // 数据点
    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(xOf(i), yOf(p.balance), i === pts.length - 1 ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });
    ctx.restore();

    // —— 悬停数据点 + 提示框 ——
    if (lineChart.hoverIndex >= 0 && lineChart.hoverIndex < pts.length && (!animated || lineChart.progress >= 1)) {
      const i = lineChart.hoverIndex;
      const x = xOf(i), y = yOf(pts[i].balance);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(37,99,235,0.18)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#2563eb';
      ctx.fill();

      const tip = lineChart.tipEl;
      tip.style.display = 'block';
      tip.innerHTML = pts[i].date + '<br><b>余额 ¥' + formatMoney(pts[i].balance) + '</b>';
      const tipW = tip.offsetWidth, tipH = tip.offsetHeight;
      let tx = x - tipW / 2;
      tx = Math.max(pad.left, Math.min(tx, w - pad.right - tipW));
      tip.style.transform = 'translate(' + tx + 'px,' + (y - tipH - 14) + 'px)';
    } else {
      lineChart.tipEl.style.display = 'none';
    }
  }

  /** 折线图绘制动画（从 0 到 1） */
  function animateLineChart() {
    if (prefersReducedMotion) { lineChart.progress = 1; drawLineChart(false); return; }
    const start = performance.now(), dur = 1300;
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      lineChart.progress = 1 - Math.pow(1 - p, 3); // easeOutCubic
      drawLineChart(true);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initLineChart(series) {
    const canvas = $('#chart-line');
    if (!canvas) return;
    lineChart.canvas = canvas;
    lineChart.points = series;

    // 悬停提示框（绝对定位于图表容器内）
    const tip = document.createElement('div');
    tip.style.cssText =
      'position:absolute;top:0;left:0;display:none;pointer-events:none;' +
      'background:#0f1f42;color:#fff;font-size:12px;line-height:1.5;' +
      'padding:7px 12px;border-radius:10px;white-space:nowrap;z-index:5;' +
      'box-shadow:0 8px 20px rgba(15,31,66,.25);';
    canvas.parentNode.style.position = 'relative';
    canvas.parentNode.appendChild(tip);
    lineChart.tipEl = tip;

    // 鼠标/触摸移动 → 找最近的数据点
    function onMove(clientX) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const pad = 56;
      const cw = rect.width - pad - 18;
      const n = lineChart.points.length;
      if (n === 1) { lineChart.hoverIndex = 0; }
      else {
        const idx = Math.round(((x - pad) / cw) * (n - 1));
        lineChart.hoverIndex = Math.max(0, Math.min(n - 1, idx));
      }
      drawLineChart(false);
    }
    canvas.addEventListener('mousemove', e => onMove(e.clientX));
    canvas.addEventListener('mouseleave', () => { lineChart.hoverIndex = -1; drawLineChart(false); });
    canvas.addEventListener('touchmove', e => { if (e.touches[0]) onMove(e.touches[0].clientX); }, { passive: true });

    // 兜底：先立即画一帧静态底图（网格/坐标轴立刻可见），再播放绘制动画
    drawLineChart(true);
    animateLineChart();
    // 二次兜底：若动画帧在极端环境下未执行（画布仍是默认 300x150），强制静态画全图
    setTimeout(() => {
      if (lineChart.canvas.width <= 300) {
        lineChart.progress = 1;
        lineChart.hoverIndex = -1;
        drawLineChart(false);
      }
    }, 1600);
  }

  /* ---------- 7.2 支出占比环形图 ---------- */

  function drawRingChart(percent, animated) {
    const canvas = $('#chart-ring');
    if (!canvas) return;
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) / 2 - 22;
    const lineW = 15;

    // 底环
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#e6edfb';
    ctx.lineWidth = lineW;
    ctx.stroke();

    // 进度环（蓝→青渐变），从 12 点方向起笔
    const p = Math.min(percent, 1) * (animated ? ringState.progress : 1);
    if (p > 0) {
      const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      grad.addColorStop(0, '#2563eb');
      grad.addColorStop(1, '#06b6d4');
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
      ctx.strokeStyle = grad;
      ctx.lineWidth = lineW;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // 中心文字
    ctx.fillStyle = '#0f1f42';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 ' + Math.round(r * 0.42) + 'px ' + getComputedStyle(document.body).fontFamily;
    ctx.fillText((percent * 100).toFixed(1) + '%', cx, cy - 8);
    ctx.fillStyle = '#5d6e8f';
    ctx.font = '600 12px ' + getComputedStyle(document.body).fontFamily;
    ctx.fillText('累计支出 / 累计注入', cx, cy + r * 0.42);
  }

  const ringState = { progress: 0 };
  function animateRing(percent) {
    if (prefersReducedMotion) { ringState.progress = 1; drawRingChart(percent, true); return; }
    const start = performance.now(), dur = 1300;
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      ringState.progress = 1 - Math.pow(1 - p, 3);
      drawRingChart(percent, true);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  /* ---------- 7.3 图表统一初始化与窗口缩放重绘 ---------- */
  function initCharts(summary, series) {
    if ((FUND_DATA.site && FUND_DATA.site.features && FUND_DATA.site.features.showCharts) === false) return;
    initLineChart(series);
    const percent = summary.income > 0 ? summary.expense / summary.income : 0;
    animateRing(percent);

    // 窗口尺寸变化（旋转屏幕/拖窗口）时重绘，防抖处理
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        lineChart.progress = 1; // 重绘不再重播动画
        ringState.progress = 1;
        drawLineChart(false);
        drawRingChart(percent, false);
      }, 180);
    });
  }

  /* ========================== 区块 8：浅色科技粒子网络背景 ========================== */

  function initParticles() {
    const canvas = $('#bg-canvas');
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, particles = [];
    const reduced = prefersReducedMotion;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 粒子密度：大屏约 1 个 / 16000px²，手机减半
      const count = reduced ? 0 : Math.min(110, Math.floor(W * H / (W < 640 ? 26000 : 16000)));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1.4 + Math.random() * 1.3,
        });
      }
      drawFrame(); // 尺寸变化后立即画一帧
    }

    function drawFrame() {
      ctx.clearRect(0, 0, W, H);
      // 粒子之间距离近时连线（科技网络感）
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(37,99,235,' + (0.14 * (1 - dist / 120)) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      // 粒子本体
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37,99,235,0.45)';
        ctx.fill();
      });
    }

    function loop() {
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });
      drawFrame();
      requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);
    // requestAnimationFrame 在浏览器标签页切走时自动暂停、切回时自动恢复，
    // 因此无需手动重启循环（避免重复启动多个动画循环）。
    if (!reduced) requestAnimationFrame(loop);
  }

  /* ========================== 区块 9：滚动入场动画 ========================== */

  let revealObserver = null;
  let ioDelivered = false; // IntersectionObserver 是否已正常回调
  function observeReveals(root) {
    if (prefersReducedMotion) {
      $$('.reveal', root || document).forEach(el => el.classList.add('revealed'));
      return;
    }
    // 极端环境（不支持 IO 的旧内核）直接全部显示
    if (!('IntersectionObserver' in window)) {
      $$('.reveal', root || document).forEach(el => el.classList.add('revealed'));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        ioDelivered = true;
        entries.forEach(en => {
          if (en.isIntersecting) {
            en.target.classList.add('revealed');
            revealObserver.unobserve(en.target);
          }
        });
      }, { threshold: 0.12 });
      // 看门狗：700ms 内 IO 未回调（个别自动化/受限环境），直接显示全部内容，
      // 宁可放弃入场动画，也绝不允许内容被永久隐藏。
      setTimeout(() => {
        if (!ioDelivered) {
          $$('.reveal').forEach(el => el.classList.add('revealed'));
        }
      }, 700);
    }
    $$('.reveal', root || document).forEach(el => {
      if (!el.classList.contains('revealed')) revealObserver.observe(el);
    });
  }

  /* ========================== 区块 10：交互（手机导航 / QQ 复制） ========================== */

  function bindNav() {
    const toggle = $('#nav-toggle');
    const links = $('#nav-links');
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // 点击菜单项后自动收起
    $$('#nav-links a').forEach(a =>
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  function bindQQCopy() {
    const btn = $('#qq-copy');
    const qq = (FUND_DATA.site && FUND_DATA.site.qq) || '';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(qq);
        toast('QQ 号已复制：' + qq);
      } catch (e) {
        // 旧浏览器降级方案：临时输入框 + execCommand
        const ta = document.createElement('textarea');
        ta.value = qq;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); toast('QQ 号已复制：' + qq); }
        catch (err) { toast('复制失败，请手动记录 QQ：' + qq); }
        document.body.removeChild(ta);
      }
    });
  }

  /* ========================== 区块 11：启动入口 ========================== */

  /** 页面顶部的致命错误提示条（数据丢失等极端情况，避免白屏无提示） */
  function showFatal(msg) {
    const div = document.createElement('div');
    div.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:999;background:#e11d48;color:#fff;' +
      'padding:14px 20px;font-size:14px;text-align:center;font-family:sans-serif;';
    div.textContent = '⚠ 网站数据加载失败：' + msg + ' 请检查 js/data.js 文件是否被误改。';
    document.body.appendChild(div);
  }

  function renderAll() {
    // 1) 数据
    const records = loadRecords();
    allRecordsDesc = sortRecords(records, false);
    const summary = calcSummary(records);
    const series = buildBalanceSeries(records);

    // 2) 渲染各板块
    renderSiteText(records);
    renderStats(summary);
    renderTimeline(allRecordsDesc);
    renderTable();
    bindFilters();
    initCharts(summary, series);

    // 3) 对外暴露 API（控制台可输入 FundApp.summary() 查看，未来升级直接调用）
    window.FundApp = {
      version: '1.0.0',
      data: FUND_DATA,
      getRecords: (desc) => sortRecords(records, desc === false),
      summary: () => calcSummary(records),
      balanceSeries: () => buildBalanceSeries(records),
      monthlyAggregate: () => monthlyAggregate(records),
      renderAll: renderAll,
    };
    return { summary, series };
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      renderAll();
      initParticles();
      observeReveals();
      bindNav();
      bindQQCopy();
      console.log('%c点滴团队资金公示 · 页面加载完成', 'color:#2563eb;font-weight:bold;');
      console.log('提示：在控制台输入 FundApp.summary() 可查看资金汇总数据。');
    } catch (err) {
      console.error('[资金公示] 初始化失败：', err);
      showFatal(err.message);
    }
  });
})();
