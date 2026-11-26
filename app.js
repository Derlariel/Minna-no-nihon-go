const paths={home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',book:'M12 6v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2z',headphones:'M4 14v-3a8 8 0 0 1 16 0v3M4 13H2v7h4v-7zm16 0h2v7h-4v-7z',star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z',chart:'M4 20V10m8 10V4m8 16v-7',arrow:'M5 12h14m-5-5 5 5-5 5',back:'M19 12H5m5-5-5 5 5 5',sound:'m11 4-6 5H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',check:'m5 12 4 4L19 6',clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',leaf:'M4 20C0 8 9 2 21 3c1 12-7 20-17 17zm0 0L16 8',menu:'M4 6h16M4 12h16M4 18h16',settings:'M4 7h16M4 17h16M8 4v6m8 4v6',pen:'m4 16 12-12 4 4L8 20H4zm10-10 4 4',kana:'M4 5h16M12 3v7c0 6-3 10-7 11m2-10c4-3 12-2 12 4 0 3-3 6-6 6'};
const icon=(n)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n]||paths.book}"/></svg>`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={saved:[],scores:{},visited:[],last:1,rate:.85,romaji:true,voice:''};
try{const s=JSON.parse(localStorage.getItem('kotoba-v1'));if(s&&typeof s==='object'){state={...state,...s};if(!Array.isArray(state.saved))state.saved=[];if(!Array.isArray(state.visited))state.visited=[];if(!state.scores||typeof state.scores!=='object')state.scores={};state.last=Math.min(12,Math.max(1,Number(state.last)||1));state.rate=Math.min(1.2,Math.max(.5,Number(state.rate)||.85));}}catch{}
function persist(){try{localStorage.setItem('kotoba-v1',JSON.stringify(state))}catch{toast('เบราว์เซอร์นี้ไม่อนุญาตให้บันทึก ความคืบหน้าจะอยู่เฉพาะครั้งนี้')}}
let toastTimer, quiz = null, voices = [], filter = 'all';
function toast(s){const e=document.getElementById('toast');e.textContent=s;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),4200)}
const app=document.getElementById('app');
const completed=()=>lessons.filter(l=>(Number(state.scores[l.id])||0)>=80).length;
const audio=(jp,label='ฟังเสียง',accessibleName=`${label} ${jp}`)=>`<button class="audio-button" data-speak="${esc(jp)}" aria-label="${esc(accessibleName)}">${icon('sound')}<span>${label}</span></button>`;
function nav() {
  const current = location.hash || '#home';
  const links = [
    ['home', 'home', 'หน้าติวสอบ'], ['lessons', 'book', 'สารบัญบทเรียน'],
    ['exam', 'pen', 'จำลองสอบ'], ['reference', 'clock', 'ตารางช่วยจำ'],
    ['kanji', 'kana', 'สรุปคันจิ'], ['kana', 'book', 'ฮิรางานะ / คาตากานะ'],
    ['saved', 'star', 'คำศัพท์ที่บันทึก'], ['progress', 'chart', 'ความก้าวหน้า']
  ];
  document.getElementById('main-nav').innerHTML = links.map(([id, symbol, label]) => {
    const active = current === `#${id}` || (id === 'reference' && current.startsWith('#reference-'));
    return `<a class="nav-link ${active ? 'active' : ''}" ${active ? 'aria-current="page"' : ''} href="#${id}">${icon(symbol)}${label}</a>`;
  }).join('');
  document.getElementById('lesson-nav').innerHTML = examLessons.map(lesson => {
    const active = current.startsWith(`#lesson-${lesson.id}-`);
    return `<a class="nav-link ${active ? 'active' : ''}" ${active ? 'aria-current="location"' : ''} href="#lesson-${lesson.id}-vocab">
      <span class="chapter-number">${String(lesson.id).padStart(2, '0')}</span><span>${lesson.title}</span>
    </a>`;
  }).join('');
  document.body.classList.toggle('no-romaji', !state.romaji);
}
function card(l){const done=(state.scores[l.id]||0)>=80,started=state.visited.includes(l.id);return `<a class="lesson-card" href="#lesson-${l.id}-vocab"><span class="num">${String(l.id).padStart(2,'0')}</span><span class="status">${done?'✓ เรียนสำเร็จ':started?'กำลังเรียน':'พร้อมเริ่มเรียน'}</span><h3>${l.title}</h3><div class="jp" lang="ja">${l.jp}</div><p>${l.desc}</p><div class="card-footer"><span>${l.vocab.length} คำศัพท์ · ${l.grammar.length} ไวยากรณ์</span>${icon('arrow')}</div></a>`}
function stats(){return `<div class="stats"><div class="stat"><span class="stat-icon">${icon('book')}</span><div><div class="stat-value">${completed()} <small>/ 12 บท</small></div><div class="stat-label">บทเรียนที่สำเร็จ</div></div></div><div class="stat"><span class="stat-icon">${icon('star')}</span><div><div class="stat-value">${state.saved.length} <small>คำ</small></div><div class="stat-label">คำศัพท์ที่บันทึกไว้</div></div></div><div class="stat"><span class="stat-icon">${icon('chart')}</span><div><div class="stat-value">${Math.round(completed()/12*100)}<small> %</small></div><div class="stat-label">ความก้าวหน้าของคุณ</div></div></div></div>`}
function allLessons() {
  const matches = lesson => filter === 'all' || (filter === 'done'
    ? (state.scores[lesson.id] || 0) >= 80
    : state.visited.includes(lesson.id) && (state.scores[lesson.id] || 0) < 80);
  return `<header class="study-heading"><h1>สารบัญบทเรียน</h1><p>บทที่ 1–6 สำหรับทบทวนก่อนสอบ</p></header>
    <div class="section-head"><h2>บทที่ 1–6</h2><div class="filter-row">${[['all', 'ทั้งหมด'], ['started', 'กำลังเรียน'], ['done', 'เรียนสำเร็จ']].map(([value, label]) =>
      `<button class="filter ${filter === value ? 'active' : ''}" aria-pressed="${filter === value}" data-filter="${value}">${label}</button>`).join('')}</div></div>
    <div class="lesson-grid focus-grid">${examLessons.filter(matches).map(card).join('') || '<p class="empty">ยังไม่มีบทเรียนในหมวดนี้</p>'}</div>
    <details class="source-panel"><summary>บทที่ 7–12 จากเว็บเดิม</summary><div class="lesson-grid">${lessons.slice(6).map(card).join('')}</div></details>`;
}
function wordCard(word, lessonId, index) {
  const key = `${lessonId}-${index}`;
  const saved = state.saved.includes(key);
  const reading = hiragana(word.kana);
  return `<article class="word-card"><h3 lang="ja">${ruby(word.jp, reading)}</h3>
    ${reading !== word.jp ? `<div class="kana" lang="ja">${esc(reading)}</div>` : ''}
    <div class="romaji">${esc(word.romaji)}</div><p>${esc(word.thai)}</p>
    <div class="word-actions">${audio(word.kana)}
      <button class="icon-button save-word ${saved ? 'saved' : ''}" data-save="${key}" aria-label="บันทึกคำศัพท์ ${esc(word.jp)}" aria-pressed="${saved}">${icon('star')}</button>
    </div></article>`;
}

