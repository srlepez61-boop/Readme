// Clean, tested app.js — Word Builder + Sentence + Rhymes + XP + Path + Confetti

/* ========= DATA: 5 levels x 10 words each ========= */
const levels = [
  [ {word:'cat',pic:'🐱'},{word:'dog',pic:'🐶'},{word:'sun',pic:'☀️'},{word:'hat',pic:'🎩'},{word:'bat',pic:'🦇'},{word:'fox',pic:'🦊'},{word:'ant',pic:'🐜'},{word:'bee',pic:'🐝'},{word:'cow',pic:'🐮'},{word:'pig',pic:'🐷'} ],
  [ {word:'fish',pic:'🐟'},{word:'book',pic:'📖'},{word:'star',pic:'⭐'},{word:'tree',pic:'🌳'},{word:'milk',pic:'🥛'},{word:'cake',pic:'🍰'},{word:'leaf',pic:'🍃'},{word:'moon',pic:'🌙'},{word:'bear',pic:'🐻'},{word:'lion',pic:'🦁'} ],
  [ {word:'rain',pic:'🌧️'},{word:'ship',pic:'🚢'},{word:'ring',pic:'💍'},{word:'shoe',pic:'👟'},{word:'ball',pic:'⚽'},{word:'bell',pic:'🔔'},{word:'bike',pic:'🚲'},{word:'clock',pic:'🕰️'},{word:'chair',pic:'🪑'},{word:'table',pic:'🛋️'} ],
  [ {word:'train',pic:'🚂'},{word:'plane',pic:'✈️'},{word:'house',pic:'🏠'},{word:'apple',pic:'🍎'},{word:'horse',pic:'🐴'},{word:'watch',pic:'⌚'},{word:'phone',pic:'📱'},{word:'truck',pic:'🚚'},{word:'brush',pic:'🪥'},{word:'piano',pic:'🎹'} ],
  [ {word:'garden',pic:'🌷'},{word:'river',pic:'🏞️'},{word:'island',pic:'🏝️'},{word:'mount',pic:'⛰️'},{word:'castle',pic:'🏰'},{word:'robot',pic:'🤖'},{word:'banana',pic:'🍌'},{word:'orange',pic:'🍊'},{word:'teacher',pic:'👩‍🏫'},{word:'doctor',pic:'👨‍⚕️'} ]
];

const sentencesBank = [
  ['I','see','a','cat'],
  ['The','dog','is','big'],
  ['I','like','the','sun'],
  ['The','fish','swims','fast'],
  ['A','ball','is','red']
];

const rhymesBank = [
  {target:'cat', options:['bat','dog','sun','hat'], answer:'bat'},
  {target:'dog', options:['log','cat','fish','sun'], answer:'log'},
  {target:'sun', options:['fun','run','cat','dog'], answer:'fun'},
  {target:'ball', options:['fall','cat','dog','fish'], answer:'fall'}
];

/* ========= STATE & DOM ========= */
let currentLevel = 0;
let currentWord = null;
let xp = 0;
let currentSentence = null;
let currentRhyme = null;

const letterGrid = document.querySelector('.letter-grid');
const slotsEl = document.getElementById('slots');
const poolEl = document.getElementById('letters-pool');
const checkBtn = document.getElementById('check-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const hintBtn = document.getElementById('hint-btn');
const msg = document.getElementById('msg');
const pic = document.getElementById('pic');

const xpBar = document.getElementById('xp-bar');
const xpText = document.getElementById('xp-text');
const pathEl = document.getElementById('path');

const sentenceSlots = document.getElementById('sentence-slots');
const sentencePool = document.getElementById('sentence-pool');
const checkSentenceBtn = document.getElementById('check-sentence-btn');
const sentenceMsg = document.getElementById('sentence-msg');

const rhymeTarget = document.getElementById('rhyming-target');
const rhymeChoices = document.getElementById('rhyming-choices');
const rhymeMsg = document.getElementById('rhyme-msg');

const rewardScreen = document.getElementById('reward-screen');
const restartBtn = document.getElementById('restart-btn');
const confettiCanvas = document.getElementById('confetti');

/* ========= UTIL FUNCTIONS ========= */
function shuffleArray(arr){ return arr.slice().sort(()=>Math.random()-0.5); }

function speak(text){
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }catch(e){}
}

