
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Read & Play — Rewritten</title>
  <style>
    :root{--accent:#ff6f00;--bg:#f7f7f8;--card:#ffffff;--muted:#666}
    html,body{height:100%;margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial}
    body{background:linear-gradient(180deg,#eef2f6,white);display:flex;align-items:center;justify-content:center;padding:20px}
    .app{width:100%;max-width:980px;background:var(--card);border-radius:16px;box-shadow:0 6px 30px rgba(20,20,40,0.08);padding:20px;display:grid;grid-template-columns:1fr 360px;gap:20px}
    header{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between}
    h1{font-size:20px;margin:0}
    .main{padding:8px}

    /* letter grid */
    .letter-grid{display:grid;grid-template-columns:repeat(13,1fr);gap:6px;margin-bottom:12px}
    .letter-btn{padding:8px 6px;border-radius:8px;background:#fff;border:1px solid #eee;font-weight:600;cursor:pointer}

    .game{display:flex;flex-direction:column;gap:12px}
    .pic-row{display:flex;align-items:center;gap:12px}
    .pic{width:64px;height:64px;display:inline-grid;place-items:center;font-size:34px;background:#fff;border-radius:8px;border:1px solid #eee}
    .meta{flex:1}
    #msg{font-weight:600;color:var(--accent)}

    /* slots + pool */
    .slots{display:flex;gap:8px;padding:12px;background:#fbfbfb;border-radius:12px;min-height:64px;align-items:center}
    .slot{width:48px;height:48px;border-radius:8px;border:2px dashed #e6e6e6;display:grid;place-items:center;font-weight:700;font-size:18px;background:white}
    .slot.filled{border-style:solid}

    .pool{display:flex;flex-wrap:wrap;gap:8px;padding:8px}
    .letter-chip{padding:8px 10px;border-radius:10px;background:white;border:1px solid #eee;cursor:pointer;user-select:none;font-weight:700}
    .letter-chip[aria-pressed="true"]{outline:3px solid rgba(255,111,0,0.14)}
    .letter-chip[data-used="true"]{opacity:0.38}

    .controls{display:flex;gap:8px}
    button.btn{padding:8px 12px;border-radius:10px;background:var(--accent);color:white;border:0;cursor:pointer}
    button.ghost{background:transparent;border:1px solid #ddd;color:var(--muted)}

    aside{padding:12px;border-left:1px dashed #eee}
    .voice-row{display:flex;gap:8px;align-items:center}
    select{padding:8px;border-radius:8px}

    .flashcard{margin-top:12px;padding:12px;background:#fff;border-radius:10px;border:1px solid #eee;display:flex;align-items:center;justify-content:space-between}

    footer{grid-column:1/-1;text-align:center;color:var(--muted);margin-top:6px;font-size:13px}

    @media (max-width:920px){.app{grid-template-columns:1fr;}.letter-grid{grid-template-columns:repeat(7,1fr)}}
  </style>
</head>
<body>
  <div class="app" role="application" aria-label="Read and Play">
    <header>
      <h1>Read & Play</h1>
      <div id="level-badge">Level 1</div>
    </header>

    <main class="main">
      <div class="letter-grid" aria-hidden="true"></div>

      <section class="game" aria-live="polite">
        <div class="pic-row">
          <img id="pic" class="pic" src="" alt="emoji" />
          <div class="meta">
            <div id="msg">Welcome!</div>
            <div id="word-length" style="color:var(--muted);font-size:13px"></div>
          </div>
        </div>

        <div id="slots" class="slots" aria-label="Word slots" tabindex="0"></div>
        <div id="letters-pool" class="pool" aria-label="Letter pool"></div>

        <div class="controls">
          <button id="check-btn" class="btn">Check</button>
          <button id="shuffle-btn" class="ghost">Shuffle</button>
          <button id="hint-btn" class="ghost">Hint</button>
          <button id="next-btn" class="ghost">Skip</button>
        </div>
      </section>
    </main>

    <aside>
      <div class="voice-row">
        <label for="voice-select">Voice</label>
        <select id="voice-select" aria-label="Select voice"></select>
        <button id="speak-word" class="ghost">Speak</button>
      </div>

      <div class="flashcard" role="group" aria-label="Sight words">
        <div id="card" style="font-weight:700">the</div>
        <button id="next-card" class="ghost">Next</button>
      </div>

      <div style="margin-top:12px;color:var(--muted);font-size:13px">
        Tip: click letters or use keyboard. Backspace removes the last filled slot.
      </div>
    </aside>

    <footer>Built for learning — drag & drop + keyboard + speech</footer>
  </div>

  <script>
    // ---------- DATA ----------
    const levels = [
      [ { word: 'cat', pic: '🐱' },{ word: 'dog', pic: '🐶' },{ word: 'sun', pic: '☀️' },{ word: 'bat', pic: '🦇' },{ word: 'car', pic: '🚗' },{ word: 'cup', pic: '☕' },{ word: 'fox', pic: '🦊' },{ word: 'hat', pic: '🎩' },{ word: 'pen', pic: '🖊️' },{ word: 'egg', pic: '🥚' } ],
      [ { word: 'fish', pic: '🐟' },{ word: 'book', pic: '📖' },{ word: 'star', pic: '⭐' },{ word: 'tree', pic: '🌳' },{ word: 'milk', pic: '🥛' },{ word: 'cake', pic: '🍰' },{ word: 'lion', pic: '🦁' },{ word: 'bear', pic: '🐻' },{ word: 'moon', pic: '🌙' },{ word: 'leaf', pic: '🍃' } ]
    ];

    // ---------- STATE ----------
    let currentLevel = 0;
    let currentWord = null;
    let voices = [];
    let selectedVoiceName = '';

    // ---------- ELEMENTS ----------
    const letterGrid = document.querySelector('.letter-grid');
    const slotsEl = document.getElementById('slots');
    const poolEl = document.getElementById('letters-pool');
    const checkBtn = document.getElementById('check-btn');
    const msg = document.getElementById('msg');
    const pic = document.getElementById('pic');
    const voiceSelect = document.getElementById('voice-select');
    const speakWordBtn = document.getElementById('speak-word');
    const levelBadge = document.getElementById('level-badge');
    const wordLengthEl = document.getElementById('word-length');

    // ---------- UTIL ----------
    function shuffleArray(a){const arr=[...a];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}

    // ---------- VOICES ----------
    function loadVoices(){voices = speechSynthesis.getVoices().filter(v=>v.lang.startsWith('en') || v.lang==='');voiceSelect.innerHTML='';voices.forEach(v=>{const opt=document.createElement('option');opt.value=v.name;opt.textContent=`${v.name} (${v.lang})`;voiceSelect.appendChild(opt)});if(!selectedVoiceName && voices[0]){selectedVoiceName=voices[0].name;voiceSelect.value=selectedVoiceName}}
    speechSynthesis.onvoiceschanged = loadVoices;
    setTimeout(loadVoices,200);

    voiceSelect.addEventListener('change',()=>selectedVoiceName=voiceSelect.value);
    speakWordBtn.addEventListener('click',()=>{if(currentWord) speak(currentWord.word)});

    function speak(text){if(!text) return;const u=new SpeechSynthesisUtterance(text);u.lang='en-US';const v=voices.find(x=>x.name===selectedVoiceName);if(v) u.voice=v;u.rate=0.9;speechSynthesis.cancel();speechSynthesis.speak(u)}

    // ---------- LETTER GRID (A-Z) ----------
    (function initLetterGrid(){const letters='abcdefghijklmnopqrstuvwxyz';letterGrid.innerHTML='';[...letters].forEach(l=>{const btn=document.createElement('button');btn.className='letter-btn';btn.textContent=l.toUpperCase();btn.type='button';btn.addEventListener('click',()=>{speak(l);highlightPoolLetter(l);placeLetterFromPool(l)});letterGrid.appendChild(btn)})})();

    // ---------- PICK WORD ----------
    function setEmojiImage(emoji){ // handle multi-codepoint
      try{
        const codepoints = Array.from(emoji).map(c => c.codePointAt(0).toString(16));
        pic.src = `https://twemoji.maxcdn.com/v/14.0.2/72x72/${codepoints.join('-')}.png`;
      }catch(e){pic.src='';}
      pic.alt = emoji;
    }

    function pickWord(){
      const levelWords = levels[currentLevel];
      if(!levelWords || levelWords.length===0){msg.textContent='No more words in this level.';return}
      currentWord = levelWords[Math.floor(Math.random()*levelWords.length)];
      setEmojiImage(currentWord.pic);
      slotsEl.innerHTML='';poolEl.innerHTML='';
      msg.textContent=`Level ${currentLevel+1}`;
      levelBadge.textContent = `Level ${currentLevel+1}`;

      // create slots
      currentWord.word.split('').forEach(()=>{const slot=document.createElement('div');slot.className='slot';slot.setAttribute('role','button');slot.setAttribute('aria-label','empty slot');slotsEl.appendChild(slot)})

      // create chips
      const lettersShuffled = shuffleArray([...currentWord.word]);
      lettersShuffled.forEach(l=>{const chip=document.createElement('button');chip.className='letter-chip';chip.type='button';chip.textContent=l.toUpperCase();chip.setAttribute('aria-pressed','false');chip.addEventListener('click',()=>{if(chip.dataset.used==='true') return;selectChip(chip)});poolEl.appendChild(chip)})

      wordLengthEl.textContent = `${currentWord.word.length} letters`;
    }

    function selectChip(chip){ // UI select and place into next empty slot
      document.querySelectorAll('.letter-chip').forEach(c=>c.setAttribute('aria-pressed','false'));
      chip.setAttribute('aria-pressed','true');
      const emptySlot = Array.from(slotsEl.children).find(s => !s.textContent);
      if(emptySlot){emptySlot.textContent = chip.textContent;emptySlot.classList.add('filled');chip.dataset.used='true';chip.setAttribute('aria-pressed','false');}
      speak(chip.textContent);
    }

    function highlightPoolLetter(letter){const match = Array.from(poolEl.children).find(c=>c.textContent.toLowerCase()===letter && c.dataset.used!=='true');if(match){match.focus();match.style.outline='2px solid rgba(255,111,0,0.18)';setTimeout(()=>match.style.outline='none',300)}}

    function placeLetterFromPool(letter){const poolLetters = Array.from(poolEl.children).filter(c=>c.textContent.toLowerCase()===letter && c.dataset.used!=='true');if(poolLetters.length===0) return;const chip = poolLetters[0];selectChip(chip)}

    // ---------- CHECK / HINT / SKIP ----------
    function checkWord(){const built = Array.from(slotsEl.children).map(s=>s.textContent||'').join('').toLowerCase();if(!currentWord) return; if(built === currentWord.word){speak(currentWord.word);msg.textContent='🎉 Correct!';
        // remove word from level
        levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);
        setTimeout(()=>{
          if(levels[currentLevel].length===0){currentLevel++;if(currentLevel>=levels.length){msg.textContent='🏆 You completed all levels!';return}else{msg.textContent=`🎉 Level ${currentLevel} complete!`}}
          pickWord();
        },900);
      } else {msg.textContent='Try again!'} }

    function hint(){ // reveal one empty slot
      const emptySlots = Array.from(slotsEl.children).filter(s=>!s.textContent);
      if(emptySlots.length===0) return;const idx = Math.floor(Math.random()*emptySlots.length);const slot = emptySlots[idx];const pos = Array.from(slotsEl.children).indexOf(slot);const letter = currentWord.word[pos];placeLetterFromPool(letter);}

    function skip(){msg.textContent='Skipping...';setTimeout(pickWord,300)}

    // ---------- KEYBOARD SUPPORT (with proper backspace handling) ----------
    document.addEventListener('keydown', e=>{
      if(!currentWord) return;
      const key = e.key.toLowerCase();

      // BACKSPACE handling first
      if(key === 'backspace'){
        e.preventDefault();
        const filledSlots = Array.from(slotsEl.children).filter(s => s.textContent);
        if(filledSlots.length === 0) return;
        const lastSlot = filledSlots[filledSlots.length - 1];
        const letter = lastSlot.textContent;
        lastSlot.textContent = '';
        lastSlot.classList.remove('filled');
        const chipToReturn = Array.from(poolEl.children).find(c => c.textContent === letter && c.dataset.used === 'true');
        if(chipToReturn) delete chipToReturn.dataset.used;
        return;
      }

      // Only letters (a-z)
      if(!/^[a-z]$/.test(key)) return;

      const poolLetters = Array.from(poolEl.children).filter(c => c.textContent.toLowerCase() === key && c.dataset.used !== 'true');
      if(poolLetters.length === 0) return;
      const chip = poolLetters[0];
      chip.setAttribute('aria-pressed','true');
      // place into next empty slot
      const emptySlot = Array.from(slotsEl.children).find(s => !s.textContent);
      if(emptySlot){emptySlot.textContent = chip.textContent;emptySlot.classList.add('filled');chip.dataset.used = 'true';}
      speak(chip.textContent);
    });

    // ---------- DRAG & DROP SUPPORT (optional) ----------
    poolEl.addEventListener('dragstart', e => { if(e.target.classList.contains('letter-chip')) e.dataTransfer.setData('text/plain', e.target.textContent); });
    slotsEl.addEventListener('dragover', e=>e.preventDefault());
    slotsEl.addEventListener('drop', e=>{ e.preventDefault(); const data = e.dataTransfer.getData('text/plain'); if(!data) return; placeLetterFromPool(data.toLowerCase()); });

    // make chips draggable
    function enableDraggable(){Array.from(poolEl.children).forEach(c=>{c.draggable=true;c.addEventListener('dragstart',()=>{});});}

    // ---------- BUTTON HOOKS ----------
    checkBtn.addEventListener('click',checkWord);
    document.getElementById('shuffle-btn').addEventListener('click',()=>{ // reshuffle pool
      const letters = Array.from(poolEl.children).map(c=>c.textContent);
      poolEl.innerHTML='';shuffleArray(letters).forEach(l=>{const chip=document.createElement('button');chip.className='letter-chip';chip.type='button';chip.textContent=l;chip.addEventListener('click',()=>selectChip(chip));poolEl.appendChild(chip)});enableDraggable();});
    document.getElementById('hint-btn').addEventListener('click',hint);
    document.getElementById('next-btn').addEventListener('click',skip);

    // Flashcards
    const sightWords = ["the","and","you","that","was","for","are","with","his","they"];
    let cardIndex = 0;
    const card = document.getElementById('card');
    document.getElementById('next-card').addEventListener('click',()=>{cardIndex=(cardIndex+1)%sightWords.length;card.textContent=sightWords[cardIndex];speak(card.textContent)});
    card.addEventListener('click',()=>speak(card.textContent));

    // ---------- INIT ----------
    pickWord();
    enableDraggable();
  </script>
</body>
</html>
