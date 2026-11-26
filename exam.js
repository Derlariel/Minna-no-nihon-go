const practiceRuns = new Map();
let mockRun;
let localBookUrl = '';

function hiragana(text) {
  return text.replace(/[\u30a1-\u30f6]/g, char => String.fromCharCode(char.charCodeAt(0) - 96));
}

function ruby(jp, reading) {
  if (!reading || !/\p{Script=Han}/u.test(jp)) return esc(jp);
  const kana = hiragana(reading);
  const prefix = jp.match(/^\p{Script=Hiragana}+/u)?.[0] || '';
  const suffix = jp.match(/\p{Script=Hiragana}+$/u)?.[0] || '';
  if (!kana.startsWith(prefix) || !kana.endsWith(suffix) || prefix.length + suffix.length >= kana.length) {
    return `<ruby>${esc(jp)}<rp>（</rp><rt>${esc(kana)}</rt><rp>）</rp></ruby>`;
  }
  const end = jp.length - suffix.length;
  return `${esc(prefix)}<ruby>${esc(jp.slice(prefix.length, end))}<rp>（</rp><rt>${esc(kana.slice(prefix.length, kana.length - suffix.length))}</rt><rp>）</rp></ruby>${esc(suffix)}`;
}

function pageRange(pages) {
  return pages.join('–');
}

function bookPageLink(pages, label) {
  const name = `${label} · หน้า ${pageRange(pages)}`;
  return localBookUrl
    ? `<a class="book-page-link" target="_blank" rel="noopener" href="${esc(localBookUrl)}#page=${pages[0]}">${name} ↗</a>`
    : `<span class="book-page-link">${name}</span>`;
}

function chapterSources(lesson) {
  const pages = bookSections[lesson.id - 1];
  return `<details class="source-panel">
    <summary>หน้าหนังสือและไฟล์ PDF ส่วนตัว</summary>
    <p>มินนะ โนะ นิฮงโกะ 1 ฉบับภาษาไทย 2nd Edition · บทที่ ${lesson.id} หน้า ${pages.start}–${pages.end.at(-1)} ของ Minna1(1).pdf เลือกไฟล์หนังสือในเครื่องเพื่อเปิดหน้าอ้างอิง ไฟล์อยู่ในเบราว์เซอร์จนปิดหรือโหลดเว็บใหม่</p>
    <label class="file-label">เลือก PDF หนังสือในเครื่อง <input type="file" id="local-book" accept=".pdf,application/pdf"></label>
    <p id="book-file-status" class="muted" role="status">${localBookUrl ? 'พร้อมเปิดหน้าอ้างอิงในแท็บใหม่' : 'เลือก Minna1(1).pdf หรือใช้เลขหน้าด้านล่างเปิดด้วยตัวเอง'}</p>
    <div class="book-links" id="book-links">${chapterPageLinks(lesson)}</div>
  </details>`;
}

function chapterPageLinks(lesson) {
  const pages = bookSections[lesson.id - 1];
  return [
    bookPageLink(pages.words, 'คำศัพท์'), bookPageLink(pages.grammar, 'ไวยากรณ์'),
    ...practiceTypes.map(([id, title]) => bookPageLink(pages[id], id === 'end' ? title : `ฝึก ${id}`)),
    ...(lesson.id === 3 ? [bookPageLink([88, 89], 'ทบทวนบท 1–3')] : [])
  ].join('');
}

function studyTable(caption, labels, data) {
  return `<div class="reference-scroll" role="region" aria-label="${esc(caption)}" tabindex="0">
    <table class="reference-table"><caption>${esc(caption)}</caption>
      <thead><tr>${labels.map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead>
      <tbody>${data.join('')}</tbody>
    </table>
  </div>`;
}

