function kanjiCards(chars,lesson){
  return chars.map(char=>{
    const info=kanjiInfo[char];
    const usedIn=(lesson?[lesson]:lessons).filter(l=>lessonKanji(l).includes(char));
    const examples=[];
    for(const l of usedIn){
      for(const s of lessonSources(l).filter(s=>s.jp.includes(char))){
        if(!examples.some(e=>e.jp===s.jp))examples.push({...s,lid:l.id});
      }
    }
    const words=examples.filter(s=>s.source==='คำศัพท์');
    const contexts=examples.filter(s=>s.source!=='คำศัพท์');
    const example=s=>`<li><div lang="ja">${s.source === "คำศัพท์" ? ruby(s.jp, s.kana) : esc(s.jp)}</div>${s.kana?`<div class="kana" lang="ja">${esc(hiragana(s.kana))}</div>`:''}${s.romaji?`<div class="romaji">${esc(s.romaji)}</div>`:''}${s.thai?`<div>${esc(s.thai)}</div>`:''}<a class="text-link" href="#lesson-${s.lid}-summary">บท ${s.lid} · ${s.source}</a></li>`;
    return `<article class="grammar-card kanji-card"><div class="kanji-heading"><span class="kanji-character" lang="ja">${char}</span><div><h3>${esc(info.meaning)}</h3><p>เสียงอ่านที่พบบ่อย: <span lang="ja">${esc(info.readings)}</span></p></div></div><p class="small muted">พบในบท ${usedIn.map(l=>`<a href="#lesson-${l.id}-summary">${l.id}</a>`).join(' · ')}</p><ul class="kanji-examples">${(words.length?words:contexts.slice(0,1)).map(example).join('')}</ul>${contexts.length?`<details><summary>ดูบริบทอื่นที่ใช้ (${contexts.length})</summary><ul class="kanji-examples">${contexts.map(example).join('')}</ul></details>`:''}</article>`;
  }).join('');
}
function kanjiNote(){return `<div class="tip"><b>คันจิแทนความหมาย ส่วนคานะช่วยบอกเสียงอ่าน</b><p>เช่น 日本（にほん）: 日 สื่อถึงดวงอาทิตย์ และ 本 สื่อถึงต้นกำเนิด รวมเป็นชื่อประเทศญี่ปุ่น ไม่ได้แปลแยกตัวตรง ๆ ทุกคำ คันจิตัวเดียวอาจอ่านต่างกัน เช่น 日 ใน 日本（にほん）กับ 毎日（まいにち）</p><p>เสียงอ่านด้านล่างเป็นตัวอย่างที่พบบ่อย ให้ยึดคำอ่านของทั้งคำในบทเรียน เช่น 一人（ひとり）และ 二人（ふたり）เป็นคำอ่านพิเศษ ส่วน 食べます: 食 สื่อความหมาย “กิน” และ べます เป็นฮิรางานะที่ตามหลัง</p></div>`}
function lessonSummary(lesson) {
  const chars = lessonKanji(lesson);
  const [goal, caution] = lessonTakeaways[lesson.id - 1];
  return `<section class="grammar-card">
    <h2>สรุปบทที่ ${lesson.id} · ${lesson.title}</h2><p>${esc(goal)}</p><p><strong>จุดที่ต้องจำ</strong> ${esc(caution)}</p>
    <a class="text-link" href="#lesson-${lesson.id}-grammar">อ่านไวยากรณ์และตัวอย่าง ${icon('arrow')}</a>
  </section>
  <div class="section-head"><div><h2>คันจิในบทนี้ · ${chars.length} ตัว</h2><p>จากคำศัพท์และประโยคในเว็บ</p></div></div>
  ${romajiToggle()}
  <div class="kanji-grid">${kanjiCards(chars, lesson)}</div>
  <a class="primary" href="#lesson-${lesson.id}-practice">ลองทำแบบฝึกหัด ${icon('arrow')}</a>`;
}
function kanjiPage() {
  const chars = [...new Set(examLessons.flatMap(lessonKanji))];
  return `<header class="study-heading"><h1>สรุปคันจิ บทที่ 1–6</h1><p>เลือกบทเพื่อดูคำอ่านและตัวอย่างของบทนั้น</p></header>
    <nav class="summary-links" aria-label="คันจิแยกตามบท">${examLessons.map(lesson =>
      `<a class="secondary" href="#lesson-${lesson.id}-summary">บทที่ ${lesson.id} · ${lesson.title}</a>`).join('')}</nav>
    ${kanjiNote()}${romajiToggle()}
    <div class="section-head"><h2>คันจิที่ใช้ในเว็บ · ${chars.length} ตัว</h2></div>
    <div class="kanji-grid">${kanjiCards(chars)}</div>`;
}
