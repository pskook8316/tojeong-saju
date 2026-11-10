(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const E = TJ.create({ Solar, Lunar, LunarMonth });
  const { GAN_KO, ZHI_KO, EL, EL_HANJA, SIPSEONG, GROUP, GAN, ZHI } = TJ;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 해석 문구 (자체 작성) ---------- */
  const SS_THEME = {
    0: ['비견', '동료·경쟁', '주변 사람과 힘을 합치거나 겨루게 되는 시기입니다. 독립심이 커지고 지출이 늘기 쉬우니 공동 사안은 문서로 정리하세요.'],
    1: ['겁재', '경쟁·지출', '경쟁자가 나타나거나 새는 돈이 생기기 쉽습니다. 보증, 동업, 충동구매는 한 번 더 따져 보세요.'],
    2: ['식신', '여유·표현', '마음이 편해지고 재능을 보여 주기 좋습니다. 먹는 즐거움과 취미 활동이 활력이 됩니다.'],
    3: ['상관', '변화·말', '새로운 시도와 변화의 기운이 강합니다. 말이 앞서 구설이 생기기 쉬우니 윗사람과의 대화는 차분히 하세요.'],
    4: ['편재', '활동·유동 재물', '돈이 오가는 움직임이 커집니다. 사업적 기회가 보이지만 크게 벌이기보다 분산해서 다루는 편이 안전합니다.'],
    5: ['정재', '안정 수입', '꾸준한 수입과 계획적인 관리에 유리합니다. 저축과 정리 정돈에 힘쓰면 결과가 쌓입니다.'],
    6: ['편관', '압박·책임', '일과 책임이 몰리고 긴장이 커집니다. 무리하면 몸이 먼저 신호를 보내니 휴식 시간을 먼저 잡으세요.'],
    7: ['정관', '직장·신뢰', '조직 안에서 인정받고 신뢰를 쌓기 좋습니다. 규칙과 약속을 지키면 평가가 올라갑니다.'],
    8: ['편인', '공부·고독', '생각이 깊어지고 공부나 자격 준비에 좋은 시기입니다. 혼자 고민을 쌓지 말고 가까운 사람과 나누세요.'],
    9: ['정인', '도움·안정', '주변의 도움과 마음의 안정이 따릅니다. 학업, 계약, 문서 일에 좋은 소식이 기대됩니다.']
  };
  const TIER_NAME = ['凶 조심', '平 보통', '吉 좋음', '大吉 매우 좋음'];
  const TIER_ADVICE = [
    '큰 결정은 미루고 건강과 지출을 우선 챙기세요.',
    '무난한 흐름입니다. 하던 일을 꾸준히 이어 가세요.',
    '추진하던 일에 힘이 실립니다. 계획을 실행에 옮기기 좋습니다.',
    '기회가 몰리는 달입니다. 미뤄 둔 중요한 일을 이때 진행하세요.'
  ];
  const GROUP_DESC = [
    '자기 주관과 독립심이 강하고 주변과 비교·협력이 잦습니다.',
    '표현력과 재능이 풍부하고 아이디어가 많습니다.',
    '현실 감각이 있고 재물과 결과를 챙기는 힘이 있습니다.',
    '책임감과 규율, 사회적 역할이 두드러집니다.',
    '배움과 보호, 안정을 중시하고 생각이 깊습니다.'
  ];
  const YEAR_SS = [
    '비견의 해입니다. 협력자와 경쟁자가 함께 늘어나므로 팀워크를 챙기고 지출을 점검하세요.',
    '겁재의 해입니다. 돈이 새기 쉬운 해이니 동업과 보증은 신중하게 판단하세요.',
    '식신의 해입니다. 여유와 결실이 따르고 재능을 펼치기 좋은 해입니다.',
    '상관의 해입니다. 변화와 도전의 해이며 말과 태도를 다듬으면 기회가 됩니다.',
    '편재의 해입니다. 활동 범위가 넓어지고 유동 자금이 커집니다. 분산 관리가 핵심입니다.',
    '정재의 해입니다. 안정적인 수입과 알뜰한 관리로 실속을 챙기는 해입니다.',
    '편관의 해입니다. 책임과 압박이 커지는 해이니 체력 관리와 일정 조율이 중요합니다.',
    '정관의 해입니다. 직장과 사회적 신뢰를 쌓기 좋은 해입니다.',
    '편인의 해입니다. 공부와 연구, 전환점을 준비하는 해입니다.',
    '정인의 해입니다. 귀인의 도움과 문서·학업 운이 좋은 해입니다.'
  ];

  const ZODIAC = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

  /* ---------- 상태 ---------- */
  let current = null;
  let lastInput = null;

  /* ---------- 유틸 ---------- */
  const stemSpan = (g, el) => `<span class="ch el${el}">${GAN[g]}</span>`;
  const branchSpan = (z, el) => `<span class="ch el${el}">${ZHI[z]}</span>`;
  const elName = (e) => `${EL_HANJA[e]}(${EL[e]})`;

  function ring(score, label) {
    const r = 42, c = 2 * Math.PI * r, off = c * (1 - score / 100);
    const col = score >= 70 ? 'var(--good)' : score >= 50 ? 'var(--accent)' : 'var(--bad)';
    return `<div class="gauge"><svg viewBox="0 0 110 110" role="img" aria-label="${label} ${score}점">
      <circle cx="55" cy="55" r="${r}" fill="none" stroke="var(--soft)" stroke-width="10"/>
      <circle cx="55" cy="55" r="${r}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"
        stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 55 55)"/>
      <text x="55" y="61" text-anchor="middle" font-size="24" font-weight="700" fill="var(--fg)" style="font-family:var(--display)">${score}</text>
    </svg><div class="gl">${label}</div></div>`;
  }

  function lineChart(months) {
    const W = 560, H = 190, L = 34, R = 14, T = 14, B = 28;
    const x = (i) => L + (i * (W - L - R)) / 11;
    const y = (v) => T + ((100 - v) * (H - T - B)) / 100;
    let grid = '';
    [0, 25, 50, 75, 100].forEach((v) => {
      grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" ${v === 50 ? 'stroke-dasharray="4 4"' : ''}/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    });
    const pts = months.map((m, i) => `${x(i).toFixed(1)},${y(m.score).toFixed(1)}`).join(' ');
    const area = `${x(0)},${y(0)} ${pts} ${x(11)},${y(0)}`;
    const dots = months.map((m, i) => {
      const col = m.tier === 3 ? 'var(--good)' : m.tier === 0 ? 'var(--bad)' : 'var(--accent)';
      return `<circle cx="${x(i).toFixed(1)}" cy="${y(m.score).toFixed(1)}" r="${m.tier === 3 || m.tier === 0 ? 5 : 3.5}" fill="${col}"><title>${m.month}월 ${m.score}점</title></circle>`;
    }).join('');
    const xl = months.map((m, i) => `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${m.month}월</text>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="월별 운세 점수 꺾은선 그래프">
      ${grid}<polygon points="${area}" fill="var(--accent)" opacity=".1"/>
      <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>${dots}${xl}</svg>`;
  }

  /* ---------- 사주 탭 ---------- */
  function renderSaju(a) {
    const P = a.pillars;
    const order = [['time', '시주'], ['day', '일주'], ['month', '월주'], ['year', '연주']];
    const pil = order.map(([k, label]) => {
      const p = P[k];
      if (!p) return `<div class="pil"><div class="t">${label}</div><span class="ch" style="color:var(--muted)">—</span><span class="ch" style="color:var(--muted)">—</span><div class="ko">시각 모름</div></div>`;
      const gSs = k === 'day' ? '일간(나)' : SIPSEONG[a.ss[k].gan];
      return `<div class="pil ${k === 'day' ? 'me' : ''}">
        <div class="t">${label}</div>
        <div class="ss">${gSs}</div>${stemSpan(p.g, p.gEl)}<div class="ko">${p.gKo}${EL[p.gEl]}</div>
        ${branchSpan(p.z, p.zEl)}<div class="ko">${p.zKo}${EL[p.zEl]}</div>
        <div class="ss">${SIPSEONG[a.ss[k].zhi]}</div></div>`;
    }).join('');

    const max = Math.max(...a.count, 1);
    const bars = a.count.map((c, e) => `<div class="bar"><span class="el${e}">${EL_HANJA[e]} ${EL[e]}</span>
      <span class="tr"><span class="fl" style="width:${(c / max) * 100}%;background:var(--el${e})"></span></span><span class="n">${c}</span></div>`).join('');
    const lack = a.count.map((c, e) => (c === 0 ? EL[e] : null)).filter(Boolean);
    const strongE = a.count.indexOf(Math.max(...a.count));

    const grpBars = a.grp.map((c, i) => `<div class="bar"><span>${GROUP[i]}</span>
      <span class="tr"><span class="fl" style="width:${(c / Math.max(...a.grp, 1)) * 100}%;background:var(--accent)"></span></span><span class="n">${c}</span></div>`).join('');
    const topGrp = a.grp.indexOf(Math.max(...a.grp));

    const ty = Number($('year').value);
    const dy = a.daYun.map((d) => {
      const now = ty >= d.startYear && ty <= d.endYear;
      return `<div class="${now ? 'now' : ''}"><div>${d.startAge}세 · ${d.startYear}</div>${stemSpan(TJ.GAN.indexOf(d.gz[0]), d.gEl)}${branchSpan(TJ.ZHI.indexOf(d.gz[1]), d.zEl)}<div>${SIPSEONG[d.ss]}</div></div>`;
    }).join('');

    const L = a.lunarInfo;
    return `
    <div class="card"><h3>사주 원국</h3>
      <p class="sub">양력 ${a.solar.toYmd()} ${a.hasTime ? a.solar.toYmdHms().slice(11, 16) : '(시각 모름)'} · 음력 ${L.y}년 ${L.m < 0 ? '윤' : ''}${Math.abs(L.m)}월 ${L.d}일 · ${ZODIAC[a.pillars.year.z]}띠</p>
      <div class="pillars">${pil}</div></div>
    <div class="facts">
      <div class="fact"><small>일간(나)</small><b class="el${a.dmEl}">${GAN[a.dm]}${GAN_KO[a.dm]} ${EL[a.dmEl]}</b></div>
      <div class="fact"><small>일간 강약</small><b>${a.strong ? '강한 편' : '약한 편'}</b></div>
      <div class="fact"><small>용신(간이)</small><b class="el${a.yong}">${elName(a.yong)}</b></div>
      <div class="fact"><small>부족한 오행</small><b>${lack.length ? lack.join('·') : '없음'}</b></div>
    </div>
    <div class="cols">
      <div class="card"><h3>오행 분포</h3><p class="sub">천간과 지지 8글자(시각 모름이면 6글자) 기준</p><div class="bars">${bars}</div>
        <p class="text m" style="margin-top:10px">${EL[strongE]} 기운이 가장 많고, ${lack.length ? lack.join('·') + ' 기운이 비어 있습니다.' : '다섯 기운이 모두 있습니다.'}</p></div>
      <div class="card"><h3>십성 분포</h3><p class="sub">일간을 기준으로 본 관계</p><div class="bars">${grpBars}</div>
        <p class="text m" style="margin-top:10px">${GROUP[topGrp]}이 두드러집니다. ${GROUP_DESC[topGrp]}</p></div>
    </div>
    <div class="card"><h3>성향 요약</h3>
      <p class="text">일간이 ${EL[a.dmEl]}(${GAN[a.dm]})이고 ${a.strong ? '자신을 돕는 기운(비겁·인성)이 충분한 편' : '자신을 돕는 기운(비겁·인성)이 적은 편'}입니다.
      ${a.strong ? '힘이 넘치므로 재능을 밖으로 쓰고 재물·직업 쪽으로 풀어 줄 때 균형이 잡힙니다.' : '주변의 도움과 배움, 꾸준한 자기 관리가 힘이 됩니다.'}
      참고용 용신은 ${elName(a.yong)}이며, 일상에서는 ${TJ.LUCKY[a.yong].color} 계열과 ${TJ.LUCKY[a.yong].dir} 방향을 가까이하는 정도로 활용해 보세요.</p></div>
    <div class="card"><h3>대운</h3><p class="sub">10년 단위 흐름. 테두리가 있는 칸이 ${ty}년이 속한 대운입니다.</p><div class="dy">${dy}</div></div>`;
  }

  /* ---------- 토정비결 탭 ---------- */
  function renderTj(a, t) {
    const overall = t.avg >= 62 ? '전반적으로 흐름이 좋은 해입니다.' : t.avg >= 50 ? '무난하게 이어지며 달마다 기복이 있는 해입니다.' : '신중함이 필요한 해입니다. 무리하지 않으면 큰 문제 없이 지나갑니다.';
    const cards = t.months.map((m) => {
      const th = SS_THEME[m.ss];
      return `<div class="mc"><div class="h"><b>${m.month}월</b><span class="pill t${m.tier}">${TIER_NAME[m.tier]}</span></div>
        <div class="s">${m.gKo}${m.zKo}월 · ${th[0]} · ${th[1]} · ${m.score}점</div>
        <div class="t">${th[2]} ${TIER_ADVICE[m.tier]}</div></div>`;
    }).join('');
    return `
    <div class="card"><h3>${t.year}년 ${t.yearGz} ${t.year === 2026 ? '병오년' : ''} 괘</h3>
      <div class="gw"><div class="num" aria-label="괘 번호 ${t.gwae}">${t.gwae}</div>
        <div class="text m">상괘 ${t.up} · 중괘 ${t.mid} · 하괘 ${t.low}<br>${a.input.name ? esc(a.input.name) + '님, ' : ''}한국 나이 ${t.age}세 · 생월 ${t.dim === 30 ? '큰달(30일)' : '작은달(29일)'}</div></div>
      <p class="text" style="margin-top:12px"><b>총운</b> ${overall} ${YEAR_SS[t.yearSs]}</p></div>
    <div class="card"><h3>월별 운세 흐름</h3><p class="sub">점수는 달의 간지가 본인 사주의 용신과 얼마나 맞는지와 괘 번호로 계산합니다. 음력 월 기준입니다.</p>${lineChart(t.months)}</div>
    <div class="card"><h3>12개월 운세</h3><div class="months">${cards}</div></div>`;
  }

  /* ---------- 종합 탭 ---------- */
  function renderAll(a, t) {
    const gauges = t.fields.map((f) => ring(f.score, f.key)).join('');
    const cal = t.months.map((m) => `<div class="${t.good.includes(m.month) ? 'g' : t.bad.includes(m.month) ? 'b' : ''}">${m.month}월${t.good.includes(m.month) ? ' ▲' : t.bad.includes(m.month) ? ' ▼' : ''}</div>`).join('');
    const lk = t.lucky;
    const best = t.fields.slice().sort((x, y) => y.score - x.score)[0];
    const worst = t.fields.slice().sort((x, y) => x.score - y.score)[0];
    return `
    <div class="card"><h3>${t.year}년 분야별 점수</h3><p class="sub">사주의 십성 분포, 오행 균형, 그해 세운의 십성을 반영한 간이 점수입니다.</p><div class="gauges">${gauges}</div>
      <p class="text" style="margin-top:12px">${best.key} 쪽이 가장 좋고(${best.score}점), ${worst.key} 쪽은 가장 신경 쓸 부분입니다(${worst.score}점).</p></div>
    <div class="card"><h3>좋은 달과 조심할 달</h3><p class="sub">▲ 좋은 달 ${t.good.join('·')}월 / ▼ 조심할 달 ${t.bad.join('·')}월 (연 평균 ${t.avg}점)</p><div class="cal">${cal}</div></div>
    <div class="card"><h3>행운 정보</h3><p class="sub">용신 ${elName(a.yong)} 기준 참고 정보</p>
      <div class="lucky"><div class="fact"><small>행운의 색</small><b>${lk.color}</b></div><div class="fact"><small>행운의 방향</small><b>${lk.dir}</b></div><div class="fact"><small>행운의 숫자</small><b>${lk.nums}</b></div></div></div>`;
  }

  /* ---------- 입력/흐름 ---------- */
  function readInput() {
    const dm = $('date').value.trim().match(/^(\d{4})\D*(\d{1,2})\D*(\d{1,2})$/);
    const ds = $('date').value.replace(/\D/g, '');
    let y, m, d;
    if (/^\d{4}\D+\d{1,2}\D+\d{1,2}$/.test($('date').value.trim()) && dm) { y = +dm[1]; m = +dm[2]; d = +dm[3]; }
    else if (ds.length === 8) { y = +ds.slice(0, 4); m = +ds.slice(4, 6); d = +ds.slice(6, 8); }
    if (!y || y < 1900 || y > 2099 || m < 1 || m > 12 || d < 1 || d > 31) {
      throw new Error('생년월일을 1990-05-15 또는 19900515 형식으로 입력하세요. (1900~2099년)');
    }
    if (document.querySelector('input[name=cal]:checked').value === 'solar') {
      const dt = new Date(y, m - 1, d);
      if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) throw new Error('존재하지 않는 양력 날짜입니다. 월·일을 확인하세요.');
    }
    let hour = null, minute = 0;
    if (!$('noTime').checked) {
      const t = $('time').value.trim();
      let mt = t.match(/^(\d{1,2})\D+(\d{1,2})$/);
      let h, mi;
      if (mt) { h = +mt[1]; mi = +mt[2]; }
      else if (/^\d{3,4}$/.test(t)) { h = +t.slice(0, t.length - 2); mi = +t.slice(-2); }
      else if (/^\d{1,2}$/.test(t)) { h = +t; mi = 0; }
      if (h === undefined || h < 0 || h > 23 || mi < 0 || mi > 59) {
        throw new Error('태어난 시각을 14:30 또는 1430 형식(24시간제)으로 입력하세요. 모르면 "태어난 시각 모름"을 선택하세요.');
      }
      hour = h; minute = mi;
    }
    return {
      name: $('name').value.trim(),
      gender: document.querySelector('input[name=gender]:checked').value,
      calendar: document.querySelector('input[name=cal]:checked').value,
      y, m, d, hour, minute, targetYear: Number($('year').value)
    };
  }

  function run(input, sample) {
    const err = $('err'); err.hidden = true;
    try {
      const a = E.analyze(input);
      const t = E.tojeong(a, input.targetYear);
      current = { a, t }; lastInput = input;
      $('who').innerHTML = `<b>${sample ? '예시 화면' : input.name ? esc(input.name) : '입력하신 분'}</b><span>${input.gender === 'M' ? '남' : '여'} · ${a.solar.toYmd()} ${a.hasTime ? '' : '(시각 모름)'}</span>`;
      $('p-saju').innerHTML = renderSaju(a);
      $('p-tj').innerHTML = renderTj(a, t);
      $('p-all').innerHTML = renderAll(a, t);
      $('result').hidden = false;
      if (!sample) $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      err.textContent = '풀이할 수 없는 날짜입니다. 음력 날짜가 존재하지 않거나 범위를 벗어났을 수 있습니다. (' + (e && e.message ? e.message : e) + ')';
      err.hidden = false;
    }
  }

  /* 탭 */
  const tabs = ['saju', 'tj', 'all'];
  function selectTab(name) {
    tabs.forEach((n) => {
      $('tab-' + n).setAttribute('aria-selected', String(n === name));
      $('p-' + n).hidden = n !== name;
    });
  }
  tabs.forEach((n) => $('tab-' + n).addEventListener('click', () => selectTab(n)));

  /* 저장된 사람 (이 브라우저에만 저장) */
  const KEY = 'tojeong-saved-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const store = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* 저장 불가 */ } };
  function renderSaved() {
    const list = load(), box = $('saved');
    box.hidden = list.length === 0;
    box.innerHTML = list.map((p, i) => `<span class="chip"><button type="button" data-open="${i}">${esc(p.name || '이름 없음')}</button><button type="button" class="x" data-del="${i}" aria-label="${esc(p.name || '이름 없음')} 삭제">×</button></span>`).join('');
  }
  $('saved').addEventListener('click', (ev) => {
    const o = ev.target.dataset.open, d = ev.target.dataset.del;
    const list = load();
    if (o !== undefined) { fill(list[o]); run(readInput()); }
    if (d !== undefined) { list.splice(d, 1); store(list); renderSaved(); }
  });
  $('saveBtn').addEventListener('click', () => {
    try { const i = readInput(); const list = load().filter((p) => p.name !== i.name || !i.name); list.push(i); store(list.slice(-12)); renderSaved(); } catch (e) { /* 입력 오류 */ }
  });
  function fill(p) {
    $('name').value = p.name || '';
    document.querySelector(`input[name=gender][value=${p.gender}]`).checked = true;
    document.querySelector(`input[name=cal][value=${p.calendar}]`).checked = true;
    $('date').value = `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
    if (p.hour === null) { $('noTime').checked = true; } else { $('noTime').checked = false; $('time').value = `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`; }
    syncTime();
  }

  function syncTime() { $('time').disabled = $('noTime').checked; }
  $('noTime').addEventListener('change', syncTime);
  $('form').addEventListener('submit', (ev) => { ev.preventDefault(); try { run(readInput()); } catch (e) { $('err').textContent = e.message; $('err').hidden = false; } });
  $('year').addEventListener('change', () => { if (!$('result').hidden) { try { run(readInput()); } catch (e) { /* 무시 */ } } });

  /* 테마 */
  $('themeBtn').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('tojeong-theme', root.dataset.theme); } catch (e) { /* 무시 */ }
  });
  try { const th = localStorage.getItem('tojeong-theme'); if (th) document.documentElement.dataset.theme = th; } catch (e) { /* 무시 */ }

  /* 초기화 */
  const now = new Date().getFullYear();
  for (let y = now - 1; y <= now + 2; y++) {
    const o = document.createElement('option');
    o.value = y; o.textContent = `${y}년${y === now ? ' (올해)' : ''}`;
    if (y === now) o.selected = true;
    $('year').appendChild(o);
  }
  ['date', 'time'].forEach((id) => $(id).addEventListener('focus', () => $(id).select()));
  syncTime(); renderSaved();
  run(readInput(), true); // 예시 값으로 첫 화면을 채운다
})();