function referencePage(route) {
  const valid = referenceTables.some(([id]) => id === route) || route === 'verbs';
  const active = valid ? route : 'hours';
  const table = referenceTables.find(([id]) => id === active);
  const labels = [...referenceTables.map(([id, title]) => [id, title.split(' · ')[0]]), ['verbs', 'ผันกริยา']];
  return `<header class="study-heading"><p class="study-kicker">บทที่ 1–6</p><h1>ตารางช่วยจำ</h1><p>ทบทวนคำอ่านตัวเลขและกริยาสุภาพ 4 รูปก่อนทำข้อสอบ</p></header>
    <nav class="reference-nav" aria-label="เลือกตาราง">${labels.map(([id, name]) =>
      `<a class="secondary ${active === id ? 'is-current' : ''}" ${active === id ? 'aria-current="page"' : ''} href="#reference-${id}">${name}</a>`).join('')}</nav>
    ${table ? `<p class="study-tip">${table[2]}</p>${studyTable(table[1], ['ตัวเลข / คำ', 'ฮิรางานะ', 'ความหมาย'], table[3].map(([jp, kana, thai]) => `<tr><th scope="row" lang="ja">${jp}</th><td lang="ja">${kana}</td><td>${thai || '—'}</td></tr>`))}`
      : `<p class="study-tip">จำส่วนหน้าของกริยาไว้ เช่น 食べ จาก 食べます แล้วเปลี่ยนเฉพาะคำลงท้ายตามเวลาและการบอกเล่าหรือปฏิเสธ</p>
        ${studyTable('กริยาสุภาพ 4 รูป', ['ความหมาย', ...politeEndings.map(([, label]) => label)], verbExamples.map(([jp, kana, thai]) =>
          `<tr><th scope="row">${thai}</th>${politeEndings.map(([suffix]) => `<td lang="ja">${ruby(jp.slice(0, -2) + suffix, kana.slice(0, -2) + suffix)}</td>`).join('')}</tr>`))}`}
    <a class="primary" href="#exam">ไปจำลองสอบ ${icon('arrow')}</a>`;
}

function focusHome() {
  const lesson = examLessons.find(item => item.id === state.last) || examLessons[0];
  const started = state.visited.includes(lesson.id);
  return `<section class="study-hero">
    <div><p class="study-kicker">มินนะ โนะ นิฮงโกะ 1 · ฉบับภาษาไทย</p>
      <h1>ติวญี่ปุ่น<br> บทที่ 1–6</h1>
      <p>ทบทวนคำศัพท์ คันจิ และรูปประโยค แล้วลองทำข้อสอบตามแนวที่อาจารย์แจ้ง</p>
      <div class="study-actions"><a class="primary" href="#lesson-${lesson.id}-vocab">${started ? `เรียนต่อบทที่ ${lesson.id}` : 'เริ่มอ่านบทที่ 1'} ${icon('arrow')}</a>
        <a class="secondary" href="#exam">จำลองสอบ</a></div>
    </div>
    <aside class="study-sample" aria-label="ตัวอย่างคำศัพท์จากบทที่ 1">
      <span class="study-kicker">คำศัพท์บทที่ 1</span>
      <div class="sample-japanese" lang="ja">${ruby('学生', 'がくせい')}</div>
      <span class="romaji">gakusei</span>
      <p>นักเรียน / นักศึกษา</p>
    </aside>
  </section>
  <div class="study-shortcuts">
    <a href="#exam">${icon('pen')}<span><strong>จำลองสอบ</strong><small>ฝึกครบ 7 หมวดตามสไลด์หน้า 8</small></span>${icon('arrow')}</a>
    <a href="#reference">${icon('clock')}<span><strong>ตารางช่วยจำ</strong><small>ตัวเลข วันที่ เวลา และกริยา 4 รูป</small></span>${icon('arrow')}</a>
  </div>
  <section aria-labelledby="study-list-heading"><div class="section-head"><div><h2 id="study-list-heading">เลือกบทที่ต้องการทบทวน</h2><p>กดเข้าบทเพื่อดูคำศัพท์ คันจิ ไวยากรณ์ และแบบฝึก</p></div></div>
    <div class="lesson-grid focus-grid">${examLessons.map(card).join('')}</div></section>`;
}