function romajiToggle() {
  return `<label class="check"><input class="romaji-toggle" type="checkbox" ${state.romaji ? 'checked' : ''}> แสดง romaji</label>`;
}

function vocabularyCards(lesson, query = '') {
  return lesson.vocab.map((word, index) => {
    const searchable = [...Object.values(word), hiragana(word.kana)].join(' ').toLowerCase();
    return searchable.includes(query) ? wordCard(word, lesson.id, index) : '';
  }).join('') || '<p class="empty">ไม่พบคำศัพท์ ลองค้นด้วยคานะ ภาษาไทย หรือ romaji</p>';
}

function grammarExample(item) {
  return `<div class="example"><div>
    <div class="jp" lang="ja">${esc(item.jp)}</div>
    ${item.kana ? `<div class="kana" lang="ja">${esc(item.kana)}</div>` : ''}
    <div class="romaji">${esc(item.romaji)}</div><div class="translation">${esc(item.thai)}</div>
  </div>${audio(item.jp)}</div>`;
}

function lessonPage(lesson, tab, group) {
  const { id } = lesson;
  const focused = id <= examLessons.length;
  state.last = id;
  if (!state.visited.includes(id)) state.visited.push(id);
  persist();

  const tabs = [['vocab', 'คำศัพท์'], ['summary', 'คันจิและสรุป'], ['grammar', 'ไวยากรณ์'], ['practice', 'แบบฝึกหัด'], ['listen', 'ฝึกฟัง']];
  let body = '<div class="quiz-container" id="quiz-area"></div>';
  if (tab === 'summary') body = lessonSummary(lesson);
  if (tab === 'vocab') {
    body = `<div class="toolbar">
      <label class="word-search-label" for="word-search"><span>ค้นหาคำศัพท์ในบท</span>
        <input type="search" class="search" id="word-search" placeholder="ญี่ปุ่น ไทย หรือ romaji">
      </label>${romajiToggle()}
    </div><div class="vocab-grid" id="word-grid">${vocabularyCards(lesson)}</div>`;
  }
  if (tab === 'grammar') {
    body = `<div class="toolbar">${romajiToggle()}</div>${lesson.grammar.map(item => `<article class="grammar-card">
      <h2 class="pattern-heading">${esc(item.pattern)}</h2><p>${esc(item.explain)}</p>${grammarExample(item)}</article>`).join('')}
      <a class="primary" href="#lesson-${id}-practice">ลองทำแบบฝึกหัด ${icon('arrow')}</a>`;
  }
  if (focused && tab === 'practice') body = practicePage(lesson, group);
  const next = id === examLessons.length ? '#exam' : id < lessons.length ? `#lesson-${id + 1}-vocab` : '#progress';
  const nextLabel = id === examLessons.length ? 'ไปจำลองสอบ' : id < lessons.length ? 'บทถัดไป' : 'ดูความก้าวหน้า';
  return `<header class="study-heading lesson-heading">
    <p class="study-kicker">บทที่ ${id} · มินนะ โนะ นิฮงโกะ 1</p><h1>${lesson.title}</h1>
    <div class="jp lesson-jp" lang="ja">${lesson.jp}</div><div class="romaji">${lesson.romaji}</div><p>${lesson.desc}</p>
  </header><nav class="tabs" aria-label="ส่วนของบทเรียน">${tabs.map(([key, label]) => {
    const active = key === tab || (key === 'practice' && tab === 'quiz');
    return `<a class="tab ${active ? 'active' : ''}" ${active ? 'aria-current="page"' : ''} href="#lesson-${id}-${key}">${label}</a>`;
  }).join('')}</nav>${body}${focused ? chapterSources(lesson) : ''}
  <div class="unit-nav">${id > 1 ? `<a class="secondary" href="#lesson-${id - 1}-vocab">${icon('back')} บทก่อนหน้า</a>` : '<span></span>'}
    <a class="secondary" href="${next}">${nextLabel} ${icon('arrow')}</a></div>`;
}

