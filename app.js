// app.js — Full rebuild (compact & commented)
// Saves progress to localStorage: 'rp_state'

/* ------------------- Utilities ------------------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
function persist(state){ localStorage.setItem('rp_state', JSON.stringify(state)); }
function loadState(){ try{ return JSON.parse(localStorage.getItem('rp_state')) || {}; }catch(e){return {};} }
function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }

/* ------------------- Data (levels, sentences, rhymes) ------------------- */
const LEVELS = [
  [ {word:'cat',pic:'🐱'},{word:'dog',pic:'🐶'},{word:'sun',pic:'☀️'},{word:'hat',pic:'🎩'},{word:'bat',pic:'🦇'},{word:'fox',pic:'🦊'},{word:'ant',pic:'🐜'},{word:'bee',pic:'🐝'},{word:'cow',pic:'🐮'},{word:'pig',pic:'🐷'} ],
  [ {word:'fish',pic:'🐟'},{word:'book',pic:'📖'},{word:'star',pic:'⭐'},{word:'tree',pic:'🌳'},{word:'milk',pic:'🥛'},{word:'cake',pic:'🍰'},{word:'leaf',pic:'🍃'},{word:'moon',pic:'🌙'},{word:'bear',pic:'🐻'},{word:'lion',pic:'🦁'} ],
  [ {word:'rain',pic:'🌧️'},{word:'ship',pic:'🚢'},{word:'ring',pic:'💍'},{word:'shoe',pic:'👟'},{word:'ball',pic:'⚽'},{word:'bell',pic:'🔔'},{word:'bike',pic:'🚲'},{word:'clock',pic:'🕰️'},{word:'chair',pic:'🪑'},{word:'table',pic:'🛋️'} ],
  [ {word:'train',pic:'🚂'},{word:'plane',pic:'✈️'},{word:'house',pic:'🏠'},{word:'apple',pic:'🍎'},{word:'horse',pic:'🐴'},{word:'watch',pic:'⌚'},{word:'phone',pic:'📱'},{word:'truck',pic:'🚚'},{word:'brush',pic:'🪥'},{word:'piano',pic:'🎹'} ],
  [ {word:'garden',pic:'🌷'},{word:'river',pic:'🏞️'},{word:'island',pic:'🏝️'},{word:'mount',pic:'⛰️'},{word:'castle',pic:'🏰'},{word:'robot',pic:'🤖'},{word:'banana',pic:'🍌'},{word:'orange',pic:'🍊'},{word:'teacher',pic:'👩‍🏫'},{word:'doctor',pic:'👨‍⚕️'} ]
];

const SENTENCES = [['I','see','a','cat'],['The','dog','is','big'],['I','like','the','sun'],['The','fish','swims','fast'],['A','ball','is','red']];
const RHYMES = [{target:'cat',options:['bat','dog','sun','hat'],answer:'bat'},{target:'dog',options:['log','cat','sun','fish'],answer:'log'},{target:'sun',options:['fun','run','cat','dog'],answer:'fun'},{target:'ball',options:['fall','cat','dog','fish'],answer:'fall'}];

/* ------------------- App State & Persistence ------------------- */
const saved = loadState();
const state = {
  levelIndex: saved.levelIndex || 0,
  xp: saved.xp || 0,
  completedWords: saved.completedWords || {}, // { '0:cat':true }
  achievements: saved.achievements || {},
  avatar: saved.avatar || {color:'#ffb300',hat:'none'}
};

/* ------------------- DOM refs ------------------- */
const screens = $$('main.screen').concat($$('section.screen'));
const menuScreen = $('#menu');
const letterScreen = $('#letters');
const wbScreen = $('#word-builder');
const sbScreen = $('#sentence-builder');
const rhScreen = $('#rhyming');
const pathScreen = $('#path');
const achScreen = $('#achievements');

const letterGrid = $('.letter-grid');
const wbPic = $('#wb-pic');
const wbSlots = $('#wb-slots');
const wbPool = $('#wb-pool');
const wbMsg = $('#wb-msg');
const sbSlots = $('#sb-slots');
const sbPool = $('#sb-pool');
const sbMsg = $('#sb-msg');
const rgTarget = $('#rg-target');
const rgChoices = $('#rg-choices');
const rgMsg = $('#rg-msg');

