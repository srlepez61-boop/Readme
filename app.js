// ---------- DATA ----------
const levels = [
  [{ word: 'cat', pic: '🐱' }, { word: 'dog', pic: '🐶' }, { word: 'sun', pic: '☀️' }],
  [{ word: 'fish', pic: '🐟' }, { word: 'book', pic: '📖' }, { word: 'star', pic: '⭐' }]
];
const sightWords = ["the","and","you","that","was","for","are","with","his","they"];
const rhymes = [
  { prompt: 'cat', options: ['hat','dog','sun'], answer: 'hat' },
  { prompt: 'dog', options: ['log','cat','fish'], answer: 'log' }
];
const sentences = [
  { words: ['I','see','a','cat'], scrambled: ['cat','see','I','a'] }
];

// ---------- STATE ----------
let currentLevel = 0;
let currentWord = null;
let cardIndex = 0;
let xp = 0;
let levelNum = 1;

// ---------- ELEMENTS ----------
const letterGrid = document.querySelector('.letter-grid');
const slotsEl = document.getElementById('slots');
const poolEl = document.getElementById('letters-pool');
const checkBtn = document.getElementById('check-btn');
const msg = document.getElementById('msg');
const pic = document.getElementById('pic');
const card = document.getElementById('card');
const nextCardBtn = document.getElementById('next-card');
const xpNumEl = document.getElementById('xp-num');
const xpFill = document.getElementById('xp-fill');
const levelNumEl = document.getElementById('level-num');
const rewardEl = document.getElementById('reward-animation');
const gameSections = document.querySelectorAll('.game-section');
const gameBtns = document.querySelectorAll('.game-btn');
const pathEl = document.getElementById('path');

// ---------- UTILS ----------
function shuffleArray(a){
  const arr=[...a]; for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr;
}
function speak(text){ if(!text) return; const u=new SpeechSynthesisUtterance(text); speechSynthesis.cancel(); speechSynthesis.speak(u); }

// ---------- NAV ----------
gameBtns.forEach(btn=>btn.addEventListener('click',()=> showGame(btn.dataset.game)));
function showGame(game){
  gameSections.forEach(sec=>sec.classList.remove('active'));
  document.getElementById(game+'-game').classList.add('active');
  msg.textContent='';
  if(game==='word') pickWord();
}

// ---------- WORD BUILDER ----------
function pickWord(){
  const words = levels[currentLevel];
  if(!words || words.length===0){ msg.textContent='No more words'; return; }
  currentWord = words[Math.floor(Math.random()*words.length)];
  setEmoji(currentWord.pic);
  slotsEl.innerHTML=''; poolEl.innerHTML=''; msg.textContent='';

  currentWord.word.split('').forEach((ch,idx)=>{
    const slot=document.createElement('div'); slot.className='slot';
    slot.dataset.pos=idx;
    slot.addEventListener('click',()=>{ if(slot.textContent){ const letter=slot.textContent; slot.textContent=''; slot.classList.remove('filled'); const chip = Array.from(poolEl.children).find(c=>c.textContent===letter && c.dataset.used==='true'); if(chip){ chip.dataset.used='false'; chip.removeAttribute('aria-disabled'); } } });
    slotsEl.appendChild(slot);
  });

  const shuffled=shuffleArray([...currentWord.word]);
  shuffled.forEach(l=>{
    const chip=document.createElement('button'); chip.className='letter-chip'; chip.type='button'; chip.textContent=l.toUpperCase(); chip.dataset.used='false'; chip.setAttribute('aria-disabled','false');
    chip.addEventListener('click',()=>{ if(chip.dataset.used==='true') return; placeSpecificChip(chip); speak(chip.textContent); });
    poolEl.appendChild(chip);
  });
}

function placeSpecificChip(chip){
  const emptySlot = Array.from(slotsEl.children).find(s=>!s.textContent);
  if(!emptySlot) return;
  emptySlot.textContent = chip.textContent; emptySlot.classList.add('filled');
  chip.dataset.used='true'; chip.setAttribute('aria-disabled','true');
}

checkBtn.addEventListener('click',()=>{
  const built = Array.from(slotsEl.children).map(s=>s.textContent||'').join('').toLowerCase();
  if(built===currentWord.word){
    msg.textContent='🎉 Correct!';
    rewardXP(10);
    levels[currentLevel]=levels[currentLevel].filter(w=>w.word!==currentWord.word);
    setTimeout(()=>{
      if(levels[currentLevel].length===0){ currentLevel++; levelNum++; levelNumEl.textContent=levelNum; buildMap(); }
      pickWord();
    },800);
  } else msg.textContent='Try again!';
});

// ---------- XP & REWARD ----------
function rewardXP(amount){
  xp+=amount;
  xpNumEl.textContent=xp;
  xpFill.style.width=Math.min(xp,100)+'%';
  rewardEl.style.display='block';
  setTimeout(()=> rewardEl.style.display='none',1000);
}

// ---------- LEVEL MAP ----------
function buildMap(){
  pathEl.innerHTML='';
  for(let i=0;i<5;i++){
    const node=document.createElement('div'); node.className='path-node';
    node.textContent=i+1;
    if(i<levelNum-1) node.classList.add('completed');
    else if(i===levelNum-1) node.classList.add('current');
    pathEl.appendChild(node);
  }
}

// ---------- EMOJI ----------
function setEmoji(emoji){
  pic.alt=emoji;
  try{ const codepoints=Array.from(emoji).map(c=>c.codePointAt(0).toString(16)); pic.src=`https://twemoji.maxcdn.com/v/latest/72x72/${codepoints.join('-')}.png`; } catch(e){ pic.src=''; }
}

// ---------- INIT ----------
buildMap();
showGame('word');