function shuffle(values) {
  const items = [...values];
  for (let i = items.length - 1; i > 0; i--) {
    const other = Math.floor(Math.random() * (i + 1));
    [items[i], items[other]] = [items[other], items[i]];
  }
  return items;
}
function makeQuiz(l,mode){const words=l.vocab.map(w=>{const choices=shuffle([w,...shuffle(l.vocab.filter(x=>x!==w)).slice(0,2)]);return {q:mode==='listen'?'ฟังเสียง แล้วเลือกความหมายที่ถูกต้อง':w.jp,choices:choices.map(v=>v.thai),answer:choices.indexOf(w),speak:w.kana,explain:`${w.jp} (${w.romaji}) หมายถึง ${w.thai}`}});if(mode==='practice'){l.grammar.forEach(g=>{const choices=shuffle([g,...shuffle(l.grammar.filter(x=>x!==g)).slice(0,2)]);words.push({q:g.jp,choices:choices.map(x=>x.thai),answer:choices.indexOf(g),speak:g.jp,explain:g.explain})});const g=grammarQuiz[l.id-1];words.push({q:g[0],choices:g[1],answer:g[2],explain:g[3]})}return {lid:l.id,mode,items:shuffle(words),index:0,correct:0,selected:null,wrong:[],finished:false}}
function showQuiz(){const area=document.getElementById('quiz-area');if(!area||!quiz)return;if(quiz.finished){const pct=Math.round(quiz.correct/quiz.items.length*100);area.innerHTML=`<div class="quiz-card result"><span class="eyebrow">${quiz.mode==='listen'?'LISTENING':'LESSON'} COMPLETE</span><div class="score">${pct}<span style="font-size:25px">%</span></div><h2>${pct>=80?'ทำได้ดีมาก ไปต่อกันเลย':'อีกนิดเดียว ลองทบทวนกันอีกครั้ง'}</h2><p class="muted">ตอบถูก ${quiz.correct} จาก ${quiz.items.length} ข้อ</p><p class="small muted">${quiz.mode==='practice'?'คะแนนสูงสุดบันทึกอัตโนมัติ · ได้ 80% ขึ้นไปถือว่าเรียนสำเร็จ':'ผลฝึกฟังไม่เปลี่ยนคะแนนแบบฝึกหัดหลัก'}</p>${quiz.wrong.length?`<div class="tip" style="text-align:left">ทบทวนข้อที่ตอบผิด${quiz.wrong.map(x=>`<p><b>${esc(x.q)}</b><br>${esc(x.explain)}</p>`).join('')}</div>`:''}<button class="primary" id="retry-quiz">ฝึกอีกครั้ง ${icon('arrow')}</button> <a class="secondary" href="#lesson-${quiz.lid}-summary">ทบทวนสรุปบทเรียน</a></div>`;return}const q=quiz.items[quiz.index];area.innerHTML=`<div class="section-head"><span class="small muted">${quiz.mode==='listen'?'ฝึกฟัง · เลือกคำแปล':'ทบทวนคำศัพท์และไวยากรณ์'}</span><span class="small muted">ข้อ ${quiz.index+1} / ${quiz.items.length}</span></div><div class="progress-track"><span style="width:${quiz.index/quiz.items.length*100}%"></span></div><div class="quiz-card" style="margin-top:20px"><span class="eyebrow">${quiz.mode==='listen'?'LISTEN & CHOOSE':'CHOOSE THE CORRECT ANSWER'}</span><div class="question" lang="${quiz.mode==='listen'?'th':'ja'}">${q.q}</div>${q.speak?audio(q.speak,quiz.mode==='listen'?'ฟังคำศัพท์':'ฟังประโยค','ฟังโจทย์'):''}<p class="small muted">${quiz.mode==='listen'?'กดฟังเสียงก่อน แล้วเลือกความหมาย':'เลือกคำตอบที่ถูกต้องเพียงข้อเดียว'}</p><div class="quiz-options">${q.choices.map((c,i)=>`<button class="quiz-option ${quiz.selected!==null?(i===q.answer?'correct':i===quiz.selected?'wrong':''):''}" data-answer="${i}" ${quiz.selected!==null?'disabled':''}>${esc(c)}</button>`).join('')}</div>${quiz.selected!==null?`<div class="feedback ${quiz.selected===q.answer?'':'incorrect'}" role="status"><b>${quiz.selected===q.answer?'ถูกต้องค่ะ':'คำตอบที่ถูก: '+esc(q.choices[q.answer])}</b><br>${esc(q.explain)}</div><div class="quiz-controls"><span class="small muted">ถูก ${quiz.correct} ข้อ</span><button class="primary" id="next-question">${quiz.index+1===quiz.items.length?'ดูผลการฝึก':'ข้อถัดไป'} ${icon('arrow')}</button></div>`:''}</div>`}
function saved(){return `<div class="welcome"><div><span class="eyebrow">YOUR WORD COLLECTION</span><h1>คำศัพท์ที่บันทึก</h1><p>เก็บคำที่อยากจำ แล้วกลับมาฟังและทบทวนได้เสมอ</p></div></div><div class="toolbar"><input class="search" id="saved-search" placeholder="ค้นหาในคำที่บันทึก" aria-label="ค้นหาในคำที่บันทึก">${romajiToggle()}</div><div class="vocab-grid" id="saved-grid">${savedCards('')}</div>`}
function savedCards(query){const list=state.saved.map(k=>{const [l,i]=k.split('-').map(Number);return {l:lessons[l-1],i}}).filter(x=>x.l?.vocab[x.i]);const filtered=list.filter(x=>[...Object.values(x.l.vocab[x.i]), hiragana(x.l.vocab[x.i].kana)].join(' ').toLowerCase().includes(query.toLowerCase()));return filtered.map(x=>wordCard(x.l.vocab[x.i],x.l.id,x.i)).join('')||`<div class="empty">${query?'ไม่พบคำที่ค้นหา':'ยังไม่มีคำที่บันทึก กดรูปดาวที่คำศัพท์ในบทเรียนเพื่อเก็บไว้ที่นี่'}<br><a class="text-link" href="#lessons">ไปเลือกบทเรียน ${icon('arrow')}</a></div>`}
function progress(){return `<div class="welcome"><div><span class="eyebrow">EVERY LITTLE STEP COUNTS</span><h1>ความก้าวหน้าของฉัน</h1><p>ผ่านแบบฝึกหัด 80% ขึ้นไป เพื่อให้บทเรียนสำเร็จ</p></div></div>${stats()}<table class="progress-table"><thead><tr><th>บทเรียน</th><th>สถานะ</th><th>คะแนนสูงสุด</th><th></th></tr></thead><tbody>${lessons.map(l=>`<tr><td>${String(l.id).padStart(2,'0')} · ${l.title}</td><td>${(state.scores[l.id]||0)>=80?'✓ สำเร็จ':state.visited.includes(l.id)?'กำลังเรียน':'ยังไม่เริ่ม'}</td><td>${state.scores[l.id]!==undefined?state.scores[l.id]+'%':'—'}</td><td><a href="#lesson-${l.id}-practice">ฝึกทำ ${icon('arrow')}</a></td></tr>`).join('')}</tbody></table><p class="tip">ข้อมูลเก็บในเบราว์เซอร์เครื่องนี้ การล้างข้อมูลเว็บไซต์จะลบความคืบหน้าและคำที่บันทึก</p>`}
const kanaRows=[['あいうえお','アイウエオ',['a','i','u','e','o']],['かきくけこ','カキクケコ',['ka','ki','ku','ke','ko']],['さしすせそ','サシスセソ',['sa','shi','su','se','so']],['たちつてと','タチツテト',['ta','chi','tsu','te','to']],['なにぬねの','ナニヌネノ',['na','ni','nu','ne','no']],['はひふへほ','ハヒフヘホ',['ha','hi','fu','he','ho']],['まみむめも','マミムメモ',['ma','mi','mu','me','mo']],['や ゆ よ','ヤ ユ ヨ',['ya','','yu','','yo']],['らりるれろ','ラリルレロ',['ra','ri','ru','re','ro']],['わ   を','ワ   ヲ',['wa','','','','o (wo)']],['ん    ','ン    ',['n','','','','']]];
let kanaType=0;
function kanaPage(){return `<div class="welcome"><div><span class="eyebrow">BEFORE YOUR FIRST LESSON</span><h1>เริ่มจากตัวอักษรญี่ปุ่น</h1><p>แตะตัวอักษรเพื่อฟังเสียง แล้วลองออกเสียงตาม</p></div></div><div class="tabs"><button class="tab ${kanaType===0?'active':''}" data-kana="0">ฮิรางานะ · ひらがな</button><button class="tab ${kanaType===1?'active':''}" data-kana="1">คาตากานะ · カタカナ</button></div><div class="kana-grid">${kanaRows.map(r=>[...r[kanaType]].map((c,i)=>c===' '?'<span></span>':`<button class="kana-cell" data-speak="${c}" aria-label="ฟังเสียง ${c} ${r[2][i]}"><span class="jp" lang="ja">${c}</span><span class="romaji">${r[2][i]}</span></button>`).join('')).join('')}</div><div class="grammar-card kana-note"><h3>จุดเล็ก ๆ ที่เปลี่ยนความหมาย</h3><p>เสียงยาวต้องออกเสียงให้ครบ เช่น おばさん (obasan — ป้า) กับ おばあさん (obāsan — คุณยาย) ต่างกันที่เสียงยาว ตัว っ เล็กใช้หยุดเสียงหนึ่งจังหวะ เช่น きって (kitte — แสตมป์) ส่วน きゃ・きゅ・きょ ใช้ ゃ・ゅ・ょ ขนาดเล็กและอ่านควบเป็น kya・kyu・kyo</p><div class="example"><div><div class="jp" lang="ja">が・ざ・だ・ば・ぱ</div><div class="romaji">ga · za · da · ba · pa</div><div class="translation">เติม ゛ หรือ ゜ เพื่อเปลี่ยนเสียงพยัญชนะ</div></div>${audio('が、ざ、だ、ば、ぱ')}</div><p>หมายเหตุ: ตารางนี้เป็นตัวอักษรพื้นฐาน 46 ตัว ฝึกเสียงขุ่น เสียงกึ่งขุ่น และเสียงควบเพิ่มเติมควบคู่กับหนังสือ ส่วน は・へ・を เมื่อเป็นคำช่วย อ่าน wa・e・o</p></div>`}
function render() {
  const route = (location.hash || '#home').slice(1);
  const match = route.match(/^lesson-(\d+)-(vocab|grammar|practice|quiz|listen|summary)(?:-(A|B|C|end))?$/u);
  const lesson = match ? lessons[Number(match[1]) - 1] : null;
  let title = 'หน้าติวสอบ';
  quiz = null;
  if (lesson) {
    const [, , tab, group] = match;
    app.innerHTML = lessonPage(lesson, tab, group);
    title = `บทที่ ${lesson.id} · ${lesson.title}`;
    if (tab === 'listen' || tab === 'quiz' || (tab === 'practice' && lesson.id > examLessons.length)) {
      quiz = makeQuiz(lesson, tab === 'listen' ? 'listen' : 'practice');
      showQuiz();
    }
  } else if (route === 'reference' || route.startsWith('reference-')) {
    app.innerHTML = referencePage(route.slice('reference-'.length));
    title = 'ตารางช่วยจำ';
  } else {
    const pages = {
      home: [focusHome, title], lessons: [allLessons, 'สารบัญบทเรียน'],
      exam: [examPage, 'จำลองสอบ'], saved: [saved, 'คำศัพท์ที่บันทึก'],
      progress: [progress, 'ความก้าวหน้า'], kana: [kanaPage, 'พื้นฐานตัวอักษร'],
      kanji: [kanjiPage, 'สรุปคันจิทุกบท']
    };
    const page = Object.hasOwn(pages, route) ? pages[route] : pages.home;
    app.innerHTML = page[0]();
    title = page[1];
  }
  document.getElementById('breadcrumb').textContent = title;
  document.title = `${title} — Kotoba`;
  nav();
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('menu').setAttribute('aria-expanded', 'false');
  window.scrollTo(0, 0);
}
function loadVoices(){if(!('speechSynthesis' in window))return;voices=window.speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('ja'));const select=document.getElementById('voice');select.replaceChildren();if(!voices.length){select.add(new Option('ไม่พบเสียงญี่ปุ่น — ตรวจสอบการตั้งค่าอุปกรณ์',''));return}voices.forEach(v=>select.add(new Option(v.name,v.voiceURI)));select.value=voices.some(v=>v.voiceURI===state.voice)?state.voice:voices[0].voiceURI}
function speak(text,button){if(!('speechSynthesis'in window)){toast('เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง');return}if(!voices.length)loadVoices();if(!voices.length){toast('ยังไม่มีเสียงภาษาญี่ปุ่น กรุณาเพิ่มเสียงญี่ปุ่นในการตั้งค่าอุปกรณ์');openSettings();return}window.speechSynthesis.cancel();document.querySelectorAll('.audio-active').forEach(x=>x.classList.remove('audio-active'));const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.voice=voices.find(v=>v.voiceURI===state.voice)||voices[0];u.rate=state.rate;button?.classList.add('audio-active');u.onend=()=>button?.classList.remove('audio-active');u.onerror=e=>{button?.classList.remove('audio-active');if(e.error!=='canceled'&&e.error!=='interrupted')toast('เปิดเสียงไม่สำเร็จ ลองเลือกเสียงอื่นในการตั้งค่า')};window.speechSynthesis.speak(u)}
function openSettings(){loadVoices();document.getElementById('rate').value=state.rate;document.getElementById('rate-label').textContent=state.rate.toFixed(2)+'×';document.getElementById('romaji-setting').checked=state.romaji;document.getElementById('settings').showModal()}
document.getElementById('skip-link').onclick = event => {
  event.preventDefault();
  app.focus();
};
document.getElementById('menu').innerHTML=icon('menu');document.getElementById('menu').setAttribute('aria-expanded','false');document.getElementById('sound-settings').innerHTML=icon('settings');document.getElementById('sound-settings').onclick=openSettings;document.getElementById('menu').onclick=()=>{const open=document.querySelector('.sidebar').classList.toggle('open');document.getElementById('menu').setAttribute('aria-expanded',String(open))};document.getElementById('about').onclick=()=>document.getElementById('about-dialog').showModal();document.getElementById('rate').oninput=e=>{state.rate=Number(e.target.value);document.getElementById('rate-label').textContent=state.rate.toFixed(2)+'×';persist()};document.getElementById('voice').onchange=e=>{state.voice=e.target.value;persist()};function toggleRomaji(value){state.romaji=value;document.body.classList.toggle('no-romaji',!value);document.querySelectorAll('.romaji-toggle').forEach(x=>x.checked=value);persist()}document.getElementById('romaji-setting').onchange=e=>toggleRomaji(e.target.checked);
document.addEventListener('click',e=>{const speakBtn=e.target.closest('[data-speak]');if(speakBtn){speak(speakBtn.dataset.speak,speakBtn);return}const settings=e.target.closest('[data-settings]');if(settings){openSettings();return}const save=e.target.closest('[data-save]');if(save){const key=save.dataset.save;const i=state.saved.indexOf(key);i<0?state.saved.push(key):state.saved.splice(i,1);persist();nav();save.classList.toggle('saved',i<0);save.setAttribute('aria-pressed',String(i<0));toast(i<0?'เก็บคำศัพท์ไว้ทบทวนแล้ว':'นำคำศัพท์ออกจากรายการแล้ว');if(location.hash==='#saved')document.getElementById('saved-grid').innerHTML=savedCards(document.getElementById('saved-search').value);return}const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;render();return}const kana=e.target.closest('[data-kana]');if(kana){kanaType=Number(kana.dataset.kana);render();return}const answer=e.target.closest('[data-answer]');if(answer&&quiz&&quiz.selected===null){quiz.selected=Number(answer.dataset.answer);const q=quiz.items[quiz.index];if(quiz.selected===q.answer)quiz.correct++;else quiz.wrong.push(q);showQuiz();return}if(e.target.closest('#next-question')&&quiz){quiz.index++;quiz.selected=null;if(quiz.index===quiz.items.length){quiz.finished=true;if(quiz.mode==='practice'){const pct=Math.round(quiz.correct/quiz.items.length*100);state.scores[quiz.lid]=Math.max(Number(state.scores[quiz.lid])||0,pct);persist();nav()}}showQuiz();return}if(e.target.closest('#retry-quiz')&&quiz){quiz=makeQuiz(lessons[quiz.lid-1],quiz.mode);showQuiz()}});
document.addEventListener('change',e=>{if(e.target.matches('.romaji-toggle'))toggleRomaji(e.target.checked)});
document.addEventListener('input', event => {
  if (event.target.id === 'word-search') {
    const query = event.target.value.trim().toLowerCase();
    document.getElementById('word-grid').innerHTML = vocabularyCards(lessons[state.last - 1], query);
  }
  if (event.target.id === 'saved-search') {
    document.getElementById('saved-grid').innerHTML = savedCards(event.target.value.trim());
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelector('.sidebar').classList.remove('open');document.getElementById('menu').setAttribute('aria-expanded','false')}});
window.addEventListener('hashchange',()=>{window.speechSynthesis?.cancel();render();app.focus({ preventScroll: true })});if('speechSynthesis'in window){window.speechSynthesis.onvoiceschanged=loadVoices;loadVoices()}render();