const xpBar = $('#xp-bar'), xpText = $('#xp-text');
const pathNodes = $('#path-nodes'), pathStatus = $('#path-status');
const avatarPreview = $('#avatar-preview');
const rewardModal = $('#reward'), confettiCanvas = $('#confetti');

/* ------------------- Audio helpers ------------------- */
const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;
function beep(freq=880, time=0.08, vol=0.15){
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + time);
}
function speak(text){ try{ const u = new SpeechSynthesisUtterance(text); u.lang='en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch(e){} }

/* ------------------- UI helpers ------------------- */
function showScreen(el){
  $$('main.screen, section.screen').forEach(s=>s.classList.add('hidden'));
  el.classList.remove('hidden');
}
function save(){ persist(state); }

/* ------------------- Menu & Profile ------------------- */
function openProfile(){
  $('#profile-modal').classList.remove('hidden');
  $('#avatar-color').value = state.avatar.color;
  $('#avatar-hat').value = state.avatar.hat;
}
function closeProfile(){ $('#profile-modal').classList.add('hidden'); }
function saveProfile(){
  state.avatar.color = $('#avatar-color').value;
  state.avatar.hat = $('#avatar-hat').value;
  renderAvatar();
  save();
  closeProfile();
}

/* ------------------- Avatar preview ------------------- */
function renderAvatar(){
  avatarPreview.innerHTML = '';
  const a = document.createElement('div');
  a.className = 'avatar';
  a.style.background = state.avatar.color;
  a.textContent = '🙂';
  avatarPreview.appendChild(a);
}

/* ------------------- XP & Path ------------------- */
function updateXP(amount){
  state.xp = Math.max(0, Math.min(100, state.xp + amount));
  xpBar.style.width = state.xp + '%';
  xpText.textContent = `XP: ${state.xp}`;
  if(state.xp >= 100){
    state.xp = 0;
    state.levelIndex++;
    if(state.levelIndex >= LEVELS.length){
      // finished entire path
      showReward('You finished the learning path! Great job!');
      state.levelIndex = LEVELS.length - 1;
    } else {
      speak('Level up! Well done!');
      blinkLevel(state.levelIndex);
    }
  }
  save();
  renderPath();
}

function renderPath(){
  pathNodes.innerHTML = '';
  for(let i=0;i<LEVELS.length;i++){
    const node = document.createElement('div');
    node.className = 'level-node' + (i < state.levelIndex ? ' completed' : '');
    node.textContent = i+1;
    node.addEventListener('click', ()=> { state.levelIndex = i; state.xp = 0; save(); renderPath(); pickWord(); showScreen(pathScreen);});
    pathNodes.appendChild(node);
  }
  pathStatus.textContent = `Level ${state.levelIndex+1} of ${LEVELS.length}`;
}

function blinkLevel(i){
  const nodes = $$('.level-node');
  if(nodes[i]) nodes[i].animate([{transform:'scale(1)'},{transform:'scale(1.2)'},{transform:'scale(1)'}],{duration:700});
}

/* ------------------- Word Builder logic ------------------- */
let currentWord = null;

function pickWord(){
  const words = LEVELS[state.levelIndex];
  if(!words || words.length === 0) return;
  // choose a word not completed yet if possible
  const remaining = words.filter(w => !state.completedWords[`${state.levelIndex}:${w.word}`]);
  const pool = remaining.length ? remaining : words;
  currentWord = pool[Math.floor(Math.random()*pool.length)];
  setupWordUI();
}

function setupWordUI(){
  wbPic.src = '';
  wbSlots.innerHTML = '';
  wbPool.innerHTML = '';
  wbMsg.textContent = 'Drag or tap letters to build the word';
  setPic(currentWord.pic, wbPic);

  // slots
  currentWord.word.split('').forEach((ch, idx) => {
    const s = document.createElement('div');
    s.className = 'slot';
    s.dataset.pos = idx;
    s.addEventListener('dragover', e => e.preventDefault());
    s.addEventListener('drop', onDropToSlot);
    s.addEventListener('click', ()=> {
      if(s.textContent){
        // re-enable matching chip
        const letter = s.textContent.toLowerCase();
        const chip = Array.from(wbPool.children).find(c => c.textContent.toLowerCase() === letter && c.dataset.used === 'true');
        if(chip){ chip.dataset.used = 'false'; chip.disabled = false; }
        s.textContent = '';
        s.classList.remove('filled');
      }
    });
    wbSlots.appendChild(s);
  });

  // shuffle chips
  shuffle(currentWord.word.split('')).forEach(ch => {
    const chip = document.createElement('button');
    chip.className = 'letter-tile';
    chip.textContent = ch.toUpperCase();
    chip.draggable = true;
    chip.dataset.used = 'false';
    chip.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', ch); chip.classList.add('dragging');});
    chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
    chip.addEventListener('click', ()=>{ if(chip.dataset.used === 'true') return; placeChipToFirstEmpty(chip); speak(chip.textContent); });
    wbPool.appendChild(chip);
  });
}

function onDropToSlot(e){
  e.preventDefault();
  const letter = e.dataTransfer.getData('text/plain');
  if(!letter) return;
  const chip = Array.from(wbPool.children).find(c => c.textContent.toLowerCase() === letter && c.dataset.used === 'false');
  if(!chip) return;
  const target = e.currentTarget;
  if(target.textContent) return; // already filled
  target.textContent = chip.textContent;
  target.classList.add('filled');
  chip.dataset.used = 'true';
  chip.disabled = true;
}

function placeChipToFirstEmpty(chip){
  const empty = Array.from(wbSlots.children).find(s => !s.textContent);
  if(!empty) return;
  empty.textContent = chip.textContent;
  empty.classList.add('filled');
  chip.dataset.used = 'true';
  chip.disabled = true;
}

function checkWord(){
  if(!currentWord) return;
  const built = Array.from(wbSlots.children).map(s => s.textContent || '').join('').toLowerCase();
  if(built === currentWord.word){
    wbMsg.textContent = 'Correct! +20 XP';
    beep(880,0.08); speak(currentWord.word);
    updateXP(20);
    state.completedWords[`${state.levelIndex}:${currentWord.word}`] = true;
    save();
    // quick celebration
    $$('#wb-pool .letter-tile').forEach(c => c.disabled = true);
    setTimeout(()=> pickWord(), 900);
  } else {
    wbMsg.textContent = 'Try again!';
    beep(220,0.06);
  }
}

function hintWord(){
  if(!currentWord) return;
  const empties = Array.from(wbSlots.children).filter(s => !s.textContent);
  if(!empties.length) return;
  const slot = empties[0];
  const idx = Number(slot.dataset.pos);
  const letter = currentWord.word[idx];
  const chip = Array.from(wbPool.children).find(c => c.textContent.toLowerCase() === letter && c.dataset.used === 'false');
  if(chip) placeChipToFirstEmpty(chip);
}

/* ------------------- Sentence Builder ------------------- */
let sentenceActive = null;
function pickSentence(){
  currentSentence = SENTENCES[Math.floor(Math.random()*SENTENCES.length)];
  sbSlots.innerHTML = ''; sbPool.innerHTML = ''; sbMsg.textContent = '';
  currentSentence.forEach(()=> {
    const slot = document.createElement('div'); slot.className = 'sentence-slot';
    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', e => {
      const word = e.dataTransfer.getData('text/plain');
      e.currentTarget.textContent = word;
      const chip = Array.from(sbPool.children).find(c => c.textContent === word && c.dataset.used !== 'true');
      if(chip){ chip.dataset.used = 'true'; chip.disabled = true; }
    });
    slot.addEventListener('click', ()=> {
      if(slot.textContent){
        const w = slot.textContent;
        slot.textContent = '';
        const chip = Array.from(sbPool.children).find(c => c.textContent === w && c.dataset.used === 'true');
        if(chip){ chip.dataset.used = 'false'; chip.disabled = false; }
      }
    });
    sbSlots.appendChild(slot);
  });
  shuffle(currentSentence).forEach(w => {
    const chip = document.createElement('button'); chip.className = 'word-tile'; chip.textContent = w; chip.draggable = true; chip.dataset.used = 'false';
    chip.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', w));
    chip.addEventListener('click', ()=> {
      const empty = Array.from(sbSlots.children).find(s => !s.textContent);
      if(!empty) return;
      empty.textContent = w; chip.dataset.used = 'true'; chip.disabled = true;
    });
    sbPool.appendChild(chip);
  });
}