/* XP and Level / Learning Path */
function updateXP(amount){
  xp = Math.max(0, Math.min(100, xp + amount));
  xpBar.style.width = xp + '%';
  xpText.textContent = `XP: ${xp}`;
  if(xp >= 100){
    xp = 0;
    xpBar.style.width = '0%';
    currentLevel++;
    if(currentLevel >= levels.length){
      // completed all levels
      showReward();
      return;
    }
    drawLearningPath();
    pickWord();
  }
}

function drawLearningPath(){
  pathEl.innerHTML = '';
  for(let i=0;i<levels.length;i++){
    const node = document.createElement('div');
    node.className = 'level-node' + (i < currentLevel ? ' completed' : '');
    node.textContent = i+1;
    node.addEventListener('click', ()=> {
      currentLevel = i;
      xp = 0;
      xpBar.style.width = '0%';
      drawLearningPath();
      pickWord();
    });
    pathEl.appendChild(node);
  }
}

/* ========= LETTER GRID (phonics) ========= */
(function initLetterGrid(){
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  letterGrid.innerHTML = '';
  [...letters].forEach(l => {
    const btn = document.createElement('div');
    btn.className = 'letter';
    btn.textContent = l.toUpperCase();
    btn.addEventListener('click', ()=> {
      speak(`The letter ${l} says ${l}`);
      // attempt to place if letters pool has the letter
      placeLetterFromPool(l);
    });
    letterGrid.appendChild(btn);
  });
})();

/* ========= WORD BUILDER ========= */
function setEmoji(emoji){
  pic.alt = emoji;
  // prefer using emoji image via twemoji to ensure consistent look
  try{
    const codepoints = Array.from(emoji).map(c => c.codePointAt(0).toString(16));
    pic.src = `https://twemoji.maxcdn.com/v/latest/72x72/${codepoints.join('-')}.png`;
  }catch(e){
    pic.src = '';
  }
}

function pickWord(){
  const words = levels[currentLevel];
  if(!words || words.length === 0){
    showReward();
    return;
  }
  currentWord = words[Math.floor(Math.random()*words.length)];
  setEmoji(currentWord.pic);
  slotsEl.innerHTML = '';
  poolEl.innerHTML = '';
  msg.textContent = '';

  // create empty slots for each letter
  currentWord.word.split('').forEach((_ch, idx) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.pos = idx;
    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', handleDropToSlot);
    slot.addEventListener('click', () => {
      // remove letter from slot and re-enable chip
      if(slot.textContent){
        const letter = slot.textContent;
        slot.textContent = '';
        slot.classList.remove('filled');
        const chip = Array.from(poolEl.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'true');
        if(chip){ chip.dataset.used = 'false'; chip.disabled = false; }
      }
    });
    slotsEl.appendChild(slot);
  });

  // create shuffled chips
  shuffleArray(currentWord.word.split('')).forEach(ch => {
    const chip = document.createElement('button');
    chip.className = 'letter-tile';
    chip.textContent = ch.toUpperCase();
    chip.draggable = true;
    chip.dataset.used = 'false';
    chip.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', ch);
      chip.classList.add('dragging');
    });
    chip.addEventListener('dragend', ()=>chip.classList.remove('dragging'));
    chip.addEventListener('click', ()=> {
      if(chip.dataset.used === 'true') return;
      placeSpecificChip(chip);
      speak(chip.textContent);
    });
    poolEl.appendChild(chip);
  });
}

function placeLetterFromPool(letter){
  const chip = Array.from(poolEl.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'false');
  if(!chip) return;
  placeSpecificChip(chip);
}

