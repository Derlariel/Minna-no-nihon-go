const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const elements = new Map();
const element = () => ({
  innerHTML: '', textContent: '', style: {},
  classList: { toggle() {}, remove() {}, add() {} },
  setAttribute() {}, focus() {}
});
const context = vm.createContext({
  localStorage: { getItem() { return null; }, setItem() {} },
  location: { hash: '#home' },
  document: {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    querySelector: element, querySelectorAll: () => [], addEventListener() {}, body: element()
  },
  window: { addEventListener() {}, scrollTo() {} },
  setTimeout, clearTimeout
});

const scripts = ['data.js', 'exam-data.js', 'summary-data.js', 'summary.js', 'exam.js', 'app.js'];
for (const file of scripts) vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
const run = code => vm.runInContext(code, context);
function navigate(hash) {
  context.location.hash = hash;
  run('render()');
  const html = elements.get('app').innerHTML;
  assert.ok(!html.includes('undefined'), hash);
  return html;
}

assert.equal(run('lessonTakeaways.length'), 12);
assert.equal(run('allKanji.every(c => kanjiInfo[c]?.meaning && kanjiInfo[c]?.readings)'), true);
assert.ok(run('lessonKanji(lessons[2]).includes("値")'));
assert.ok(run('lessonKanji(lessons[10]).includes("台")'));
assert.ok(run('lessonKanji(lessons[8]).includes("漢")'));
assert.ok(run('kanjiInfo["日"].readings.includes("にち")'));
assert.ok(run('kanjiNote().includes("一人（ひとり）")'));
assert.ok(run('kanjiCards(["人"], lessons[10]).includes("ふたり")'));

for (let id = 1; id <= 12; id++) {
  const html = navigate(`#lesson-${id}-summary`);
  assert.ok(html.includes(`สรุปบทที่ ${id}`));
  assert.equal((html.match(/class="kanji-character"/g) || []).length, run(`lessonKanji(lessons[${id - 1}]).length`));
  assert.ok(html.includes(`href="#lesson-${id}-practice"`));
  assert.ok(navigate(`#lesson-${id}-vocab`).includes('word-grid'));
  assert.ok(navigate(`#lesson-${id}-grammar`).includes('pattern-heading'));
  assert.ok(navigate(`#lesson-${id}-listen`).includes('quiz-area'));
  if (id <= 6) {
    for (const group of ['A', 'B', 'C', 'end']) {
      const practice = navigate(`#lesson-${id}-practice-${group}`);
      assert.equal((practice.match(/class="written-question"/g) || []).length, 3);
      assert.ok(practice.includes(`หน้า ${run(`pageRange(bookSections[${id - 1}].${group})`)}`));
      assert.ok(!practice.includes('model-answer'));
    }
    assert.ok(navigate(`#lesson-${id}-quiz`).includes('quiz-area'));
  } else {
    assert.ok(navigate(`#lesson-${id}-practice`).includes('quiz-area'));
  }
}

assert.ok(navigate('#home').includes('ติวญี่ปุ่น'));
assert.equal((navigate('#kanji').match(/class="kanji-character"/g) || []).length,
  run('new Set(examLessons.flatMap(lessonKanji)).size'));
assert.equal(elements.get('breadcrumb').textContent, 'สรุปคันจิทุกบท');
assert.ok(!elements.get('lesson-nav').innerHTML.includes('#lesson-7-'));
assert.ok(navigate('#lesson-6-vocab').includes('<ruby>食<rp>（</rp><rt>た</rt>'));
assert.ok(run('vocabularyCards(lessons[2], "えれべーたー").includes("エレベーター")'));

assert.equal(run('readNumber(83600)'), 'はちまんさんぜんろっぴゃく');
assert.equal(run('minuteReading(48)'), 'よんじゅうはっぷん');
assert.equal(run('dateReading(17)'), 'じゅうしちにち');
assert.equal(run('dateReading(24)'), 'にじゅうよっか');
assert.equal(run('dateReading(29)'), 'にじゅうくにち');
assert.equal(run('referenceTables.length'), 9);
assert.ok(navigate('#reference-verbs').includes('ませんでした'));
assert.ok(navigate('#reference-age').includes('はたち'));

assert.ok(navigate('#exam').includes('เริ่มทำข้อสอบ 33 ข้อ'));
run('mockRun = makeMockRun()');
assert.equal(run('mockRun.groups.length'), 7);
assert.equal(run('mockRun.values.length'), 33);
assert.equal(run('mockRun.groups.find(group => group.id === "reading").items.filter(q => q.choices).length'), 2);
assert.ok(!navigate('#exam').includes('model-answer'));
assert.equal(run('correctAnswer(written("", ["はっぷん"], ""), " はっぷん。 ")'), true);
assert.equal(run('correctAnswer(written("", ["はっぷん"], ""), "はちふん")'), false);
run('mockRun.values[0] = mockRun.groups[0].items[0].model; mockRun.submitted = true');
assert.ok(navigate('#exam').includes('1 / 27'));
assert.equal((navigate('#exam').match(/class="model-answer"/g) || []).length, 33);

const html = fs.readFileSync('index.html', 'utf8');
assert.deepEqual([...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]), scripts);
console.log('PASS: lesson and practice routes, readings, references, furigana, mock exam, scoring, and legacy lessons.');