function checkSentence(){
  const built = Array.from(sbSlots.children).map(s => s.textContent || '').join(' ');
  if(built === currentSentence.join(' ')){
    sbMsg.textContent = 'Great! +15 XP';
    beep(880,0.08); speak(built);
    updateXP(15);
    pickSentence();
  } else {
    sbMsg.textContent = 'Try again!';
    beep(220,0.06);
  }
}

/* ------------------- Rhyming Game ------------------- */
function pickRhyme(){
  currentRhyme = RHYMES[Math.floor(Math.random()*RHYMES.length)];
  rgTarget.textContent = `Which word rhymes with "${currentRhyme.target}"?`;
  rgChoices.innerHTML = ''; rgMsg.textContent = '';
  shuffle(currentRhyme.options).forEach(opt => {
    const b = document.createElement('button'); b.className = 'rhyme-choice'; b.textContent = opt;
    b.addEventListener('click', ()=> {
      if(opt === currentRhyme.answer){
        rgMsg.textContent = 'Nice! +15 XP';
        beep(880,0.08); updateXP(15);
        pickRhyme();
      } else {
        rgMsg.textContent = 'Try again!';
        beep(220,0.06);
      }
    });
    rgChoices.appendChild(b);
  });
}

/* ------------------- Reward modal & confetti ------------------- */
function showReward(text='You completed the learning path!'){
  $('#reward-text').textContent = text;
  rewardModal.classList.remove('hidden'); rewardModal.querySelector('canvas#confetti').width = window.innerWidth; rewardModal.querySelector('canvas#confetti').height = window.innerHeight;
  runConfetti(rewardModal.querySelector('canvas#confetti'));
}