function placeSpecificChip(chip){
  const emptySlot = Array.from(slotsEl.children).find(s => !s.textContent);
  if(!emptySlot) return;
  emptySlot.textContent = chip.textContent;
  emptySlot.classList.add('filled');
  chip.dataset.used = 'true';
  chip.disabled = true;
}

function handleDropToSlot(e){
  e.preventDefault();
  const letter = e.dataTransfer.getData('text/plain');
  if(!letter) return;
  // find chip with that letter and not used
  const chip = Array.from(poolEl.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'false');
  if(!chip) return;
  // if target slot is filled, do nothing
  if(e.currentTarget.textContent) return;
  e.currentTarget.textContent = chip.textContent;
  e.currentTarget.classList.add('filled');
  chip.dataset.used = 'true';
  chip.disabled = true;
}

/* Check, shuffle, hint */
checkBtn.addEventListener('click', ()=>{
  if(!currentWord) return;
  const built = Array.from(slotsEl.children).map(s => (s.textContent||'')).join('').toLowerCase();
  if(built === currentWord.word){
    msg.textContent = '🎉 Correct!';
    updateXP(20);
    // remove this word from the pool so it won't repeat within level
    levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);
    setTimeout(()=>{
      if(levels[currentLevel].length === 0){
        // advance level
        currentLevel++;
        if(currentLevel >= levels.length){
          showReward();
          return;
        }
        drawLearningPath();
      }
      pickWord();
    }, 700);
  } else {
    msg.textContent = 'Try again!';
  }
});

shuffleBtn.addEventListener('click', ()=>{
  if(!currentWord) return;
  const letters = Array.from(poolEl.children).map(c => c.textContent);
  poolEl.innerHTML = '';
  shuffleArray(letters).forEach(l => {
    const chip = document.createElement('button');
    chip.className = 'letter-tile';
    chip.textContent = l;
    chip.draggable = true;
    chip.dataset.used = 'false';
    chip.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', l); chip.classList.add('dragging');});
    chip.addEventListener('dragend', ()=>chip.classList.remove('dragging'));
    chip.addEventListener('click', ()=>{ if(chip.dataset.used === 'true') return; placeSpecificChip(chip); speak(chip.textContent); });
    poolEl.appendChild(chip);
  });
});

hintBtn.addEventListener('click', ()=>{
  if(!currentWord) return;
  // reveal first empty slot with the correct letter
  const emptySlots = Array.from(slotsEl.children).filter(s => !s.textContent);
  if(emptySlots.length === 0) return;
  const slot = emptySlots[0];
  const pos = Number(slot.dataset.pos);
  const letter = currentWord.word[pos];
  placeLetterFromPool(letter);
});

/* ========= SENTENCE BUILDER ========= */
function pickSentence(){
  currentSentence = sentencesBank[Math.floor(Math.random()*sentencesBank.length)];
  sentenceSlots.innerHTML = '';
  sentencePool.innerHTML = '';
  sentenceMsg.textContent = '';
  // create slots equal to sentence length
  currentSentence.forEach(() => {
    const slot = document.createElement('div');
    slot.className = 'sentence-slot';
    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', e => {
      e.preventDefault();
      const word = e.dataTransfer.getData('text/plain');
      e.currentTarget.textContent = word;
      // disable matching chip
      const chip = Array.from(sentencePool.children).find(c => c.textContent === word && c.dataset.used !== 'true');
      if(chip){ chip.dataset.used = 'true'; chip.disabled = true; }
    });
    slot.addEventListener('click', () => { if(slot.textContent){ const word = slot.textContent; slot.textContent = ''; const chip = Array.from(sentencePool.children).find(c => c.textContent === word && c.dataset.used === 'true'); if(chip){ chip.dataset.used = 'false'; chip.disabled = false; } }});
    sentenceSlots.appendChild(slot);
  });
  // shuffled chips
  shuffleArray(currentSentence).forEach(w => {
    const chip = document.createElement('button');
    chip.className = 'word-tile';
    chip.textContent = w;
    chip.draggable = true;
    chip.dataset.used = 'false';
    chip.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', w));
    chip.addEventListener('click', ()=> {
      const empty = Array.from(sentenceSlots.children).find(s => !s.textContent);
      if(!empty) return;
      empty.textContent = w;
      chip.dataset.used = 'true';
      chip.disabled = true;
    });
    sentencePool.appendChild(chip);
  });
}

