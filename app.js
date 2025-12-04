// ---------- DATA ----------
const levels = [
  [{ word: 'cat', pic: '🐱' }, { word: 'dog', pic: '🐶' }, { word: 'sun', pic: '☀️' }],
  [{ word: 'fish', pic: '🐟' }, { word: 'book', pic: '📖' }, { word: 'star', pic: '⭐' }]
];
const sightWords = ["the","and","you","that","was","for","are","with","his","they"];

// ---------- STATE ----------
let currentLevel = 0;
let currentWord = null;
let voices = [];
let userAudioEnabled = false;
let cardIndex = 0;

// ---------- ELEMENTS ----------
const letterGrid = document.querySelector('.letter-grid');
const slotsEl = document.getElementById('slots');
const poolEl = document.getElementById('letters-pool');
const checkBtn = document.getElementById('check-btn');
const msg = document.getElementById('msg');
const pic = document.getElementById('pic');
const card = document.getElementById('card');
const nextCardBtn = document.getElementById('next-card');

// ---------- UTILS ----------
function shuffleArray(a){
  const arr = [...a];
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- VOICE SETUP ----------
function loadVoices(){ voices = speechSynthesis.getVoices(); }
speechSynthesis.onvoiceschanged = loadVoices;
setTimeout(loadVoices, 300);

function enableAudio(){
  if(userAudioEnabled) return;
  userAudioEnabled = true;
  try{
    const u = new SpeechSynthesisUtterance('Audio enabled');
    if(voices[0]) u.voice = voices[0];
    speechSynthesis.speak(u);
  }catch(e){}
}

// ---------- SPEAK ----------
function speak(text){
  if(!userAudioEnabled) return;
  if(!text) return;
  const u = new SpeechSynthesisUtterance(text);
  if(voices[0]) u.voice = voices[0];
  u.rate = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ---------- LETTER GRID ----------
function initLetterGrid(){
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  letterGrid.innerHTML = '';
  [...letters].forEach(l=>{
    const b = document.createElement('button');
    b.textContent = l.toUpperCase();
    b.addEventListener('click', ()=>{
      if(!userAudioEnabled) enableAudio();
      speak(l);
      placeLetterFromPool(l);
    });
    letterGrid.appendChild(b);
  });
}

// ---------- EMOJI ----------
function setEmoji(emoji){
  pic.alt = emoji;
  try{
    const codepoints = Array.from(emoji).map(c => c.codePointAt(0).toString(16));
    pic.src = `https://twemoji.maxcdn.com/v/latest/72x72/${codepoints.join('-')}.png`;
  }catch(e){ pic.src = ''; }
}

// ---------- WORD MANAGEMENT ----------
function pickWord(){
  const words = levels[currentLevel];
  if(!words || words.length === 0){ msg.textContent = 'No more words.'; return; }
  currentWord = words[Math.floor(Math.random() * words.length)];
  setEmoji(currentWord.pic);
  slotsEl.innerHTML = '';
  poolEl.innerHTML = '';
  msg.textContent = '';

  // slots
  currentWord.word.split('').forEach((ch, idx)=>{
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.pos = idx;
    slot.addEventListener('click', ()=>{
      if(slot.textContent){
        const letter = slot.textContent;
        slot.textContent = '';
        slot.classList.remove('filled');
        const chip = Array.from(poolEl.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'true');
        if(chip){ chip.dataset.used = 'false'; chip.removeAttribute('aria-disabled'); }
      }
    });
    slotsEl.appendChild(slot);
  });

  // letter chips
  const shuffled = shuffleArray([...currentWord.word]);
  shuffled.forEach(l=>{
    const chip = document.createElement('button');
    chip.className = 'letter-chip';
    chip.type = 'button';
    chip.textContent = l.toUpperCase();
    chip.dataset.used = 'false';
    chip.setAttribute('aria-disabled','false');
    chip.addEventListener('click', ()=>{ 
      if(!userAudioEnabled) enableAudio();
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
  chip.setAttribute('aria-disabled','true');
}

// ---------- KEYBOARD ----------
document.addEventListener('keydown', (e)=>{
  if(!currentWord) return;
  if(e.key === 'Backspace'){
    e.preventDefault();
    const filled = Array.from(slotsEl.children).filter(s=>s.textContent);
    if(filled.length === 0) return;
    const last = filled[filled.length-1];
    const letter = last.textContent;
    last.textContent = '';
    last.classList.remove('filled');
    const chip = Array.from(poolEl.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'true');
    if(chip){ chip.dataset.used='false'; chip.removeAttribute('aria-disabled'); }
    return;
  }
  if(/^[a-zA-Z]$/.test(e.key)){
    placeLetterFromPool(e.key);
  }
});

// ---------- CHECK ----------
checkBtn.addEventListener('click', ()=> checkAndAdvance());

function checkAndAdvance(){
  if(!currentWord) return;
  const built = Array.from(slotsEl.children).map(s=>s.textContent||'').join('').toLowerCase();
  if(built === currentWord.word){
    msg.textContent = '🎉 Correct!';
    speak(currentWord.word);
    levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);
    setTimeout(()=>{
      if(levels[currentLevel].length===0){
        currentLevel++;
        if(currentLevel>=levels.length){
          msg.textContent = '🏆 You finished all levels!';
          return;
        }
      }
      pickWord();
    },800);
  }else{
    msg.textContent = 'Try again!';
  }
}

// ---------- FLASHCARDS ----------
nextCardBtn.addEventListener('click', ()=>{
  cardIndex = (cardIndex+1)%sightWords.length;
  card.textContent = sightWords[cardIndex];
  speak(card.textContent);
});
card.addEventListener('click', ()=> speak(card.textContent));

// ---------- INIT ----------
initLetterGrid();
pickWord();