function runConfetti(canvas){
  const ctx = canvas.getContext('2d'); const w = canvas.width, h = canvas.height;
  const pieces = [];
  for(let i=0;i<200;i++) pieces.push({x:Math.random()*w, y:Math.random()*h, r:Math.random()*5+2, dx:(Math.random()-0.5)*2, dy:Math.random()*3+1, color:`hsl(${Math.random()*360},100%,60%)`});
  let raf;
  function frame(){
    ctx.clearRect(0,0,w,h);
    pieces.forEach(p => { p.x += p.dx; p.y += p.dy; if(p.y>h) p.y = -10; ctx.beginPath(); ctx.fillStyle = p.color; ctx.fillRect(p.x,p.y,p.r,p.r*1.8); });
    raf = requestAnimationFrame(frame);
  }
  frame();
  setTimeout(()=>{ cancelAnimationFrame(raf); ctx.clearRect(0,0,w,h); }, 5000);
}

/* ------------------- small UX & keyboard ------------------- */
document.addEventListener('keydown', e => {
  if(e.key === 'Escape') {
    // close profile or reward
    if(!$('#profile-modal').classList.contains('hidden')) closeProfile();
    if(!$('#reward').classList.contains('hidden')) { $('#reward').classList.add('hidden'); }
  }
  if(/^([a-zA-Z])$/.test(e.key)){
    // try to place letter in word builder
    const c = e.key.toLowerCase();
    if(!wbPool.children.length) return;
    const chip = Array.from(wbPool.children).find(ch => ch.textContent.toLowerCase() === c && ch.dataset.used === 'false');
    if(chip) placeChipToFirstEmpty(chip);
  }
  if(e.key === 'Backspace'){
    // remove last filled slot in builder
    const filled = Array.from(wbSlots.children).filter(s => s.textContent);
    if(filled.length){
      const last = filled[filled.length-1]; const letter = last.textContent; last.textContent = ''; last.classList.remove('filled');
      const chip = Array.from(wbPool.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'true');
      if(chip){ chip.dataset.used = 'false'; chip.disabled = false; }
    }
  }
});