checkSentenceBtn.addEventListener('click', ()=>{
  const built = Array.from(sentenceSlots.children).map(s => s.textContent || '').join(' ');
  if(built === currentSentence.join(' ')){
    sentenceMsg.textContent = '🎉 Correct!';
    updateXP(15);
    pickSentence();
  } else {
    sentenceMsg.textContent = 'Try again!';
  }
});

/* ========= RHYMING GAME ========= */
function pickRhyme(){
  currentRhyme = rhymesBank[Math.floor(Math.random()*rhymesBank.length)];
  rhymeTarget.textContent = `Find the word that rhymes with: "${currentRhyme.target}"`;
  rhymeChoices.innerHTML = '';
  rhymeMsg.textContent = '';
  shuffleArray(currentRhyme.options).forEach(opt => {
    const b = document.createElement('button');
    b.className = 'rhyme-choice';
    b.textContent = opt;
    b.addEventListener('click', ()=>{
      if(opt === currentRhyme.answer){
        rhymeMsg.textContent = '🎉 Correct!';
        updateXP(15);
        pickRhyme();
      } else {
        rhymeMsg.textContent = 'Try again!';
      }
    });
    rhymeChoices.appendChild(b);
  });
}

/* ========= REWARD + CONFETTI ========= */
function showReward(){
  rewardScreen.classList.remove('hidden');
  rewardScreen.setAttribute('aria-hidden','false');
  launchConfetti();
}

restartBtn.addEventListener('click', ()=>{
  rewardScreen.classList.add('hidden');
  rewardScreen.setAttribute('aria-hidden','true');
  currentLevel = 0;
  xp = 0;
  xpBar.style.width = '0%';
  drawLearningPath();
  pickWord();
  pickSentence();
  pickRhyme();
});

/* Simple confetti using canvas */
function launchConfetti(){
  const c = confettiCanvas;
  if(!c) return;
  const ctx = c.getContext('2d');
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  const pieces = [];
  for(let i=0;i<160;i++){
    pieces.push({
      x: Math.random()*c.width,
      y: Math.random()*-c.height,
      r: Math.random()*6+2,
      dx: (Math.random()-0.5)*2,
      dy: Math.random()*3 + 2,
      color: `hsl(${Math.random()*360},100%,50%)`
    });
  }
  let raf;
  function frame(){
    ctx.clearRect(0,0,c.width,c.height);
    pieces.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      if(p.y > c.height) { p.y = -10; p.x = Math.random()*c.width; }
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    });
    raf = requestAnimationFrame(frame);
  }
  frame();
  // stop after 6s
  setTimeout(()=>{ cancelAnimationFrame(raf); ctx.clearRect(0,0,c.width,c.height); }, 6000);
}

/* ========= INIT ========= */
drawLearningPath();
pickWord();
pickSentence();
pickRhyme();

// Optional: keyboard support (backspace to remove last filled slot; letters to place)
document.addEventListener('keydown', e => {
  if(!currentWord) return;
  if(e.key === 'Backspace'){
    e.preventDefault();
    const filled = Array.from(slotsEl.children).filter(s => s.textContent);
    if(!filled.length) return;
    const last = filled[filled.length-1];
    const letter = last.textContent;
    last.textContent = '';
    last.classList.remove('filled');
    const chip = Array.from(poolEl.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'true');
    if(chip){ chip.dataset.used = 'false'; chip.disabled = false; }
    return;
  }
  if(/^[a-zA-Z]$/.test(e.key)){
    placeLetterFromPool(e.key.toLowerCase());
  }
});