function practicePage(lesson, group) {
  const [key, title, desc] = practiceTypes.find(([id]) => id === group) || practiceTypes[0];
  const bank = practiceBank[lesson.id - 1];
  const runId = `${lesson.id}-${key}`;
  if (!practiceRuns.has(runId)) practiceRuns.set(runId, makeWrittenRun([[key, title, bank[key]]]));
  const run = practiceRuns.get(runId);
  return `<div class="practice-main">
    <nav class="reference-nav" aria-label="เลือกชุดแบบฝึกหัด">
      ${practiceTypes.map(([id, label]) => `<a class="secondary ${id === key ? 'is-current' : ''}" ${id === key ? 'aria-current="page"' : ''} href="#lesson-${lesson.id}-practice-${id}">${id === 'end' ? label : `${id} · ${label}`}</a>`).join('')}
    </nav>
    <p>${desc} · โจทย์แต่งใหม่ตามแนวหน้า ${pageRange(bookSections[lesson.id - 1][key])} ของหนังสือ</p>
    ${writtenForm(run, 'ดูเฉลยชุดนี้', 'practice')}
    <a class="text-link" href="#lesson-${lesson.id}-quiz">ฝึกแบบเลือกตอบเพื่อเก็บคะแนนบทนี้ ${icon('arrow')}</a>
  </div>`;
}

const vocabPairs = [
  [['医者','いしゃ','แพทย์','หมอ'], ['大学','だいがく','มหาวิทยาลัย']],
  [['辞書','じしょ','พจนานุกรม'], ['傘','かさ','ร่ม']],
  [['教室','きょうしつ','ห้องเรียน'], ['受付','うけつけ','จุดต้อนรับ','เคาน์เตอร์ต้อนรับ','ประชาสัมพันธ์']],
  [['銀行','ぎんこう','ธนาคาร'], ['毎日','まいにち','ทุกวัน']],
  [['駅','えき','สถานี','สถานีรถไฟ'], ['誕生日','たんじょうび','วันเกิด']],
  [['水','みず','น้ำ','น้ำเปล่า'], ['野菜','やさい','ผัก']]
];

function makeMockRun() {
  const selectedWords = vocabPairs.map(pair => shuffle(pair)[0]);
  const wordQuestions = selectedWords.map(([jp, reading, thai, ...synonyms], index) =>
    index % 2 === 0
      ? written(`แปลเป็นไทย · ${jp}`, [thai, ...synonyms], `${jp}（${reading}） หมายถึง ${thai}`)
      : written(`แปลเป็นญี่ปุ่น · ${thai}`, [jp, reading], `เขียนเป็น ${jp} หรือ ${reading}`));
  const reading = shuffle(readingSets)[0];
  const questions = {
    kanji: examLessons.map(lesson => {
      const word = shuffle(lesson.vocab.filter(w => /^\p{Script=Han}+$/u.test(w.jp)))[0];
      return written(`เขียนคำอ่านของ ${word.jp}`, [word.kana], `${word.jp}（${word.kana}） แปลว่า ${word.thai}`);
    }),
    vocab: shuffle(wordQuestions),
    sentence: shuffle(examQuestions.sentence).slice(0, 2),
    reading: reading.items,
    fill: [...shuffle(examQuestions.fill.slice(0, 5)).slice(0, 2), ...shuffle(examQuestions.fill.slice(5)).slice(0, 2)],
    number: shuffle(numberQuestions),
    translation: shuffle(examQuestions.translation).slice(0, 2)
  };
  return makeWrittenRun(examCategories.map(([id, title]) => [id, title, questions[id], id === 'reading' ? reading.passage : '']));
}

function makeWrittenRun(groups) {
  let index = 0;
  return {
    groups: groups.map(([id, title, items, passage]) => ({
      id, title, passage, items: items.map(item => ({ ...item, index: index++ }))
    })),
    values: Array(index).fill(''),
    self: {},
    submitted: false
  };
}