/* ------------------- Initial render & event wiring ------------------- */
function setPic(emoji, imgEl){
  imgEl.alt = emoji;
  try{
    const cps = Array.from(emoji).map(c => c.codePointAt(0).toString(16));
    imgEl.src = `https://twemoji.maxcdn.com/v/latest/72x72/${cps.join('-')}.png`;
  }catch(e){ imgEl.src = ''; }
}

function wireEvents(){
  // menu nav
  $$('.menu-btn').forEach(b => b.addEventListener('click', ()=> {
    const target = b.dataset.screen;
    showScreen($('#' + target));
    if(target === 'letters'){ renderLetters(); }
    if(target === 'word-builder'){ pickWord(); }
    if(target === 'sentence-builder'){ pickSentence(); }
    if(target === 'rhyming'){ pickRhyme(); }
    if(target === 'path') { renderPath(); }
    if(target === 'achievements'){ renderAchievements(); }
  }));
  $$('.back-btn').forEach(b => b.addEventListener('click', ()=> showScreen(menuScreen) ));
  $('#open-profile').addEventListener('click', openProfile);
  $('#close-profile').addEventListener('click', closeProfile);
  $('#save-profile').addEventListener('click', saveProfile);
  $('#save-profile').addEventListener('click', ()=> { beep(1000,0.06); });

  // word builder controls
  $('#wb-check').addEventListener('click', checkWord);
  $('#wb-hint').addEventListener('click', hintWord);
  $('#wb-shuffle').addEventListener('click', ()=> {
    const letters = Array.from(wbPool.children).map(c => c.textContent);
    wbPool.innerHTML = '';
    shuffle(letters).forEach(l => {
      const chip = document.createElement('button'); chip.className = 'letter-tile'; chip.textContent = l; chip.draggable = true; chip.dataset.used = 'false';
      chip.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', l));
      chip.addEventListener('click', ()=> { if(chip.dataset.used==='true') return; placeChipToFirstEmpty(chip); speak(chip.textContent); });
      wbPool.appendChild(chip);
    });
  });

  // sentence & rhyme controls
  $('#sb-check').addEventListener('click', checkSentence);
  $('#sb-new').addEventListener('click', pickSentence);

  // reward modal
  $('#reward-ok').addEventListener('click', ()=> { $('#reward').classList.add('hidden'); });

  // profile modal save/close
  $('#save-profile').addEventListener('click', ()=> { renderAvatar(); });
  $('#restart-btn')?.addEventListener('click', ()=> {
    // restart progress
    state.levelIndex = 0; state.xp = 0; state.completedWords = {}; state.achievements = {}; save();
    renderPath(); pickWord(); pickSentence(); pickRhyme(); $('#reward').classList.add('hidden');
  });
}

function renderLetters(){
  letterGrid.innerHTML = '';
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  [...letters].forEach(l => {
    const d = document.createElement('div'); d.className = 'letter'; d.textContent = l.toUpperCase();
    d.addEventListener('click', ()=> { speak(`The letter ${l}`); const chip = Array.from(wbPool.children).find(c => c.textContent.toLowerCase() === l && c.dataset.used === 'false'); if(chip) placeChipToFirstEmpty(chip); });
    letterGrid.appendChild(d);
  });
}

function renderAchievements(){
  const box = $('#ach-list'); box.innerHTML = '';
  const all = [
    {id:'first_word',label:'First Word',desc:'Complete your first word',done: !!state.achievements.first_word},
    {id:'ten_xp',label:'10 XP',desc:'Gain 10 XP',done: state.xp>=10 || !!state.achievements.ten_xp},
    {id:'complete_level',label:'Complete a Level',desc:'Finish all 10 words in a level',done: !!state.achievements.complete_level}
  ];
  all.forEach(a => {
    const c = document.createElement('div'); c.className = 'achie'; c.innerHTML = `<div>${a.label}</div><small>${a.desc}</small><div>${a.done ? '✅' : '🔒'}</div>`;
    box.appendChild(c);
  });
}

/* ------------------- Start ------------------- */
(function init(){
  renderAvatar();
  renderPath();
  renderLetters();
  wireEvents();
  showScreen(menuScreen);
  pickWord();
  pickSentence();
  pickRhyme();
  // show initial xp
  xpBar.style.width = (state.xp||0) + '%';
  xpText.textContent = `XP: ${state.xp||0}`;
})();
