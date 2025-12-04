// Full, cross-platform app.js — tuned for iPad + Windows

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
const enableAudioBtn = document.getElementById('enable-audio');
const shuffleBtn = document.getElementById('shuffle-btn');
const hintBtn = document.getElementById('hint-btn');

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
  // Some iOS require a user gesture before speech works — call a short speak
  if(userAudioEnabled) return;
  userAudioEnabled = true;
  try{ const u = new SpeechSynthesisUtterance('Audio enabled'); if(voices[0]) u.voice = voices[0]; speechSynthesis.speak(u); }
  catch(e){ /* ignore */ }
  enableAudioBtn.style.display = 'none';
}
enableAudioBtn.addEventListener('click', enableAudio);

// ---------- SPEAK ----------
function speak(text){
  if(!userAudioEnabled) return; // require enable on iPad
  if(!text) return;
  const u = new SpeechSynthesisUtterance(text);
  if(voices[0]) u.voice = voices[0];
  u.rate = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ---------- LETTER GRID (touch friendly) ----------
(function initLetterGrid(){
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  letterGrid.innerHTML = '';
  [...letters].forEach(l=>{
    const b = document.createElement('button');
    b.textContent = l.toUpperCase();
    b.addEventListener('click', ()=>{
      // first user gesture also enables audio for iOS if they haven't tapped enable
      if(!userAudioEnabled) enableAudio();
      speak(l);
      placeLetterFromPool(l);
    });
    letterGrid.appendChild(b);
  });
})();

// ---------- EMOJI LOADING (Twemoji) ----------
function setEmoji(emoji){
  pic.alt = emoji;
  try{
    const codepoints = Array.from(emoji).map(c => c.codePointAt(0).toString(16));
    pic.src = `https://twemoji.maxcdn.com/v/latest/72x72/${codepoints.join('-')}.png`;
  }catch(e){
    pic.src = '';
  }
}

// ---------- WORD MANAGEMENT ----------
function pickWord(){
  const words = levels[currentLevel];
  if(!words || words.length === 0){ msg.textContent = 'No more words in this level.'; return; }
  currentWord = words[Math.floor(Math.random() * words.length)];
  setEmoji(currentWord.pic);
  slotsEl.innerHTML = '';
  poolEl.innerHTML = '';
  msg.textContent = '';

  // create slots
  currentWord.word.split('').forEach((ch, idx)=>{
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.pos = idx;
    slot.addEventListener('click', ()=>{ // allow clearing by tapping slot
      if(slot.textContent){
        const letter = slot.textContent;
        slot.textContent = '';
        slot.classList.remove('filled');
        // re-enable corresponding chip
        const chip = Array.from(poolEl.children).find(c => c.textContent === letter && c.dataset.used === 'true');
        if(chip){ chip.dataset.used = 'false'; chip.removeAttribute('aria-disabled'); }
      }
    });
    slotsEl.appendChild(slot);
  });

  // create letter chips (shuffled)
  const shuffled = shuffleArray([...currentWord.word]);
  shuffled.forEach(l=>{
    const chip = document.createElement('button');
    chip.className = 'letter-chip';
    chip.type = 'button';
    chip.textContent = l.toUpperCase();
    chip.dataset.used = 'false';
    chip.setAttribute('aria-disabled','false');

    // click/tap places letter
    chip.addEventListener('click', ()=>{
      if(!userAudioEnabled) enableAudio();
      if(chip.dataset.used === 'true') return;
      placeSpecificChip(chip);
      speak(chip.textContent);
    });

    // make draggable for desktop
    chip.draggable = true;
    chip.addEventListener('dragstart', (ev)=>{ ev.dataTransfer.setData('text/plain', chip.textContent); });

    poolEl.appendChild(chip);
  });

  // enable slots to accept drops
  Array.from(slotsEl.children).forEach(slot=>{
    slot.addEventListener('dragover', ev => ev.preventDefault());
    slot.addEventListener('drop', ev => {
      ev.preventDefault();
      const data = ev.dataTransfer.getData('text/plain'); // e.g. 'C'
      if(!data) return;
      // place into THIS slot (we'll allow placing into first empty if slot filled)
      const targetSlot = ev.currentTarget;
      // if it's already filled, do nothing
      if(targetSlot.textContent) return;
      // find chip with that letter that's not used
      const chip = Array.from(poolEl.children).find(c => c.textContent === data && c.dataset.used === 'false');
      if(!chip) return;
      // place into this specific slot (not necessarily first empty)
      targetSlot.textContent = chip.textContent;
      targetSlot.classList.add('filled');
      chip.dataset.used = 'true';
      chip.setAttribute('aria-disabled','true');
    });
  });
}

// place first empty slot (used by letter-grid and keyboard)
function placeLetterFromPool(letter){
  const chip = Array.from(poolEl.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'false');
  if(!chip) return;
  placeSpecificChip(chip);
}

// place a specific chip into first empty slot
function placeSpecificChip(chip){
  const emptySlot = Array.from(slotsEl.children).find(s => !s.textContent);
  if(!emptySlot) return;
  emptySlot.textContent = chip.textContent;
  emptySlot.classList.add('filled');
  chip.dataset.used = 'true';
  chip.setAttribute('aria-disabled','true');
}

// ---------- KEYBOARD (desktop) & BACKSPACE ----------
document.addEventListener('keydown', (e)=>{
  if(!currentWord) return;
  if(e.key === 'Backspace'){
    e.preventDefault();
    const filled = Array.from(slotsEl.children).filter(s => s.textContent);
    if(filled.length === 0) return;
    const last = filled[filled.length - 1];
    const letter = last.textContent;
    last.textContent = '';
    last.classList.remove('filled');
    const chip = Array.from(poolEl.children).find(c => c.textContent === letter && c.dataset.used === 'true');
    if(chip){ chip.dataset.used = 'false'; chip.removeAttribute('aria-disabled'); }
    return;
  }
  if(/^[a-zA-Z]$/.test(e.key)){
    placeLetterFromPool(e.key);
  }
});

// ---------- CHECK / AUTO-ADVANCE ----------
checkBtn.addEventListener('click', ()=> checkAndAdvance());

function checkAndAdvance(){
  if(!currentWord) return;
  const built = Array.from(slotsEl.children).map(s => s.textContent || '').join('').toLowerCase();
  if(built === currentWord.word){
    msg.textContent = '🎉 Correct!';
    speak(currentWord.word);
    // remove current word from level list
    levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);
    setTimeout(()=>{
      // advance level if needed
      if(levels[currentLevel].length === 0){
        currentLevel++;
        if(currentLevel >= levels.length){
          msg.textContent = '🏆 You finished all levels!';
          return;
        }
      }
      pickWord();
    }, 800);
  } else {
    msg.textContent = 'Try again!';
  }
}

