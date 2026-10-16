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
    const example=s=>`<li><div lang="ja">${esc(s.jp)}</div>${s.kana?`<div class="kana" lang="ja">${esc(s.kana)}</div>`:''}${s.romaji?`<div class="romaji">${esc(s.romaji)}</div>`:''}${s.thai?`<div>${esc(s.thai)}</div>`:''}<a class="text-link" href="#lesson-${s.lid}-summary">บท ${s.lid} · ${s.source}</a></li>`;
    return `<article class="grammar-card kanji-card"><div class="kanji-heading"><span class="kanji-character" lang="ja">${char}</span><div><h3>${esc(info.meaning)}</h3><p>เสียงอ่านที่พบบ่อย: <span lang="ja">${esc(info.readings)}</span></p></div></div><p class="small muted">พบในบท ${usedIn.map(l=>`<a href="#lesson-${l.id}-summary">${l.id}</a>`).join(' · ')}</p><ul class="kanji-examples">${(words.length?words:contexts.slice(0,1)).map(example).join('')}</ul>${contexts.length?`<details><summary>ดูบริบทอื่นที่ใช้ (${contexts.length})</summary><ul class="kanji-examples">${contexts.map(example).join('')}</ul></details>`:''}</article>`;
  }).join('');
}
function kanjiNote(){return `<div class="tip"><b>คันจิแทนความหมาย ส่วนคานะช่วยบอกเสียงอ่าน</b><p>เช่น 日本（にほん）: 日 สื่อถึงดวงอาทิตย์ และ 本 สื่อถึงต้นกำเนิด รวมเป็นชื่อประเทศญี่ปุ่น ไม่ได้แปลแยกตัวตรง ๆ ทุกคำ คันจิตัวเดียวอาจอ่านต่างกัน เช่น 日 ใน 日本（にほん）กับ 毎日（まいにち）</p><p>เสียงอ่านด้านล่างเป็นตัวอย่างที่พบบ่อย ให้ยึดคำอ่านของทั้งคำในบทเรียน เช่น 一人（ひとり）และ 二人（ふたり）เป็นคำอ่านพิเศษ ส่วน 食べます: 食 สื่อความหมาย “กิน” และ べます เป็นฮิรางานะที่ตามหลัง</p></div>`}
function lessonSummary(l){
  const chars=lessonKanji(l),[goal,caution]=lessonTakeaways[l.id-1];
  return `<section class="grammar-card"><span class="eyebrow">LESSON RECAP</span><h2>สรุปบทที่ ${l.id} · ${l.title}</h2><p>${esc(goal)}</p><p><b>จุดที่ต้องจำ:</b> ${esc(caution)}</p><a class="text-link" href="#lesson-${l.id}-grammar">อ่านไวยากรณ์ฉบับเต็ม ${icon('arrow')}</a></section><div class="section-head"><h2>รูปประโยคสำคัญ</h2></div><div class="summary-patterns">${l.grammar.map(g=>`<article class="grammar-card"><h3>${esc(g.pattern)}</h3><p>${esc(g.explain)}</p><div class="example"><div><div class="jp" lang="ja">${esc(g.jp)}</div><div class="romaji">${esc(g.romaji)}</div><div>${esc(g.thai)}</div></div>${audio(g.jp)}</div></article>`).join('')}</div><div class="section-head"><div><h2>คันจิในบทนี้ · ${chars.length} ตัว</h2><p>รวมคำศัพท์ ไวยากรณ์ คำอธิบาย และแบบฝึกหัด</p></div><a class="text-link" href="#kanji">คันจิทุกบท ${icon('arrow')}</a></div>${kanjiNote()}<div class="kanji-grid">${kanjiCards(chars,l)}</div><a class="primary" href="#lesson-${l.id}-practice">ทดสอบความเข้าใจ ${icon('arrow')}</a>`;
}
function kanjiPage(){return `<div class="welcome"><div><span class="eyebrow">KANJI REFERENCE · LESSONS 01–12</span><h1>สรุปคันจิทุกบท</h1><p>${allKanji.length} ตัวที่ใช้ในบทเรียนทั้ง 12 บท พร้อมความหมาย คำอ่าน และตัวอย่างการใช้</p></div></div>${kanjiNote()}<div class="section-head"><div><h2>ทบทวนแยกตามบท</h2><p>เลือกบทเพื่อดูสรุปและคันจิของบทนั้น</p></div></div><div class="summary-links">${lessons.map(l=>`<a class="secondary" href="#lesson-${l.id}-summary">${String(l.id).padStart(2,'0')} · ${l.title}</a>`).join('')}</div><div class="section-head"><h2>คันจิทั้งหมด · ${allKanji.length} ตัว</h2></div><div class="kanji-grid">${kanjiCards(allKanji)}</div>`}
