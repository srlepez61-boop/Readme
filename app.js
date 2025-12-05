/* app.js — ABCmouse animals full rebuild
   Features:
   - 5 levels × 10 words
   - Letters (phonics), Word Builder, Sentence, Rhyming
   - XP with lock & level progression
   - Learning path, achievements, confetti reward
   - localStorage persistence
*/

(() => {
  // ---------- DATA ----------
  const LEVELS = [
    [{word:'cat',pic:'🐱'},{word:'dog',pic:'🐶'},{word:'sun',pic:'☀️'},{word:'hat',pic:'🎩'},{word:'bat',pic:'🦇'},{word:'fox',pic:'🦊'},{word:'ant',pic:'🐜'},{word:'bee',pic:'🐝'},{word:'cow',pic:'🐮'},{word:'pig',pic:'🐷'}],
    [{word:'fish',pic:'🐟'},{word:'book',pic:'📖'},{word:'star',pic:'⭐'},{word:'tree',pic:'🌳'},{word:'milk',pic:'🥛'},{word:'cake',pic:'🍰'},{word:'leaf',pic:'🍃'},{word:'moon',pic:'🌙'},{word:'bear',pic:'🐻'},{word:'lion',pic:'🦁'}],
    [{word:'rain',pic:'🌧️'},{word:'ship',pic:'🚢'},{word:'ring',pic:'💍'},{word:'shoe',pic:'👟'},{word:'ball',pic:'⚽'},{word:'bell',pic:'🔔'},{word:'bike',pic:'🚲'},{word:'clock',pic:'🕰️'},{word:'chair',pic:'🪑'},{word:'table',pic:'🛋️'}],
    [{word:'train',pic:'🚂'},{word:'plane',pic:'✈️'},{word:'house',pic:'🏠'},{word:'apple',pic:'🍎'},{word:'horse',pic:'🐴'},{word:'watch',pic:'⌚'},{word:'phone',pic:'📱'},{word:'truck',pic:'🚚'},{word:'brush',pic:'🪥'},{word:'piano',pic:'🎹'}],
    [{word:'garden',pic:'🌷'},{word:'river',pic:'🏞️'},{word:'island',pic:'🏝️'},{word:'mount',pic:'⛰️'},{word:'castle',pic:'🏰'},{word:'robot',pic:'🤖'},{word:'banana',pic:'🍌'},{word:'orange',pic:'🍊'},{word:'teacher',pic:'👩‍🏫'},{word:'doctor',pic:'👨‍⚕️'}]
  ];

  const SENTENCES = [['I','see','a','cat'],['The','dog','is','big'],['I','like','the','sun'],['The','fish','swims','fast'],['A','ball','is','red']];
  const RHYMES = [{target:'cat',options:['bat','dog','sun','hat'],answer:'bat'},{target:'dog',options:['log','cat','sun','fish'],answer:'log'},{target:'sun',options:['fun','run','cat','dog'],answer:'fun'},{target:'ball',options:['fall','cat','dog','fish'],answer:'fall'}];

  // ---------- STATE & PERSIST ----------
  const STORAGE_KEY = 'rp_abc_animals_v1';
  const initial = {
    levelIndex:0,
    xp:0,
    completed:{}, // keys "level:word"
    achievements:{},
  };
  let state = Object.assign({}, initial, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));

  function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  // ---------- DOM ----------
  const screens = { menu: document.getElementById('menu'), letters: document.getElementById('letters'),
    word: document.getElementById('word'), sentence: document.getElementById('sentence'), rhyme: document.getElementById('rhyme'),
    path: document.getElementById('path'), achieve: document.getElementById('achieve') };

  const xpBar = document.getElementById('xp-bar'), xpText = document.getElementById('xp-text');
  const letterGrid = document.querySelector('.letter-grid');

  // word builder elements
  const wordPic = document.getElementById('word-pic'); const wordMsg = document.getElementById('word-msg');
  const slots = document.getElementById('slots'); const pool = document.getElementById('pool');
  const feedbackWord = document.getElementById('word-feedback');

  // sentence
  const sSlots = document.getElementById('sentence-slots'); const sPool = document.getElementById('sentence-pool'); const sFeedback = document.getElementById('sentence-feedback');

  // rhyme
  const rhymeTarget = document.getElementById('rhyme-target'); const rhymeChoices = document.getElementById('rhyme-choices'); const rhymeFeedback = document.getElementById('rhyme-feedback');

  // path & achievements
  const pathNodes = document.getElementById('path-nodes'); const pathStatus = document.getElementById('path-status');
  const achList = document.getElementById('ach-list');

  const rewardOverlay = document.getElementById('reward-overlay');
  const confettiCanvas = document.getElementById('confetti');
  const rewardText = document.getElementById('reward-text');

  // navigation
  document.querySelectorAll('.menu-btn').forEach(b => b.addEventListener('click', ()=> {
    const target = b.dataset.screen;
    navigateTo(target);
  }));
  document.querySelectorAll('.nav-back').forEach(b => b.addEventListener('click', ()=> navigateTo('menu')));
  document.getElementById('close-reward').addEventListener('click', ()=> hideReward());

  // ---------- UTILS ----------
  function $(sel){ return document.querySelector(sel); }
  function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }
  function speak(text){ try{ const u=new SpeechSynthesisUtterance(text); u.lang='en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch(e){} }
  function beep(freq=440,t=0.08){ try{ const ctx = new (window.AudioContext||window.webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = freq; g.gain.value = 0.08; o.start(); o.stop(ctx.currentTime + t); }catch(e){} }

  // ---------- NAVIGATION ----------
  function hideAllScreens(){ Object.values(screens).forEach(s => s.classList.add('hidden')); }
  function navigateTo(name){
    hideAllScreens();
    if(name === 'menu'){ screens.menu.classList.remove('hidden'); }
    else if(name === 'letters'){ screens.letters.classList.remove('hidden'); renderLetters(); }
    else if(name === 'word'){ screens.word.classList.remove('hidden'); pickWord(); }
    else if(name === 'sentence'){ screens.sentence.classList.remove('hidden'); pickSentence(); }
    else if(name === 'rhyme'){ screens.rhyme.classList.remove('hidden'); pickRhyme(); }
    else if(name === 'path'){ screens.path.classList.remove('hidden'); renderPath(); }
    else if(name === 'achieve'){ screens.achieve.classList.remove('hidden'); renderAchievements(); }
  }

  // ---------- XP (locked to avoid multi-award) ----------
  let xpLocked = false;
  function grantXP(amount){
    if(xpLocked) return;
    xpLocked = true;
    state.xp = Math.min(100, (state.xp || 0) + amount);
    updateXPUI();
    setTimeout(()=>{ xpLocked = false; }, 700);
    if(state.xp >= 100){
      state.xp = 0;
      state.levelIndex = Math.min(LEVELS.length-1, (state.levelIndex || 0) + 1);
      saveState();
      // if finished all levels:
      if(state.levelIndex >= LEVELS.length-1){
        showReward('You completed the learning path!');
      } else {
        speak('Level up! Great job!');
      }
      renderPath();
    }
    saveState();
  }
  function updateXPUI(){ xpBar.style.width = (state.xp||0) + '%'; xpText.textContent = `XP: ${state.xp||0}`; }

  // ---------- LEARNING PATH ----------
  function renderPath(){
    pathNodes.innerHTML = '';
    for(let i=0;i<LEVELS.length;i++){
      const node = document.createElement('div'); node.className = 'level-node'; node.textContent = i+1;
      if(i < state.levelIndex) node.classList.add('completed');
      node.addEventListener('click', ()=> { state.levelIndex = i; state.xp = 0; saveState(); updateXPUI(); pickWord(); navigateTo('path'); });
      pathNodes.appendChild(node);
    }
    pathStatus.textContent = `Level ${state.levelIndex+1} • Complete words to earn XP`;
  }

  // ---------- LETTERS (phonics) ----------
  function renderLetters(){
    letterGrid.innerHTML = '';
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    [...letters].forEach(l => {
      const d = document.createElement('div'); d.className = 'letter'; d.textContent = l.toUpperCase();
      d.addEventListener('click', ()=> { speak(l); // try place a letter if available in pool
        const chip = Array.from(pool.children).find(c => c.textContent.toLowerCase() === l && c.dataset.used === 'false');
        if(chip) placeChipToEmpty(chip);
      });
      letterGrid.appendChild(d);
    });
  }

  // ---------- WORD BUILDER ----------
  let currentWord = null;
  function pickWord(){
    const words = LEVELS[state.levelIndex];
    // choose an uncompleted word if possible
    const remaining = words.filter(w => !state.completed[`${state.levelIndex}:${w.word}`]);
    const poolWords = remaining.length ? remaining : words;
    currentWord = poolWords[Math.floor(Math.random()*poolWords.length)];
    setupWordUI();
  }
  function setupWordUI(){
    wordPic.src = ''; wordMsg.textContent = 'Drag or tap letters to build the word'; feedbackWord.textContent = '';
    slots.innerHTML = ''; pool.innerHTML = '';

    // slots
    currentWord.word.split('').forEach((ch, idx) => {
      const s = document.createElement('div'); s.className = 'slot'; s.dataset.pos = idx;
      s.addEventListener('dragover', e => e.preventDefault());
      s.addEventListener('drop', onDropToSlot);
      s.addEventListener('click', ()=> {
        if(s.textContent){
          // re-enable chip
          const letter = s.textContent.toLowerCase();
          const chip = Array.from(pool.children).find(c => c.textContent.toLowerCase() === letter && c.dataset.used === 'true');
          if(chip){ chip.dataset.used = 'false'; chip.disabled = false; }
          s.textContent = '';
          s.classList.remove('filled');
        }
      });
      slots.appendChild(s);
    });

    // pool (shuffled)
    shuffle(currentWord.word.split('')).forEach(ch => {
      const b = document.createElement('button'); b.className = 'letter-tile'; b.textContent = ch.toUpperCase(); b.draggable = true; b.dataset.used = 'false';
      b.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', ch); b.classList.add('dragging'); });
      b.addEventListener('dragend', () => b.classList.remove('dragging'));
      b.addEventListener('click', ()=> { if(b.dataset.used === 'true') return; placeChipToEmpty(b); speak(b.textContent); });
      pool.appendChild(b);
    });

    // picture (twemoji)
    setEmoji(currentWord.pic, wordPic);
  }

  function onDropToSlot(e){
    e.preventDefault();
    const letter = e.dataTransfer.getData('text/plain');
    if(!letter) return;
    const chip = Array.from(pool.children).find(c => c.textContent.toLowerCase() === letter && c.dataset.used === 'false');
    if(!chip) return;
    const target = e.currentTarget;
    if(target.textContent) return;
    target.textContent = chip.textContent; target.classList.add('filled'); chip.dataset.used = 'true'; chip.disabled = true;
  }

  function placeChipToEmpty(chip){
    const empty = Array.from(slots.children).find(s => !s.textContent);
    if(!empty) return;
    empty.textContent = chip.textContent; empty.classList.add('filled'); chip.dataset.used = 'true'; chip.disabled = true;
  }

  function checkWord(){
    if(!currentWord) return;
    const built = Array.from(slots.children).map(s => s.textContent || '').join('').toLowerCase();
    if(built === currentWord.word){
      feedbackWord.textContent = '🎉 Correct! +20 XP';
      grantSuccessForWord();
    } else {
      feedbackWord.textContent = 'Try again!';
      beep(220,0.08);
    }
  }

  function grantSuccessForWord(){
    beep(880,0.08); speak(currentWord.word);
    state.completed[`${state.levelIndex}:${currentWord.word}`] = true;
    saveState();
    grantXP(20);
    // small delay then next word
    setTimeout(()=> { pickWord(); }, 800);
  }

  function hintWord(){
    if(!currentWord) return;
    const emptySlots = Array.from(slots.children).filter(s => !s.textContent);
    if(!emptySlots.length) return;
    const slot = emptySlots[0];
    const idx = Number(slot.dataset.pos);
    const needed = currentWord.word[idx];
    const chip = Array.from(pool.children).find(c => c.textContent.toLowerCase() === needed && c.dataset.used === 'false');
    if(chip) placeChipToEmpty(chip);
  }

  // ---------- SENTENCE BUILDER ----------
  let currentSentence = null;
  function pickSentence(){
    currentSentence = SENTENCES[Math.floor(Math.random()*SENTENCES.length)];
    sSlots.innerHTML = ''; sPool.innerHTML = ''; sFeedback.textContent = '';
    currentSentence.forEach(()=> {
      const s = document.createElement('div'); s.className = 'slot';
      s.addEventListener('dragover', e => e.preventDefault());
      s.addEventListener('drop', e => {
        const w = e.dataTransfer.getData('text/plain'); e.currentTarget.textContent = w;
        const chip = Array.from(sPool.children).find(c => c.textContent === w && c.dataset.used !== 'true');
        if(chip) { chip.dataset.used = 'true'; chip.disabled = true; }
      });
      s.addEventListener('click', ()=> {
        if(s.textContent){
          const w = s.textContent; s.textContent = '';
          const chip = Array.from(sPool.children).find(c => c.textContent === w && c.dataset.used === 'true');
          if(chip){ chip.dataset.used = 'false'; chip.disabled = false; }
        }
      });
      sSlots.appendChild(s);
    });
    shuffle(currentSentence).forEach(w => {
      const b = document.createElement('button'); b.className = 'word-tile'; b.textContent = w; b.draggable = true; b.dataset.used = 'false';
      b.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', w));
      b.addEventListener('click', ()=> {
        const empty = Array.from(sSlots.children).find(s => !s.textContent); if(!empty) return;
        empty.textContent = w; b.dataset.used = 'true'; b.disabled = true;
      });
      sPool.appendChild(b);
    });
  }

  function checkSentence(){
    const built = Array.from(sSlots.children).map(s => s.textContent || '').join(' ');
    if(built === currentSentence.join(' ')){
      sFeedback.textContent = '🎉 Correct! +15 XP'; beep(880,0.08); speak(built); grantXP(15); pickSentence();
    } else {
      sFeedback.textContent = 'Try again!';
      beep(220,0.08);
    }
  }

  // ---------- RHYMING ----------
  let currentRhyme = null;
  function pickRhyme(){
    currentRhyme = RHYMES[Math.floor(Math.random()*RHYMES.length)];
    rhymeTarget.textContent = `Which word rhymes with "${currentRhyme.target}"?`;
    rhymeChoices.innerHTML = ''; rhymeFeedback.textContent = '';
    shuffle(currentRhyme.options).forEach(opt => {
      const b = document.createElement('button'); b.className = 'rhyme-choice'; b.textContent = opt;
      b.addEventListener('click', ()=> {
        if(opt === currentRhyme.answer){
          rhymeFeedback.textContent = '🎉 Correct! +15 XP'; beep(880,0.08); grantXP(15); pickRhyme();
        } else { rhymeFeedback.textContent = 'Try again!'; beep(220,0.06); }
      });
      rhymeChoices.appendChild(b);
    });
  }

  // ---------- ACHIEVEMENTS ----------
  function renderAchievements(){
    achList.innerHTML = '';
    const items = [
      {id:'first_word',label:'First Word',desc:'Complete your first word',done: Boolean(state.achievements.first_word)},
      {id:'level_complete',label:'Complete a Level',desc:'Finish 10 words in a level',done: Boolean(state.achievements.level_complete)},
      {id:'xp_100',label:'100 XP',desc:'Earn 100 XP total (accumulated)',done: Boolean(state.achievements.xp_100)}
    ];
    items.forEach(it => {
      const d = document.createElement('div'); d.className = 'ach';
      d.innerHTML = `<div>${it.label}</div><small>${it.desc}</small><div>${it.done? '🏅':'🔒'}</div>`;
      achList.appendChild(d);
    });
  }

  // ---------- REWARD OVERLAY & CONFETTI ----------
  function showReward(text='Great job!'){
    rewardText.textContent = text; rewardOverlay.classList.remove('hidden'); rewardOverlay.style.pointerEvents = 'auto';
    runConfetti(confettiCanvas);
  }
  function hideReward(){
    rewardOverlay.classList.add('hidden'); rewardOverlay.style.pointerEvents = 'none'; // allow clicks again
  }

  function runConfetti(canvas){
    if(!canvas) return;
    const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const pieces = []; for(let i=0;i<160;i++){ pieces.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height-200,dx:(Math.random()-0.5)*3,dy:Math.random()*4+1,r:Math.random()*6+2,color:`hsl(${Math.random()*360},100%,50%)`});}
    let raf;
    function frame(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p => { p.x += p.dx; p.y += p.dy; if(p.y > canvas.height) p.y = -20; ctx.fillStyle = p.color; ctx.fillRect(p.x,p.y,p.r,p.r*1.6); });
      raf = requestAnimationFrame(frame);
    }
    frame(); setTimeout(()=>{ cancelAnimationFrame(raf); ctx.clearRect(0,0,canvas.width,canvas.height); }, 5000);
  }

  // ---------- TWEMOJI HELPER ----------
  function setEmoji(emoji, imgEl){
    imgEl.alt = emoji;
    try{
      const cps = Array.from(emoji).map(c => c.codePointAt(0).toString(16));
      imgEl.src = `https://twemoji.maxcdn.com/v/latest/72x72/${cps.join('-')}.png`;
    }catch(e){ imgEl.src = ''; }
  }

  // ---------- BUTTON HOOKS ----------
  document.getElementById('check-word').addEventListener('click', checkWord);
  document.getElementById('hint-word').addEventListener('click', hintWord);
  document.getElementById('shuffle-word').addEventListener('click', ()=> {
    // shuffle pool UI
    const letters = Array.from(pool.children).map(c => c.textContent);
    pool.innerHTML = ''; shuffle(letters).forEach(l => {
      const b = document.createElement('button'); b.className = 'letter-tile'; b.textContent = l; b.draggable = true; b.dataset.used = 'false';
      b.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', l));
      b.addEventListener('click', ()=> { if(b.dataset.used==='true') return; placeChipToEmpty(b); speak(b.textContent); });
      pool.appendChild(b);
    });
  });

  document.getElementById('check-sentence').addEventListener('click', checkSentence);
  document.getElementById('new-sentence').addEventListener('click', pickSentence);

  // menu button returns to menu
  document.getElementById('menu-btn').addEventListener('click', ()=> navigateTo('menu'));

  // close reward overlay by clicking OK
  document.getElementById('close-reward').addEventListener('click', hideReward);

  // keyboard support: type letters to place them, Backspace to remove last
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){ hideReward(); navigateTo('menu'); }
    if(/^[a-zA-Z]$/.test(e.key) && screens.word && !screens.word.classList.contains('hidden')){
      const key = e.key.toLowerCase();
      const chip = Array.from(pool.children).find(c => c.textContent.toLowerCase() === key && c.dataset.used === 'false');
      if(chip) placeChipToEmpty(chip);
    }
    if(e.key === 'Backspace' && !screens.word.classList.contains('hidden')){
      const filled = Array.from(slots.children).filter(s => s.textContent);
      if(!filled.length) return;
      const last = filled[filled.length-1];
      const letter = last.textContent; last.textContent = ''; last.classList.remove('filled');
      const chip = Array.from(pool.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'true');
      if(chip){ chip.dataset.used = 'false'; chip.disabled = false; }
    }
  });

  // ---------- INIT ----------
  function init(){
    // default state cleanup
    state = Object.assign({}, initial, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    updateXPUI();
    renderPath();
    renderAchievements();
    renderLetters();
    pickWord();
    pickSentence();
    pickRhyme();
    navigateTo('menu');
  }

  // helpers to tie existing functions with closure names used above
  function grantXP(amount){ grantXP_internal(amount); } // wrapper placeholder (internal function name below)
  // implement grantXP_internal: reuse grantXP defined above (we named grantXP earlier). We already have grantXP function defined in this closure.
  function grantXP_internal(amount){ grantXP(amount); } // forwards
  // we used grantXP in several places - ensure it's available in closure
  // start
  init();
  // expose some for debugging (optional)
  window.RP = { state, pickWord, pickSentence, pickRhyme, navigateTo, grantXP };
})();