function examPage() {
  return `<header class="study-heading"><p class="study-kicker">แนวสอบ · IMG_2341.pdf หน้า 8</p><h1>จำลองสอบบทที่ 1–6</h1><p>พิมพ์คำตอบเองทั้ง 7 หมวด แล้วเปิดเฉลยพร้อมกันท้ายชุด</p></header>
    ${mockRun ? `<nav class="reference-nav" aria-label="ข้ามไปหมวดข้อสอบ">${examCategories.map(([id, label]) => `<button type="button" class="secondary" data-jump="${id}">${label}</button>`).join('')}</nav>
      ${writtenForm(mockRun, 'ส่งคำตอบและดูเฉลย', 'exam')}`
      : `<section class="exam-intro">
        <div><h2>แนวข้อสอบ 7 หมวด</h2><ol>${examCategories.map(([, label]) => `<li>${label}</li>`).join('')}</ol></div>
        <div><h2>วิธีตรวจคำตอบ</h2><p>เว็บตรวจคำตอบสั้นตามคำตอบที่รองรับ ส่วนประโยคปลายเปิดให้เทียบกับแนวเฉลยและตรวจเอง</p>
          <p>ข้ออ่านคันจิและตัวเลขให้พิมพ์ฮิรางานะ ข้อแปลเป็นญี่ปุ่นใช้คันจิหรือคานะได้ตามโจทย์</p>
          <button class="primary" type="button" data-start-exam>เริ่มทำข้อสอบ 33 ข้อ ${icon('arrow')}</button></div>
      </section>`}`;
}

function normalizeAnswer(value) {
  return value.normalize('NFKC').toLowerCase().replace(/[\s、。!?？！，,.]/gu, '');
}

function correctAnswer(item, value) {
  const normalized = normalizeAnswer(value);
  return Boolean(normalized) && item.answers.some(answer => normalizeAnswer(answer) === normalized);
}

function writtenResults(run) {
  const items = run.groups.flatMap(group => group.items);
  const auto = items.filter(item => item.answers.length);
  const open = items.length - auto.length;
  const correct = auto.filter(item => correctAnswer(item, run.values[item.index])).length;
  const missing = items.filter(item => !run.values[item.index].trim()).length;
  const reviewed = Object.values(run.self);
  return `<div class="study-tip written-result" id="written-result" tabindex="-1">
    <h2>ผลการฝึก</h2>
    <p>คำตอบสั้นตรงกับเฉลย <strong>${correct} / ${auto.length}</strong> ข้อ · เว้นว่าง <strong>${missing}</strong> ข้อ</p>
    ${open ? `<p>ข้อเขียนที่ตรวจด้วยตัวเอง <strong>${reviewed.length} / ${open}</strong> ข้อ · ทำได้ <strong>${reviewed.filter(Boolean).length}</strong> ข้อ</p>` : ''}
  </div>`;
}

function questionMarkup(item, run) {
  const { index, prompt, choices, passage, listen, model, note, answers } = item;
  const value = run.values[index];
  const label = `<span class="q-index">${index + 1}.</span><span>${esc(prompt)}</span>`;
  return `<article class="written-question">
    ${passage ? `<p class="reading-passage jp" lang="ja">${esc(passage)}</p>` : ''}
    ${choices ? `<fieldset><legend>${label}</legend><div class="answer-options">${choices.map(choice =>
      `<label><input type="radio" name="answer-${index}" value="${esc(choice)}" data-index="${index}" ${value === choice ? 'checked' : ''} ${run.submitted ? 'disabled' : ''}> ${esc(choice)}</label>`).join('')}</div></fieldset>`
    : `<label for="answer-${index}" class="question-label">${label}</label>
      ${listen ? `<div class="listening-button">${audio(listen, 'ฟังโจทย์', 'ฟังโจทย์')}</div>` : ''}
      ${answers.length ? `<input class="answer-input" type="text" id="answer-${index}" data-index="${index}" value="${esc(value)}" autocomplete="off" spellcheck="false" ${run.submitted ? 'readonly' : ''}>`
        : `<textarea class="answer-input" id="answer-${index}" data-index="${index}" rows="2" spellcheck="false" ${run.submitted ? 'readonly' : ''}>${esc(value)}</textarea>`}`}
    ${run.submitted ? `<div class="answer-review">
      <strong>${answers.length ? (correctAnswer(item, value) ? 'ตรงกับเฉลย' : value.trim() ? 'ลองเทียบกับเฉลย' : 'ยังไม่ได้ตอบ') : 'แนวคำตอบ'}</strong>
      <p class="model-answer">${esc(model)}</p><p>${esc(note)}</p>
      ${!answers.length && value.trim() ? `<fieldset><legend>ตรวจคำตอบตัวเอง</legend><div class="answer-options">
        <label><input type="radio" name="review-${index}" data-self="${index}" value="correct" ${run.self[index] === true ? 'checked' : ''}> ทำได้</label>
        <label><input type="radio" name="review-${index}" data-self="${index}" value="review" ${run.self[index] === false ? 'checked' : ''}> ต้องทบทวน</label>
      </div></fieldset>` : ''}
    </div>` : ''}
  </article>`;
}

