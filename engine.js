/* 사주·토정비결 계산 엔진. 브라우저(전역 TJ)와 Node(module.exports) 양쪽에서 사용.
   만세력 계산은 lunar-javascript 의 Solar / Lunar 를 주입받아 사용한다. */
(function (root) {
  'use strict';

  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const GAN_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const ZHI_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  // 오행 인덱스: 0 목, 1 화, 2 토, 3 금, 4 수  (상생 순서)
  const EL = ['목', '화', '토', '금', '수'];
  const EL_HANJA = ['木', '火', '土', '金', '水'];
  const GAN_EL = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  const ZHI_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  // 지지 본기(정기) 천간 인덱스
  const ZHI_MAIN = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];

  const SIPSEONG = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
  const GROUP = ['비겁', '식상', '재성', '관성', '인성'];

  const LUCKY = [
    { color: '청색·초록', dir: '동쪽', nums: '3, 8' },
    { color: '붉은색·주황', dir: '남쪽', nums: '2, 7' },
    { color: '황색·갈색', dir: '중앙', nums: '5, 10' },
    { color: '흰색·은색', dir: '서쪽', nums: '4, 9' },
    { color: '검정·남색', dir: '북쪽', nums: '1, 6' }
  ];

  const mod = (a, n) => ((a % n) + n) % n;
  const ganIdx = (ch) => GAN.indexOf(ch);
  const zhiIdx = (ch) => ZHI.indexOf(ch);

  // 일간 g 기준, 대상 천간 o 의 십성 인덱스(SIPSEONG)
  function sipseong(g, o) {
    const ge = GAN_EL[g], oe = GAN_EL[o];
    const same = (g % 2) === (o % 2);
    const rel = mod(oe - ge, 5); // 0 비겁, 1 식상, 2 재성, 3 관성, 4 인성
    return rel * 2 + (same ? 0 : 1);
  }
  const groupOf = (ssIdx) => Math.floor(ssIdx / 2);

  function pillarOf(gz) {
    const g = ganIdx(gz[0]), z = zhiIdx(gz[1]);
    return { gz, g, z, gKo: GAN_KO[g], zKo: ZHI_KO[z], gEl: GAN_EL[g], zEl: ZHI_EL[z] };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // 토정비결 간이 수: 천간 번호(1~10) + 지지 번호(1~12)
  function gzNumber(gz) { return ganIdx(gz[0]) + 1 + zhiIdx(gz[1]) + 1; }
  function wrap(n, d) { const r = n % d; return r === 0 ? d : r; }

  function create(lib) {
    const { Solar, Lunar } = lib;

    function toSolar(input) {
      if (input.calendar === 'solar') return Solar.fromYmd(input.y, input.m, input.d);
      const month = input.calendar === 'leap' ? -input.m : input.m;
      return Lunar.fromYmd(input.y, month, input.d).getSolar();
    }

    function analyze(input) {
      const solar = toSolar(input);
      const hasTime = input.hour !== null && input.hour !== undefined && input.hour !== '';
      const hour = hasTime ? Number(input.hour) : 12;
      const minute = hasTime ? Number(input.minute || 0) : 0;
      const s2 = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), hour, minute, 0);
      const lunar = s2.getLunar();
      const ec = lunar.getEightChar();

      const pillars = {
        year: pillarOf(ec.getYear()),
        month: pillarOf(ec.getMonth()),
        day: pillarOf(ec.getDay()),
        time: hasTime ? pillarOf(ec.getTime()) : null
      };
      const dm = pillars.day.g; // 일간
      const dmEl = GAN_EL[dm];

      // 십성
      const ss = {};
      ['year', 'month', 'time'].forEach((k) => {
        const p = pillars[k];
        ss[k] = p ? { gan: sipseong(dm, p.g), zhi: sipseong(dm, ZHI_MAIN[p.z]) } : null;
      });
      ss.day = { gan: null, zhi: sipseong(dm, ZHI_MAIN[pillars.day.z]) };

      // 오행 분포 (천간+지지)
      const count = [0, 0, 0, 0, 0];
      Object.values(pillars).forEach((p) => { if (p) { count[p.gEl]++; count[p.zEl]++; } });

      // 십성 그룹 분포 (일간 제외)
      const grp = [0, 0, 0, 0, 0];
      ['year', 'month', 'time'].forEach((k) => { if (ss[k]) { grp[groupOf(ss[k].gan)]++; } });
      Object.keys(pillars).forEach((k) => { if (pillars[k]) grp[groupOf(ss[k].zhi)]++; });

      // 일간 강약 (월지 가중)
      let help = 0, total = 0;
      const addScore = (el, w) => {
        total += w;
        const rel = mod(el - dmEl, 5);
        if (rel === 0 || rel === 4) help += w; // 비겁, 인성
      };
      ['year', 'month', 'time'].forEach((k) => { if (pillars[k]) addScore(pillars[k].gEl, 1); });
      Object.keys(pillars).forEach((k) => { if (pillars[k]) addScore(pillars[k].zEl, k === 'month' ? 3 : 1); });
      const ratio = help / total;
      const strong = ratio >= 0.5;

      // 용신(간이): 강하면 설기·극하는 쪽 중 가장 부족한 오행, 약하면 돕는 쪽 중 가장 부족한 오행
      const cand = strong ? [1, 2, 3].map((r) => mod(dmEl + r, 5)) : [4, 0].map((r) => mod(dmEl + r, 5));
      let yong = cand[0];
      cand.forEach((e) => { if (count[e] < count[yong]) yong = e; });
      const gisin = mod(yong + 3, 5); // 용신을 극하는 오행

      // 대운
      const male = input.gender === 'M';
      const yun = ec.getYun(male ? 1 : 0);
      const daYun = yun.getDaYun().filter((d) => d.getGanZhi()).slice(0, 9).map((d) => {
        const p = pillarOf(d.getGanZhi());
        return {
          gz: d.getGanZhi(), gKo: p.gKo, zKo: p.zKo, gEl: p.gEl, zEl: p.zEl,
          startAge: d.getStartAge(), endAge: d.getEndAge(),
          startYear: d.getStartYear(), endYear: d.getEndYear(),
          ss: sipseong(dm, p.g)
        };
      });

      return {
        input, solar: s2, lunar, hasTime, pillars, dm, dmEl, ss, count, grp,
        ratio, strong, yong, gisin, daYun,
        lunarInfo: { y: lunar.getYear(), m: lunar.getMonth(), d: lunar.getDay() },
        zodiac: lunar.getYearShengXiao()
      };
    }

    function tojeong(a, year) {
      const age = year - a.solar.getYear() + 1; // 한국식 나이
      const yearGz = Lunar.fromYmd(year, 6, 15).getYearInGanZhi();
      const { y: ly, m: lm, d: ld } = a.lunarInfo;
      const baseMonth = Math.abs(lm);
      // 생월 큰달(30)/작은달(29)
      let dim = 29;
      try { dim = lib.LunarMonth.fromYm(ly, lm).getDayCount(); } catch (e) { dim = 30; }
      let monthGz, dayGz;
      try { monthGz = Lunar.fromYmd(year, baseMonth, 15).getMonthInGanZhi(); } catch (e) { monthGz = Lunar.fromYmd(year, 1, 15).getMonthInGanZhi(); }
      try { dayGz = Lunar.fromYmd(year, baseMonth, ld).getDayInGanZhi(); } catch (e) { dayGz = Lunar.fromYmd(year, baseMonth, Math.min(ld, 29)).getDayInGanZhi(); }

      const up = wrap(age + gzNumber(yearGz), 8);
      const mid = wrap(dim + gzNumber(monthGz), 6);
      const low = wrap(ld + gzNumber(dayGz), 3);
      const gwae = up * 100 + mid * 10 + low;

      const ysGan = ganIdx(yearGz[0]);
      const yearSs = sipseong(a.dm, ysGan);

      // 월별 운세
      const months = [];
      for (let m = 1; m <= 12; m++) {
        let gz;
        try { gz = Lunar.fromYmd(year, m, 15).getMonthInGanZhi(); } catch (e) { gz = monthGz; }
        const p = pillarOf(gz);
        const mss = sipseong(a.dm, p.g);
        let score = 50;
        [p.gEl, p.zEl].forEach((e) => {
          if (e === a.yong) score += 14;
          else if (mod(e - a.yong, 5) === 4) score += 6; // 용신을 생하는 오행
          if (e === a.gisin) score -= 10;
        });
        const g = groupOf(mss);
        const helpful = g === 0 || g === 4;
        score += a.strong ? (helpful ? -6 : 4) : (helpful ? 6 : -4);
        score += mod(gwae * (m + 3), 13) - 6;
        score = Math.round(clamp(score, 15, 95));
        const tier = score >= 70 ? 3 : score >= 55 ? 2 : score >= 40 ? 1 : 0;
        months.push({ month: m, gz, gKo: p.gKo, zKo: p.zKo, gEl: p.gEl, zEl: p.zEl, ss: mss, score, tier });
      }
      const avg = Math.round(months.reduce((s, x) => s + x.score, 0) / 12);

      // 분야별 점수
      const g = a.grp;
      const yg = groupOf(yearSs);
      const bump = (grpIdx) => (yg === grpIdx ? 8 : 0);
      const bal = a.count.reduce((s, c) => s + Math.abs(c - 1.6), 0);
      const male = a.input.gender === 'M';
      const love = male ? g[2] : g[3];
      const fields = [
        { key: '재물', score: clamp(Math.round(48 + g[2] * 7 + bump(2) + (avg - 50) * 0.4), 20, 95) },
        { key: '직업', score: clamp(Math.round(48 + g[3] * 5 + g[1] * 4 + bump(3) + bump(1) + (avg - 50) * 0.4), 20, 95) },
        { key: '건강', score: clamp(Math.round(88 - bal * 5 + (a.count[a.yong] > 0 ? 4 : 0)), 25, 95) },
        { key: '애정', score: clamp(Math.round(46 + love * 8 + bump(male ? 2 : 3) + (avg - 50) * 0.3), 20, 95) }
      ];

      const sortedMonths = months.slice().sort((x, y) => y.score - x.score);
      return {
        year, age, yearGz, monthGz, dayGz, up, mid, low, gwae, dim, yearSs,
        months, avg, fields,
        good: sortedMonths.slice(0, 3).map((x) => x.month).sort((x, y) => x - y),
        bad: sortedMonths.slice(-3).map((x) => x.month).sort((x, y) => x - y),
        lucky: LUCKY[a.yong]
      };
    }

    return { analyze, tojeong, toSolar };
  }

  const api = {
    create, GAN, ZHI, GAN_KO, ZHI_KO, EL, EL_HANJA, GAN_EL, ZHI_EL, SIPSEONG, GROUP, LUCKY, mod, sipseong, groupOf
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TJ = api;
})(typeof window !== 'undefined' ? window : globalThis);
