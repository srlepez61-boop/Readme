// ---------- DATA ----------
const levels = [
  [
    { word: 'cat', pic: '🐱' }, { word: 'dog', pic: '🐶' }, { word: 'sun', pic: '☀️' },
    { word: 'fish', pic: '🐟' }, { word: 'book', pic: '📖' }, { word: 'star', pic: '⭐' },
    { word: 'hat', pic: '🎩' }, { word: 'ball', pic: '⚽' }, { word: 'apple', pic: '🍎' }, { word: 'car', pic: '🚗' }
  ],
  [
    { word: 'moon', pic: '🌙' }, { word: 'tree', pic: '🌳' }, { word: 'bird', pic: '🐦' },
    { word: 'cake', pic: '🍰' }, { word: 'dog', pic: '🐶' }, { word: 'sun', pic: '☀️' },
    { word: 'egg', pic: '🥚' }, { word: 'pen', pic: '🖊️' }, { word: 'cup', pic: '☕' }, { word: 'fish', pic: '🐟' }
  ],
  [
    { word: 'milk', pic: '🥛' }, { word: 'hat', pic: '🎩' }, { word: 'ball', pic: '⚽' },
    { word: 'star', pic: '⭐' }, { word: 'book', pic: '📖' }, { word: 'cake', pic: '🍰' },
    { word: 'tree', pic: '🌳' }, { word: 'moon', pic: '🌙' }, { word: 'car', pic: '🚗' }, { word: 'egg', pic: '🥚' }
  ],
  [
    { word: 'dog', pic: '🐶' }, { word: 'cat', pic: '🐱' }, { word: 'sun', pic: '☀️' },
    { word: 'fish', pic: '🐟' }, { word: 'hat', pic: '🎩' }, { word: 'ball', pic: '⚽' },
    { word: 'star', pic: '⭐' }, { word: 'book', pic: '📖' }, { word: 'apple', pic: '🍎' }, { word: 'cup', pic: '☕' }
  ],
  [
    { word: 'moon', pic: '🌙' }, { word: 'egg', pic: '🥚' }, { word: 'pen', pic: '🖊️' },
    { word: 'milk', pic: '🥛' }, { word: 'tree', pic: '🌳' }, { word: 'cake', pic: '🍰' },
    { word: 'car', pic: '🚗' }, { word: 'bird', pic: '🐦' }, { word: 'fish', pic: '🐟' }, { word: 'hat', pic: '🎩' }
  ]
];

const sightWords = ["the","and","you","that","was","for","are","with","his","they"];
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
const xpBar = document.getElementById('xp-bar');
const xpText = document.getElementById('xp-text');
const rewardScreen = document.getElementById('reward-screen');
const restartBtn = document.getElementById('restart-btn');

// ---------- UTILS ----------
function shuffleArray(a){
  const arr = [...a];
  for(let i = arr.length -1; i>0; i--){
    const j = Math.floor(Math.random()* (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateXP(amount){
  xp += amount;
  xpBar.style.width = Math.min(xp,100) + '%';
  xpText.textContent = `XP: ${xp}`;
}

// ---------- LETTER GRID ----------
(function initLetterGrid(){
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  letterGrid.innerHTML = '';
  [...letters].forEach(l=>{
    const b = document.createElement('button');
    b.textContent = l.toUpperCase();
    b.addEventListener('click', ()=>{
      speak(`The letter ${l} says /${l}/`);
      placeLetterFromPool(l);
    });
    letterGrid.appendChild(b);
  });
})();

// ---------- PHONICS SPEECH ----------
function speak(text){
  const u = new SpeechSynthesisUtterance(text);
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ---------- EMOJI LOADING ----------
function setEmoji(emoji){
  pic.alt = emoji;
  try{
    const codepoints = Array.from(emoji).map(c => c.codePointAt(0).toString(16));
    pic.src = `https://twemoji.maxcdn.com/v/latest/72x72/${codepoints.join('-')}.png`;
  }catch(e){ pic.src = ''; }
}

// ---------- WORD BUILDER ----------
function pickWord(){
  const words = levels[currentLevel];
  if(!words || words.length === 0){ showReward(); return; }
  currentWord = words[Math.floor(Math.random()*words.length)];
  setEmoji(currentWord.pic);
  slotsEl.innerHTML = '';
  poolEl.innerHTML = '';
  msg.textContent = '';

  currentWord.word.split('').forEach((ch, idx)=>{
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.pos = idx;
    slot.addEventListener('click', ()=>{
      if(slot.textContent){
        const letter = slot.textContent;
        slot.textContent = '';
        slot.classList.remove('filled');
        const chip = Array.from(poolEl.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used==='true');
        if(chip){ chip.dataset.used='false'; chip.removeAttribute('disabled'); }
      }
    });
    slotsEl.appendChild(slot);
  });

  const shuffled = shuffleArray([...currentWord.word]);
  shuffled.forEach(l=>{
    const chip = document.createElement('button');
    chip.className = 'letter-chip';
    chip.textContent = l.toUpperCase();
    chip.dataset.used = 'false';
    chip.addEventListener('click', ()=> {
      if(chip.dataset.used === 'true') return;
      placeLetterFromPool(l);
      speak(l);
    });
    poolEl.appendChild(chip);
  });
}

function placeLetterFromPool(letter){
  const chip = Array.from(poolEl.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used==='false');
  if(!chip) return;
  const emptySlot = Array.from(slotsEl.children).find(s => !s.textContent);
  if(!emptySlot) return;
  emptySlot.textContent = chip.textContent;
  emptySlot.classList.add('filled');
  chip.dataset.used='true';
}

// ---------- CHECK BUTTON ----------
checkBtn.addEventListener('click', ()=>{
  const built = Array.from(slotsEl.children).map(s=>s.textContent || '').join('').toLowerCase();
  if(built === currentWord.word){
    msg.textContent = '🎉 Correct!';
    updateXP(10);
    levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);
    setTimeout(()=>{
      if(levels[currentLevel].length===0){
        currentLevel++;
        if(currentLevel>=levels.length){ showReward(); return; }
      }
      pickWord();
    }, 800);
  } else {
    msg.textContent = 'Try again!';
  }
});

// ---------- REWARD SCREEN ----------
function showReward(){
  rewardScreen.classList.remove('hidden');
}

restartBtn.addEventListener('click', ()=>{
  rewardScreen.classList.add('hidden');
  currentLevel=0;
  xp=0;
  xpBar.style.width='0%';
  pickWord();
});

// ---------- INIT ----------
pickWord();