function writtenForm(run, submitLabel, kind) {
  const filled = run.values.filter(value => value.trim()).length;
  return `<div id="written-area">${run.submitted ? writtenResults(run) : ''}
    <form id="written-form" data-mode="${kind}">
      ${run.groups.map(group => `<section class="question-section" id="questions-${group.id}" aria-labelledby="questions-title-${group.id}">
        <h2 id="questions-title-${group.id}" tabindex="-1">${group.title}</h2>
        ${group.passage ? `<p class="reading-passage jp" lang="ja">${esc(group.passage)}</p>` : ''}
        ${group.items.map(item => questionMarkup(item, run)).join('')}
      </section>`).join('')}
      <div class="written-controls">${run.submitted
        ? `<button type="button" class="secondary" data-retry-written>${kind === 'exam' ? 'เริ่มชุดจำลองใหม่' : 'ลองทำชุดนี้อีกครั้ง'}</button>`
        : `<p id="written-count" aria-live="polite">ตอบแล้ว ${filled} / ${run.values.length} ข้อ</p><button class="primary" type="submit">${submitLabel} ${icon('arrow')}</button>`}
      </div>
    </form>
  </div>`;
}

function currentPracticeId() {
  const match = location.hash.match(/^#lesson-([1-6])-practice(?:-(A|B|C|end))?$/u);
  return match ? `${match[1]}-${match[2] || 'A'}` : '';
}

function activeWrittenRun() {
  return location.hash === '#exam' ? mockRun : practiceRuns.get(currentPracticeId());
}

function updateWrittenAnswer(event) {
  const input = event.target.closest('#written-form [data-index]');
  const run = activeWrittenRun();
  if (!input || !run || run.submitted) return;
  run.values[Number(input.dataset.index)] = input.value;
  document.getElementById('written-count').textContent = `ตอบแล้ว ${run.values.filter(value => value.trim()).length} / ${run.values.length} ข้อ`;
}

document.addEventListener('input', updateWrittenAnswer);
document.addEventListener('change', event => {
  if (event.target.id === 'local-book') {
    const file = event.target.files[0];
    if (!file) return;
    const feedback = document.getElementById('book-file-status');
    if (file.type !== 'application/pdf' && !/\.pdf$/iu.test(file.name)) {
      feedback.textContent = 'กรุณาเลือกไฟล์ PDF';
      return;
    }
    if (localBookUrl) URL.revokeObjectURL(localBookUrl);
    localBookUrl = URL.createObjectURL(file);
    feedback.textContent = `พร้อมเปิดหน้าอ้างอิงจาก ${file.name} ในแท็บใหม่`;
    document.getElementById('book-links').innerHTML = chapterPageLinks(lessons[state.last - 1]);
  }
  if (event.target.matches('[data-self]')) {
    const run = activeWrittenRun();
    run.self[Number(event.target.dataset.self)] = event.target.value === 'correct';
    document.getElementById('written-result').outerHTML = writtenResults(run);
  }
});

document.addEventListener('submit', event => {
  if (event.target.id !== 'written-form') return;
  event.preventDefault();
  const run = activeWrittenRun();
  if (!run || run.submitted) return;
  run.submitted = true;
  document.getElementById('written-area').outerHTML = writtenForm(run, '', event.target.dataset.mode);
  document.getElementById('written-result').focus();
});

document.addEventListener('click', event => {
  const start = event.target.closest('[data-start-exam]');
  const retry = event.target.closest('[data-retry-written]');
  if (start || retry) {
    if (location.hash === '#exam') mockRun = makeMockRun();
    else practiceRuns.delete(currentPracticeId());
    render();
    document.querySelector('.question-section h2')?.focus();
  }
  const jump = event.target.closest('[data-jump]');
  if (jump) document.getElementById(`questions-title-${jump.dataset.jump}`)?.focus();
});
