// ---------- DATA ----------
const levels = [
  [{ word: 'cat', pic: '🐱' }, { word: 'dog', pic: '🐶' }, { word: 'sun', pic: '☀️' }],
  [{ word: 'fish', pic: '🐟' }, { word: 'book', pic: '📖' }, { word: 'star', pic: '⭐' }]
];
const sightWords = ["the","and","you","that","was","for","are","with","his","they"];

// ---------- STATE ----------
let currentLevel = 0;
let currentWord = null;
let cardIndex = 0;
let xp = 0;

// ---------- ELEMENTS ----------
const letterGrid = document.querySelector('.letter-grid');
const slotsEl = document.getElementById('slots');
const poolEl = document.getElementById('letters-pool');
const checkBtn = document.getElementById('check-btn');
const msg = document.getElementById('msg');
const pic = document.getElementById('pic');
const card = document.getElementById('card');
const nextCardBtn = document.getElementById('next-card');
const levelNum = document.getElementById('level-num');
const xpNum = document.getElementById('xp-num');
const xpFill = document.getElementById('xp-fill');
const rewardAnim = document.getElementById('reward-animation');

// ---------- UTILS ----------
function shuffleArray(a){
  const arr = [...a];
  for(let i = arr.length -1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateXP(amount){
  xp += amount;
  xpNum.textContent = xp;
  const fill = Math.min(100, xp*10);
  xpFill.style.width = fill + '%';
}

// ---------- SPEECH ----------
function speak(text){
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  speechSynthesis.speak(u);
}

// ---------- LETTER GRID ----------
(function initLetterGrid(){
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  letterGrid.innerHTML='';
  [...letters].forEach(l=>{
    const b=document.createElement('button');
    b.textContent=l.toUpperCase();
    b.addEventListener('click', ()=>{
      speak(l);
      placeLetterFromPool(l);
    });
    letterGrid.appendChild(b);
  });
})();

// ---------- WORD MANAGEMENT ----------
function pickWord(){
  const words = levels[currentLevel];
  if(!words || words.length===0){ msg.textContent='No more words!'; return; }
  currentWord = words[Math.floor(Math.random()*words.length)];
  setEmoji(currentWord.pic);
  slotsEl.innerHTML=''; poolEl.innerHTML=''; msg.textContent='';

  currentWord.word.split('').forEach((ch, idx)=>{
    const slot=document.createElement('div');
    slot.className='slot';
    slot.dataset.pos=idx;
    slot.addEventListener('click', ()=>{
      if(slot.textContent){
        const letter=slot.textContent;
        slot.textContent='';
        slot.classList.remove('filled');
        const chip=Array.from(poolEl.children).find(c=>c.textContent===letter && c.dataset.used==='true');
        if(chip){ chip.dataset.used='false'; chip.removeAttribute('aria-disabled'); }
      }
    });
    slotsEl.appendChild(slot);
  });

  const shuffled = shuffleArray([...currentWord.word]);
  shuffled.forEach(l=>{
    const chip = document.createElement('button');
    chip.className='letter-chip';
    chip.type='button';
    chip.textContent=l.toUpperCase();
    chip.dataset.used='false';
    chip.setAttribute('aria-disabled','false');
    chip.addEventListener('click', ()=>{
      if(chip.dataset.used==='true') return;
      placeSpecificChip(chip);
      speak(chip.textContent);
    });
    poolEl.appendChild(chip);
  });
}

function setEmoji(emoji){
  pic.alt=emoji;
  try{
    const codepoints=Array.from(emoji).map(c=>c.codePointAt(0).toString(16));
    pic.src=`https://twemoji.maxcdn.com/v/latest/72x72/${codepoints.join('-')}.png`;
  }catch(e){ pic.src=''; }
}

function placeLetterFromPool(letter){
  const chip=Array.from(poolEl.children).find(c=>c.textContent.toLowerCase()===letter.toLowerCase() && c.dataset.used==='false');
  if(!chip) return;
  placeSpecificChip(chip);
}

function placeSpecificChip(chip){
  const emptySlot=Array.from(slotsEl.children).find(s=>!s.textContent);
  if(!emptySlot) return;
  emptySlot.textContent=chip.textContent;
  emptySlot.classList.add('filled');
  chip.dataset.used='true';
  chip.setAttribute('aria-disabled','true');
}

// ---------- CHECK BUTTON ----------
checkBtn.addEventListener('click', ()=> checkWord());
function checkWord(){
  const built = Array.from(slotsEl.children).map(s=>s.textContent||'').join('').toLowerCase();
  if(built===currentWord.word){
    msg.textContent='🎉 Correct!';
    speak(currentWord.word);
    showReward();
    updateXP(1);
    levels[currentLevel]=levels[currentLevel].filter(w=>w.word!==currentWord.word);
    setTimeout(()=>{
      if(levels[currentLevel].length===0){
        currentLevel++;
        if(currentLevel>=levels.length){ msg.textContent='🏆 You finished all levels!'; return; }
        levelNum.textContent=currentLevel+1;
      }
      pickWord();
    },800);
  } else { msg.textContent='Try again!'; }
}

// ---------- FLASHCARDS ----------
nextCardBtn.addEventListener('click', ()=>{
  cardIndex = (cardIndex+1)%sightWords.length;
  card.textContent = sightWords[cardIndex];
  speak(card.textContent);
});
card.addEventListener('click', ()=> speak(card.textContent));

// ---------- REWARD ANIMATION ----------
function showReward(){
  rewardAnim.classList.remove('hidden');
  setTimeout(()=> rewardAnim.classList.add('hidden'),1200);
}

// ---------- KEYBOARD SUPPORT ----------
document.addEventListener('keydown', (e)=>{
  if(!currentWord) return;
  if(e.key==='Backspace'){
    e.preventDefault();
    const filled=Array.from(slotsEl.children).filter(s=>s.textContent);
    if(filled.length===0) return;
    const last=filled[filled.length-1];
    const letter=last.textContent;
    last.textContent='';
    last.classList.remove('filled');
    const chip=Array.from(poolEl.children).find(c=>c.textContent===letter && c.dataset.used==='true');
    if(chip){ chip.dataset.used='false'; chip.removeAttribute('aria-disabled'); }
    return;
  }
  if(/^[a-zA-Z]$/.test(e.key)){ placeLetterFromPool(e.key); }
});

// ---------- INIT ----------
pickWord();
