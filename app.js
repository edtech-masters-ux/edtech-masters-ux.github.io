(function () {
  'use strict';
  var C = window.COURSE;
  var app = document.getElementById('app');
  var KEY = 'ux-course-progress-v1';
  var INTERACTIVE = { 'knowledgeCheck': 1, 'interactive': 1, 'survey': 1 };
  var T = {
    start: 'ابدئي الدورة', resume: 'تابعي التعلم', lesson: 'الوحدة', of: 'من', complete: 'مكتمل',
    submit: 'إرسال', correct: 'إجابة صحيحة', incorrect: 'إجابة خاطئة', retake: 'أعيدي المحاولة',
    require: 'أجيبي عن السؤال للمتابعة', next: 'التالي', tryAgain: 'حاولي مرة أخرى', startOver: 'ابدئي من جديد',
    scnDone: 'انتهى النشاط', flip: 'اضغطي لقلب البطاقة', replay: 'إعادة', thanks: 'شكراً لمشاركتك',
    nextLesson: 'الوحدة التالية', home: 'العودة إلى الصفحة الرئيسية', lessonDone: 'أكملتِ هذه الوحدة',
    courseDone: 'أحسنتِ! أكملتِ جميع وحدات الدورة', menu: 'القائمة', matchTip: 'اسحبي البطاقات لترتيبها أمام ما يناسبها، أو اضغطي بطاقتين لتبديل مكانيهما.',
    sortTip: 'اسحبي البطاقة إلى الفئة المناسبة، أو اضغطي الفئة لوضعها فيها.', locked: 'أكملي الوحدة السابقة أولا'
  };
  var ICON = {
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  var TEAM = ['نورة القباع', 'لولوة الدخيل', 'ابتهاج الدايل', 'أمل الخمعلي'];
  var TEAM_ROLE = 'طالبات ماجستير تصميم التعليم والتكنولوجيا';
  var NUM = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];

  /* ---------- progress store ---------- */
  var S = load();
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    if (!s || !s.lessons) s = { lessons: {} };
    C.lessons.forEach(function (L) { if (!s.lessons[L.id]) s.lessons[L.id] = { passed: 0, done: {}, complete: false }; });
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
  function LS(i) { return S.lessons[C.lessons[i].id]; }
  function dividers(i) { return C.lessons[i].blocks.filter(function (b) { return b.kind === 'divider:continue'; }).length; }
  function lessonProgress(i) {
    var st = LS(i); if (st.complete) return 1;
    var n = dividers(i); return n ? Math.min(st.passed / (n + 1), 0.99) : 0;
  }
  function unlocked(i) { return i === 0 || LS(i - 1).complete; }
  function coursePct() {
    var t = 0; C.lessons.forEach(function (_, i) { t += lessonProgress(i); });
    return Math.round(t / C.lessons.length * 100);
  }
  function anyProgress() { return C.lessons.some(function (_, i) { var s = LS(i); return s.passed > 0 || s.complete; }); }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function plain(h) { var d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/[⁦-⁩]/g, '').trim(); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function lessonTitle(i) { return plain(C.lessons[i].title); }

  /* ---------- routing ---------- */
  function route() {
    var m = location.hash.match(/^#\/lessons\/(\d+)/);
    if (m) {
      var i = +m[1] - 1;
      if (i >= 0 && i < C.lessons.length && unlocked(i)) return renderLesson(i);
      location.replace('#/');
      return;
    }
    renderCover();
  }
  window.addEventListener('hashchange', route);
  function go(i) { location.hash = '#/lessons/' + (i + 1); }
  function firstOpen() { for (var i = 0; i < C.lessons.length; i++) if (!LS(i).complete) return i; return 0; }

  /* ---------- cover ---------- */
  function renderCover() {
    document.title = plain(C.title);
    var started = anyProgress();
    var h = '<div class="cover">' +
      '<div class="cover-hero">' +
      '<div class="cover-panel"><div class="kicker">' + C.lessons.length + ' وحدات تعلم</div><h1>' + esc(plain(C.title)) + '</h1>' +
      '<button class="pill" id="startBtn">' + (started ? T.resume : T.start) + '</button>' +
      '<div class="cover-team"><div><b>إعداد:</b> ' + TEAM.join(' · ') + '</div><div>' + TEAM_ROLE + '</div></div></div>' +
      '<div class="cover-img" role="img" aria-label="صورة غلاف الدورة" style="background-image:url(\'' + C.cover + '\')"></div>' +
      '</div><div class="cover-body"><div class="cover-desc">' + C.description + '</div><ol class="cover-list">';
    C.lessons.forEach(function (L, i) {
      var ok = unlocked(i);
      h += '<li><button data-i="' + i + '"' + (ok ? '' : ' aria-disabled="true" title="' + T.locked + '"') + '>' + ring(i) +
        '<span class="num">' + T.lesson + ' ' + (i + 1) + '</span><span class="ttl">' + esc(lessonTitle(i)) + '</span>' + (ok ? '' : '<span style="width:1.8rem;display:inline-block">' + ICON.lock + '</span>') + '</button></li>';
    });
    h += '</ol></div></div>';
    app.innerHTML = h;
    window.scrollTo(0, 0);
    document.getElementById('startBtn').onclick = function () { go(started ? firstOpen() : 0); };
    app.querySelectorAll('.cover-list button').forEach(function (b) {
      b.onclick = function () { var i = +b.dataset.i; if (unlocked(i)) go(i); };
    });
  }

  function ring(i) {
    var p = lessonProgress(i), r = 8, c = 2 * Math.PI * r;
    if (p >= 1) return '<svg class="ring" viewBox="0 0 20 20" aria-label="' + T.complete + '"><circle class="ok" cx="10" cy="10" r="10"/><path d="M5.5 10.3l3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<svg class="ring" viewBox="0 0 20 20" aria-hidden="true"><circle class="bg" cx="10" cy="10" r="' + r + '"/><circle class="fg" cx="10" cy="10" r="' + r + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - p)) + '" transform="rotate(-90 10 10)"/></svg>';
  }

  /* ---------- lesson shell ---------- */
  var cur = -1;
  function renderLesson(i) {
    cur = i;
    var L = C.lessons[i];
    document.title = lessonTitle(i) + ' | ' + plain(C.title);
    var closed = false;
    try { closed = sessionStorage.getItem('ux-side-closed') === '1'; } catch (e) { }
    app.innerHTML =
      '<div class="shell' + (closed ? ' side-closed' : '') + '">' +
      '<aside class="side" aria-label="محتويات الدورة"><div class="side-head"><button class="side-home" id="homeBtn">' + esc(plain(C.title)) + '</button>' +
      '<div class="side-prog"><span id="pct"></span></div><div class="side-bar"><span id="pctBar"></span></div></div><ol class="side-list" id="sideList"></ol><div class="side-team"><b>إعداد:</b> ' + TEAM.join('، ') + '<br>' + TEAM_ROLE + '</div></aside>' +
      '<div class="scrim" id="scrim"></div>' +
      '<main class="main"><div class="topbar"><button class="icon-btn" id="menuBtn" aria-label="' + T.menu + '">' + ICON.menu + '</button>' +
      '<div class="tb-title">' + T.lesson + ' ' + (i + 1) + ' ' + T.of + ' ' + C.lessons.length + '</div></div>' +
      '<header class="lesson-head"><div class="in"><div class="count">' + T.lesson + ' ' + (i + 1) + ' ' + T.of + ' ' + C.lessons.length + '</div><h1>' + esc(lessonTitle(i)) + '</h1><div class="bar"></div></div></header>' +
      '<div class="blocks" id="blocks"></div><div id="foot"></div></main></div>';
    var shell = app.querySelector('.shell');
    document.getElementById('menuBtn').onclick = function () {
      if (window.innerWidth <= 900) shell.classList.toggle('side-open');
      else {
        shell.classList.toggle('side-closed');
        try { sessionStorage.setItem('ux-side-closed', shell.classList.contains('side-closed') ? '1' : '0'); } catch (e) { }
      }
    };
    document.getElementById('scrim').onclick = function () { shell.classList.remove('side-open'); };
    document.getElementById('homeBtn').onclick = function () { location.hash = '#/'; };
    renderSide();
    var st = LS(i);
    var secs = sections(i);
    var host = document.getElementById('blocks');
    var upto = st.complete ? secs.length - 1 : Math.min(st.passed, secs.length - 1);
    for (var k = 0; k <= upto; k++) host.appendChild(renderSection(i, secs, k, false));
    if (st.complete || upto === secs.length - 1) finishLesson(i, false);
    window.scrollTo(0, 0);
  }

  function renderSide() {
    var list = document.getElementById('sideList'); if (!list) return;
    list.innerHTML = '';
    C.lessons.forEach(function (L, i) {
      var ok = unlocked(i);
      var li = el('<li class="' + (i === cur ? 'active' : '') + '"><button' + (ok ? '' : ' aria-disabled="true" title="' + T.locked + '"') + (i === cur ? ' aria-current="page"' : '') + '>' + ring(i) + '<span>' + esc(lessonTitle(i)) + '</span></button></li>');
      li.firstChild.onclick = function () { if (unlocked(i)) { app.querySelector('.shell').classList.remove('side-open'); if (i === cur) window.scrollTo({ top: 0, behavior: 'smooth' }); else go(i); } };
      list.appendChild(li);
    });
    var p = coursePct();
    document.getElementById('pct').textContent = T.complete + ' ' + p + '%';
    document.getElementById('pctBar').style.width = p + '%';
  }

  function sections(i) {
    var out = [[]];
    C.lessons[i].blocks.forEach(function (b) {
      out[out.length - 1].push(b);
      if (b.kind === 'divider:continue') out.push([]);
    });
    if (!out[out.length - 1].length) out.pop();
    return out;
  }

  function renderSection(i, secs, k, animate) {
    var wrap = el('<div class="section' + (animate ? ' section-new' : '') + '" data-sec="' + k + '"></div>');
    var st = LS(i);
    secs[k].forEach(function (b) {
      if (b.kind === 'divider:continue') {
        if (k < st.passed || st.complete) return;
        wrap.appendChild(renderContinue(i, secs, k, b));
      } else {
        var node = renderBlock(i, b);
        node.setAttribute('data-bid', b.id);
        wrap.appendChild(node);
      }
    });
    return wrap;
  }

  /* ---------- completion / gating ---------- */
  function isInteractive(b) { return INTERACTIVE[b.kind.split(':')[0]] === 1; }
  function markDone(i, b) {
    var st = LS(i);
    if (!st.done[b.id]) { st.done[b.id] = true; save(); }
    refreshGates();
  }
  function gateOpen(i, secs, k, d) {
    var st = LS(i), blocks = secs[k].filter(function (b) { return b !== d; });
    if (d.gate === 'completeBlock') {
      for (var j = blocks.length - 1; j >= 0; j--) if (isInteractive(blocks[j])) return !!st.done[blocks[j].id];
      return true;
    }
    if (d.gate === 'completeAll') return blocks.filter(isInteractive).every(function (b) { return st.done[b.id]; });
    return true;
  }
  var gates = [];
  function refreshGates() {
    gates = gates.filter(function (g) { return document.body.contains(g.node); });
    gates.forEach(function (g) { g.update(); });
  }
  function renderContinue(i, secs, k, d) {
    var node = el('<section class="blk cont"><div class="in"><button class="cont-btn"><span>' + d.title + '</span>' + ICON.down + '</button>' +
      '<div class="cont-hint" hidden><span style="width:1.6rem;display:inline-flex">' + ICON.lock + '</span><span>' + d.hint + '</span></div></div></section>');
    var btn = node.querySelector('.cont-btn'), hint = node.querySelector('.cont-hint');
    var g = { node: node, update: function () {
      var open = gateOpen(i, secs, k, d);
      btn.setAttribute('aria-disabled', open ? 'false' : 'true');
      hint.hidden = open;
    } };
    gates.push(g); g.update();
    btn.onclick = function () {
      if (!gateOpen(i, secs, k, d)) {
        hint.classList.remove('pulse'); void hint.offsetWidth; hint.classList.add('pulse');
        return;
      }
      var st = LS(i);
      st.passed = Math.max(st.passed, k + 1); save();
      var next = renderSection(i, secs, k + 1, true);
      node.parentNode.replaceChild(document.createComment('continued'), node);
      document.getElementById('blocks').appendChild(next);
      if (k + 1 === secs.length - 1) finishLesson(i, true);
      renderSide();
      var top = next.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top: top, behavior: 'smooth' });
    };
    return node;
  }

  function finishLesson(i, fresh) {
    var st = LS(i);
    if (!st.complete) { st.complete = true; save(); }
    renderSide();
    var foot = document.getElementById('foot');
    var h = '<footer class="lesson-foot' + (fresh ? ' section-new' : '') + '"><div class="in">';
    if (i < C.lessons.length - 1) {
      h += '<div class="done">✓ ' + T.lessonDone + '</div><button class="next-btn" id="nextBtn"><small>' + T.nextLesson + ' · ' + T.lesson + ' ' + (i + 2) + '</small><span>' + esc(lessonTitle(i + 1)) + '</span></button>';
    } else {
      h += '<div class="done">✓ ' + T.courseDone + '</div><button class="next-btn" id="nextBtn"><span>' + T.home + '</span></button>';
    }
    foot.innerHTML = h + '</div></footer>';
    document.getElementById('nextBtn').onclick = function () { if (i < C.lessons.length - 1) go(i + 1); else location.hash = '#/'; };
  }

  /* ---------- blocks ---------- */
  function renderBlock(i, b) {
    var k = b.kind;
    var done = function () { markDone(i, b); };
    switch (k) {
      case 'image:hero':
        return el('<section class="blk hero"><figure><img src="' + b.src + '" alt="" loading="lazy">' + (plain(b.caption) ? '<figcaption>' + b.caption + '</figcaption>' : '') + '</figure></section>');
      case 'text:heading':
        return el('<section class="blk heading"><div class="in"><h2>' + b.heading + '</h2></div></section>');
      case 'text:paragraph':
        return el('<section class="blk"><div class="in">' + b.paragraph + '</div></section>');
      case 'text:heading paragraph':
        return el('<section class="blk"><div class="in"><h2>' + b.heading + '</h2>' + b.paragraph + '</div></section>');
      case 'text:note':
        var dark = b.bg && b.bg.toLowerCase() !== '#ffffff';
        return el('<section class="blk"><div class="in"><div class="note-box' + (dark ? ' dark' : '') + '"><div class="ic" aria-hidden="true">i</div><div class="tx">' + b.paragraph + '</div></div></div></section>');
      case 'list:numbered':
        return el('<section class="blk"><div class="in"><ol class="list-num">' + b.items.map(function (x) { return '<li><div>' + x + '</div></li>'; }).join('') + '</ol></div></section>');
      case 'multimedia:video':
        return el('<section class="blk"><div class="in"><div class="video-wrap"><video controls preload="metadata" playsinline poster="' + b.poster + '"><source src="' + b.src + '" type="video/mp4">' +
          b.captions.map(function (c, n) { return '<track kind="subtitles" srclang="' + c.lang + '" label="' + c.label + '" src="' + c.src + '"' + (n === 0 ? ' default' : '') + '>'; }).join('') + '</video></div></div></section>');
      case 'interactive:accordion': return accordion(b, done);
      case 'interactive:flashcard': return flashcards(b, done);
      case 'knowledgeCheck:multiple choice':
      case 'knowledgeCheck:multiple response': return choiceCheck(b, done);
      case 'knowledgeCheck:matching': return matching(b, done);
      case 'survey:survey': return survey(b, done);
      case 'interactive:scenario': return scenario(b, done);
      case 'interactive:sorting': return sorting(b, done);
    }
    return el('<section class="blk"></section>');
  }

  function accordion(b, done) {
    var node = el('<section class="blk"><div class="in"><div class="acc"></div></div></section>');
    var acc = node.querySelector('.acc'), seen = {};
    b.items.forEach(function (it, n) {
      var id = b.id + '-p' + n;
      var item = el('<div class="acc-item"><button class="acc-btn" aria-expanded="false" aria-controls="' + id + '"><span class="t">' + it.title + '</span><span class="acc-ico" aria-hidden="true"></span></button><div class="acc-panel" id="' + id + '" role="region">' + it.body + '</div></div>');
      item.querySelector('.acc-btn').onclick = function () {
        var open = item.classList.toggle('open');
        this.setAttribute('aria-expanded', open);
        if (open) { seen[n] = 1; if (Object.keys(seen).length === b.items.length) done(); }
      };
      acc.appendChild(item);
    });
    return node;
  }

  function flashcards(b, done) {
    var node = el('<section class="blk"><div class="in"><div class="fc-grid"></div></div></section>');
    var grid = node.querySelector('.fc-grid'), seen = {};
    b.items.forEach(function (it, n) {
      var card = el('<button class="fc" aria-pressed="false"><div class="fc-inner"><div class="fc-face fc-front"><div>' + it.front + '</div><div class="fc-hint">' + T.flip + '</div></div><div class="fc-face fc-back"><div>' + it.back + '</div></div></div></button>');
      card.onclick = function () {
        var f = card.classList.toggle('flipped');
        card.setAttribute('aria-pressed', f);
        if (f) { seen[n] = 1; if (Object.keys(seen).length === b.items.length) done(); }
      };
      grid.appendChild(card);
    });
    return node;
  }

  function feedbackHtml(kind, label, body) {
    var icon = kind === 'ok' ? '✓' : kind === 'no' ? '✕' : '✓';
    return '<div class="fb-icon' + (kind === 'no' ? ' no' : '') + '" aria-hidden="true">' + icon + '</div>' +
      (label ? '<div class="fb-label">' + label + '</div>' : '') + '<div class="fb-body">' + body + '</div>';
  }

  function choiceCheck(b, done) {
    var multi = b.qtype === 'MULTIPLE_RESPONSE';
    var choiceFb = b.feedbackType === 'CHOICE';
    var node = el('<section class="blk kc-band"><div class="in"><div class="kc-card"><div class="kc-q">' + b.title + '</div>' +
      '<div class="kc-opts" role="' + (multi ? 'group' : 'radiogroup') + '"></div>' +
      '<div class="kc-actions"><button class="btn" disabled>' + T.submit + '</button></div><div class="need">' + T.require + '</div>' +
      '<div class="kc-fb" hidden></div></div></div></section>');
    var card = node.querySelector('.kc-card'), opts = node.querySelector('.kc-opts'), sub = node.querySelector('.btn'), fb = node.querySelector('.kc-fb'), need = node.querySelector('.need');
    var sel = {}, locked = false;
    var buttons = b.answers.map(function (a, n) {
      var o = el('<button class="kc-opt' + (multi ? ' multi' : '') + '" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="false"><span class="mk" aria-hidden="true"></span><span class="tx">' + a.title + '</span><span class="res" aria-hidden="true"></span></button>');
      o.onclick = function () {
        if (locked) return;
        if (multi) sel[n] = !sel[n];
        else { sel = {}; sel[n] = true; }
        paint();
      };
      opts.appendChild(o);
      return o;
    });
    function paint() {
      buttons.forEach(function (o, n) { o.setAttribute('aria-checked', sel[n] ? 'true' : 'false'); });
      var any = Object.keys(sel).some(function (k) { return sel[k]; });
      sub.disabled = !any; need.hidden = any;
    }
    sub.onclick = function () {
      if (locked) return;
      locked = true; card.classList.add('locked');
      var ok = b.answers.every(function (a, n) { return !!sel[n] === a.correct; });
      buttons.forEach(function (o, n) {
        o.setAttribute('aria-disabled', 'true');
        var r = o.querySelector('.res');
        if (!sel[n]) return;
        if (choiceFb) { r.textContent = '✓'; r.className = 'res ok'; }
        else if (b.answers[n].correct) { r.textContent = '✓'; r.className = 'res ok'; }
        else { r.textContent = '✕'; r.className = 'res no'; }
      });
      if (choiceFb) {
        var picked = b.answers.filter(function (a, n) { return sel[n]; })[0];
        fb.innerHTML = feedbackHtml('neutral', '', (picked && picked.feedback) || b.fbAny);
      } else {
        fb.innerHTML = feedbackHtml(ok ? 'ok' : 'no', ok ? T.correct : T.incorrect, ok ? b.fbCorrect : b.fbIncorrect);
      }
      var again = el('<button class="btn ghost">' + T.retake + '</button>');
      again.onclick = function () {
        locked = false; sel = {}; card.classList.remove('locked'); fb.hidden = true; fb.innerHTML = '';
        sub.parentNode.hidden = false;
        buttons.forEach(function (o) { o.removeAttribute('aria-disabled'); var r = o.querySelector('.res'); r.textContent = ''; r.className = 'res'; });
        paint(); buttons[0].focus();
      };
      fb.appendChild(again);
      fb.hidden = false; sub.parentNode.hidden = true; need.hidden = true;
      done();
    };
    paint();
    return node;
  }

  /* drag helper: pointer-based so it works with mouse and touch */
  function dragify(src, opts) {
    src.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || opts.disabled()) return;
      var sx = e.clientX, sy = e.clientY, ghost = null, over = null, rect = src.getBoundingClientRect();
      var offX = sx - rect.left, offY = sy - rect.top;
      function move(ev) {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        if (!ghost) {
          ghost = src.cloneNode(true);
          ghost.classList.add('drag-ghost'); ghost.style.width = rect.width + 'px'; ghost.style.height = rect.height + 'px';
          document.body.appendChild(ghost); src.style.opacity = '.35';
        }
        ghost.style.left = (ev.clientX - offX) + 'px'; ghost.style.top = (ev.clientY - offY) + 'px';
        var under = document.elementFromPoint(ev.clientX, ev.clientY);
        var tgt = under && opts.target(under);
        if (over && over !== tgt) over.classList.remove('over');
        over = tgt; if (over) over.classList.add('over');
        ev.preventDefault();
      }
      function up(ev) {
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
        if (!ghost) { opts.click(); return; }
        ghost.remove(); src.style.opacity = '';
        if (over) { over.classList.remove('over'); opts.drop(over); }
      }
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
    });
  }

  function matching(b, done) {
    var node = el('<section class="blk kc-band"><div class="in"><div class="kc-card"><div class="kc-q">' + b.title + '</div>' +
      '<div class="mt-rows"></div><div class="mt-tip">' + T.matchTip + '</div>' +
      '<div class="kc-actions"><button class="btn">' + T.submit + '</button></div><div class="kc-fb" hidden></div></div></div></section>');
    var card = node.querySelector('.kc-card'), rows = node.querySelector('.mt-rows'), sub = node.querySelector('.btn'), fb = node.querySelector('.kc-fb'), tip = node.querySelector('.mt-tip');
    var order, locked = false, picked = null, pieces = [];
    function deal() {
      var idx = b.answers.map(function (_, n) { return n; });
      do { order = shuffle(idx); } while (idx.length > 1 && order.every(function (v, n) { return v === n; }));
      draw();
    }
    function draw() {
      rows.innerHTML = ''; pieces = [];
      b.answers.forEach(function (a, n) {
        var row = el('<div class="mt-row"><div class="mt-prompt">' + a.title + '</div><div class="mt-slot" data-row="' + n + '"></div></div>');
        var pc = el('<div class="mt-piece" tabindex="0" role="button" data-row="' + n + '"><span class="tx">' + b.answers[order[n]].match + '</span><span class="res" aria-hidden="true"></span></div>');
        row.querySelector('.mt-slot').appendChild(pc);
        pieces.push(pc);
        dragify(pc, {
          disabled: function () { return locked; },
          target: function (u) { var t = u.closest('.mt-piece'); return t && t !== pc && rows.contains(t) ? t : null; },
          drop: function (t) { swap(n, +t.dataset.row); },
          click: function () { pick(n); }
        });
        pc.addEventListener('keydown', function (e) {
          if (locked) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(n); }
          if (e.key === 'ArrowDown' && pieces[n + 1]) { e.preventDefault(); pieces[n + 1].focus(); }
          if (e.key === 'ArrowUp' && pieces[n - 1]) { e.preventDefault(); pieces[n - 1].focus(); }
        });
        rows.appendChild(row);
      });
    }
    function pick(n) {
      if (picked === null) { picked = n; pieces[n].classList.add('sel'); return; }
      if (picked === n) { pieces[n].classList.remove('sel'); picked = null; return; }
      var a = picked; picked = null; swap(a, n, true);
    }
    function swap(a, c, refocus) {
      var t = order[a]; order[a] = order[c]; order[c] = t; picked = null; draw();
      if (refocus) pieces[c].focus();
    }
    sub.onclick = function () {
      if (locked) return;
      locked = true; card.classList.add('locked'); picked = null;
      var ok = true;
      pieces.forEach(function (pc, n) {
        pc.classList.remove('sel'); pc.removeAttribute('tabindex');
        var good = order[n] === n || plain(b.answers[order[n]].match) === plain(b.answers[n].match);
        if (!good) ok = false;
        pc.classList.add(good ? 'ok' : 'no'); pc.querySelector('.res').textContent = good ? '✓' : '✕';
      });
      fb.innerHTML = feedbackHtml(ok ? 'ok' : 'no', ok ? T.correct : T.incorrect, ok ? b.fbCorrect : b.fbIncorrect);
      var again = el('<button class="btn ghost">' + T.retake + '</button>');
      again.onclick = function () { locked = false; card.classList.remove('locked'); fb.hidden = true; sub.parentNode.hidden = false; tip.hidden = false; deal(); };
      fb.appendChild(again);
      fb.hidden = false; sub.parentNode.hidden = true; tip.hidden = true;
      done();
    };
    deal();
    return node;
  }

  function survey(b, done) {
    var node = el('<section class="blk kc-band"><div class="in"><div class="kc-card sv"><div class="kc-q">' + b.question + '</div>' +
      '<textarea maxlength="' + b.maxLength + '" aria-label="إجابتك"></textarea><div class="cnt">0/' + b.maxLength + '</div>' +
      '<div class="kc-actions"><button class="btn" disabled>' + T.submit + '</button></div></div></div></section>');
    var ta = node.querySelector('textarea'), cnt = node.querySelector('.cnt'), sub = node.querySelector('.btn');
    ta.oninput = function () { cnt.textContent = ta.value.length + '/' + b.maxLength; sub.disabled = !ta.value.trim(); };
    sub.onclick = function () {
      var mine = el('<div class="mine"></div>'); mine.textContent = ta.value;
      ta.replaceWith(mine); cnt.remove(); sub.parentNode.replaceWith(el('<div class="done">' + T.thanks + '</div>'));
      done();
    };
    return node;
  }

  function scenario(b, done) {
    var node = el('<section class="blk scn" style="padding:0;background-image:url(\'' + b.bg + '\')"><div class="in"></div></section>');
    var stage = node.querySelector('.in');
    var byId = {}; b.slides.forEach(function (s, n) { byId[s.id] = n; });
    function nextIndex(n, goTo, target) {
      if (goTo === 'slide' && target && byId[target.slide] !== undefined) return byId[target.slide];
      return n + 1;
    }
    function show(n) {
      var s = b.slides[n];
      if (!s) return;
      stage.innerHTML = '';
      if (s.type === 'text') {
        var end = s.goTo === 'end' || n === b.slides.length - 1;
        var c = el('<div class="scn-card center">' + (end ? '<div class="scn-done">' + T.scnDone + '</div>' : '') + (plain(s.title) ? '<h3>' + s.title + '</h3>' : '') + '<div>' + s.text + '</div>' +
          '<div class="kc-actions"><button class="btn">' + (end ? T.startOver : T.next) + '</button></div></div>');
        c.querySelector('.btn').onclick = function () { show(end ? 0 : nextIndex(n, s.goTo)); focusStage(); };
        stage.appendChild(c);
        if (end) done();
        return;
      }
      stage.appendChild(el('<div class="scn-bubble">' + s.text + '</div>'));
      var list = el('<div class="scn-resp"></div>');
      s.responses.forEach(function (r, m) {
        var o = el('<button class="scn-opt" style="animation-delay:' + (m * 0.08) + 's"><span class="n">' + (m + 1) + '</span><span class="tx">' + r.text + '</span></button>');
        o.onclick = function () { answer(n, r); };
        list.appendChild(o);
      });
      stage.appendChild(list);
    }
    function answer(n, r) {
      var s = b.slides[n];
      stage.innerHTML = '';
      stage.appendChild(el('<div class="scn-bubble">' + s.text + '</div>'));
      stage.appendChild(el('<div class="scn-chosen">' + r.text + '</div>'));
      var retry = r.action === 'tryAgain';
      var f = el('<div class="scn-fb"><div>' + r.feedback + '</div><div class="act"><button class="btn">' + (retry ? T.tryAgain : T.next) + '</button></div></div>');
      f.querySelector('.btn').onclick = function () { show(retry ? n : nextIndex(n, r.goTo, r.next)); focusStage(); };
      stage.appendChild(f);
      f.querySelector('.btn').focus({ preventScroll: true });
    }
    function focusStage() {
      var r = node.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.4) window.scrollTo({ top: r.top + window.scrollY - 60, behavior: 'smooth' });
    }
    show(0);
    return node;
  }

  function sorting(b, done) {
    var node = el('<section class="blk srt" style="background:' + (b.bgColor || '#f5f5f5') + '"><div class="in"><div class="srt-stack"></div><div class="srt-tip">' + T.sortTip + '</div><div class="srt-piles"></div><div class="srt-res" hidden></div></div></section>');
    var stack = node.querySelector('.srt-stack'), pilesEl = node.querySelector('.srt-piles'), res = node.querySelector('.srt-res'), tip = node.querySelector('.srt-tip');
    var queue, missed, counts, selected = false;
    var piles = b.piles.map(function (p) {
      var pe = el('<button class="pile" data-pile="' + p.id + '"><span class="pt">' + p.title + '</span><span class="pc">0</span></button>');
      pe.onclick = function () { if (queue.length) place(p.id, pe); };
      pilesEl.appendChild(pe);
      return pe;
    });
    function reset() {
      queue = shuffle(b.cards); missed = {}; counts = {};
      b.piles.forEach(function (p) { counts[p.id] = 0; });
      res.hidden = true; pilesEl.hidden = false; stack.hidden = false; tip.hidden = false;
      paint();
    }
    function paint() {
      piles.forEach(function (pe) { pe.querySelector('.pc').textContent = counts[pe.dataset.pile]; });
      stack.innerHTML = '';
      selected = false;
      if (!queue.length) return finish();
      var depth = Math.min(queue.length, 3);
      for (var d = depth - 1; d >= 0; d--) {
        var top = d === 0;
        var c = el('<div class="srt-card' + (top ? '' : ' under under' + d) + '"' + (top ? ' tabindex="0" role="button"' : ' aria-hidden="true"') + '>' + (top ? queue[0].title : '') + '</div>');
        if (top) {
          dragify(c, {
            disabled: function () { return false; },
            target: function (u) { var t = u.closest('.pile'); return t && pilesEl.contains(t) ? t : null; },
            drop: function (t) { place(+t.dataset.pile, t); },
            click: function () { selected = !selected; c.classList.toggle('sel', selected); }
          });
          c.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); piles[0].focus(); }
          });
        }
        stack.appendChild(c);
      }
    }
    function place(pid, pe) {
      var card = queue[0];
      var good = String(card.pile) === String(pid);
      pe.classList.add(good ? 'flash-ok' : 'flash-no');
      setTimeout(function () { pe.classList.remove('flash-ok', 'flash-no'); }, 550);
      if (good) {
        queue.shift(); counts[pid]++;
        paint();
      } else {
        missed[card.id] = true;
        var topCard = stack.lastChild;
        if (topCard) { topCard.classList.remove('shake'); void topCard.offsetWidth; topCard.classList.add('shake'); }
        setTimeout(function () { queue.push(queue.shift()); paint(); }, 450);
      }
    }
    function finish() {
      var total = b.cards.length, right = total - Object.keys(missed).length;
      stack.hidden = true; tip.hidden = true;
      res.innerHTML = '<div class="big">' + right + ' ' + T.of + ' ' + total + ' بطاقات صحيحة</div><button class="btn">' + T.replay + '</button>';
      res.querySelector('.btn').onclick = reset;
      res.hidden = false;
      done();
    }
    reset();
    return node;
  }

  route();
})();