// ---------- SHUFFLE + HINT ----------
shuffleBtn.addEventListener('click', ()=>{
  if(!currentWord) return;
  // shuffle remaining unused chips in pool visually
  const letters = Array.from(poolEl.children).map(c => c.textContent);
  const shuffled = shuffleArray(letters);
  poolEl.innerHTML = '';
  shuffled.forEach(l => {
    const chip = document.createElement('button');
    chip.className = 'letter-chip';
    chip.type = 'button';
    chip.textContent = l;
    chip.dataset.used = 'false';
    chip.setAttribute('aria-disabled','false');
    chip.addEventListener('click', ()=>{ placeSpecificChip(chip); speak(chip.textContent); });
    chip.draggable = true;
    chip.addEventListener('dragstart', ev => ev.dataTransfer.setData('text/plain', chip.textContent));
    poolEl.appendChild(chip);
  });
});

hintBtn.addEventListener('click', ()=>{
  if(!currentWord) return;
  // reveal the next missing letter in its correct position
  const emptySlots = Array.from(slotsEl.children).filter(s => !s.textContent);
  if(emptySlots.length === 0) return;
  const idx = Array.from(slotsEl.children).indexOf(emptySlots[0]); // first empty
  const correctLetter = currentWord.word[idx];
  placeLetterFromPool(correctLetter);
});

// ---------- FLASHCARDS ----------
nextCardBtn.addEventListener('click', ()=>{
  cardIndex = (cardIndex + 1) % sightWords.length;
  card.textContent = sightWords[cardIndex];
  speak(card.textContent);
});
card.addEventListener('click', ()=> speak(card.textContent));

// ---------- INIT ----------
pickWord();

// expose pickWord for re-use
function pickWord(){
  // (function body defined earlier but hoisted) -- call the one above
  // to keep code single-file, re-call the defined pickWord by referencing function name (already defined)
  // Note: function definition for pickWord exists above in the script (hoisted)
}

// (Because we defined pickWord earlier as a function declaration, it's available)
