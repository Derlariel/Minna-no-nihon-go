const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const elements=new Map();
const element=()=>({innerHTML:'',textContent:'',style:{},classList:{toggle(){},remove(){},add(){}},setAttribute(){}});
const context=vm.createContext({
  localStorage:{getItem(){return null},setItem(){}},
  location:{hash:'#home'},
  document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},querySelector:element,querySelectorAll:()=>[],addEventListener(){},body:element()},
  window:{addEventListener(){},scrollTo(){}},setTimeout,clearTimeout
});
for(const file of ['data.js','summary-data.js','summary.js','app.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const run=code=>vm.runInContext(code,context);
assert.equal(run('lessonTakeaways.length'),12);
assert.equal(run('allKanji.length'),162);
assert.equal(run('allKanji.every(c=>kanjiInfo[c]?.meaning && kanjiInfo[c]?.readings)'),true);
assert.equal(run('new Set(allKanji).size===allKanji.length'),true);
for(let id=1;id<=12;id++){
  context.location.hash=`#lesson-${id}-summary`;
  run('render()');
  const html=elements.get('app').innerHTML;
  assert.ok(html.includes(`สรุปบทที่ ${id}`));
  assert.ok(!html.includes('quiz-area'));
  assert.ok(!html.includes('undefined'));
  assert.equal((html.match(/class="kanji-character"/g)||[]).length,run(`lessonKanji(lessons[${id-1}]).length`));
  assert.ok(html.includes(`href="#lesson-${id}-practice"`));
}
context.location.hash='#kanji';run('render()');
assert.equal((elements.get('app').innerHTML.match(/class="kanji-character"/g)||[]).length,162);
assert.ok(elements.get('main-nav').innerHTML.includes('nav-link active" href="#kanji"'));
assert.equal(elements.get('breadcrumb').textContent,'สรุปคันจิทุกบท');
for(const tab of ['vocab','grammar','practice','listen']){
  context.location.hash=`#lesson-1-${tab}`;run('render()');
  assert.ok(elements.get('app').innerHTML.includes('href="#lesson-1-summary"'));
  assert.ok(elements.get('app').innerHTML.includes(tab==='vocab'?'word-grid':tab==='grammar'?'PATTERN':'quiz-area'));
}
// Include kanji that occur only in explanations or quiz choices, not just vocabulary.
assert.ok(run('lessonKanji(lessons[2]).includes("値")'));
assert.ok(run('lessonKanji(lessons[10]).includes("台")'));
assert.ok(run('lessonKanji(lessons[8]).includes("漢")'));
assert.ok(run('kanjiInfo["日"].readings.includes("にち")'));
assert.ok(run('kanjiNote().includes("一人（ひとり）")'));
assert.ok(run('kanjiCards(["人"],lessons[10]).includes("ふたり")'));
const html=fs.readFileSync('index.html','utf8');
assert.ok(html.indexOf('data.js')<html.indexOf('summary-data.js'));
assert.ok(html.indexOf('summary-data.js')<html.indexOf('summary.js'));
assert.ok(html.indexOf('summary.js')<html.indexOf('app.js'));
console.log('PASS: 12 summary routes, 162 kanji, lesson references, special readings, script order, and existing lesson tabs.');
