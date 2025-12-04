<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Read & Play</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="style.css" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;700&display=swap');
    body { font-family: 'Baloo 2', cursive; text-align:center; background:#fff5e6; margin:0; padding:1rem; }
    h1 { color:#ff6f00; font-weight:700; font-size:2.5rem; margin-bottom:1rem; }
    h2 { color:#ff8f00; font-weight:700; margin-bottom:0.5rem; }
    .letter-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(50px,1fr)); gap:0.5rem; margin-bottom:1rem; }
    .letter-grid button { font-weight:700; font-size:2rem; padding:0.5rem; border:none; background:#ffe082; border-radius:10px; cursor:pointer; transition:all 0.2s; }
    .letter-grid button:hover { background:#ffd54f; transform:scale(1.1); }
    #slots { display:flex; justify-content:center; flex-wrap:wrap; gap:0.5rem; margin:1rem 0; }
    .slot { width:50px; height:50px; border:2px dashed #999; border-radius:10px; line-height:50px; font-size:2rem; background:#fafafa; transition:all 0.2s; }
    .letter-chip { display:inline-block; margin:0.25rem; padding:0.5rem 1rem; font-size:1.5rem; font-weight:700; background:#e3f2fd; border-radius:10px; cursor:pointer; transition:all 0.2s; }
    .letter-chip:hover { background:#90caf9; transform:scale(1.05); }
    #pic { height:120px; margin-bottom:0.5rem; }
    #check-btn { font-weight:700; font-size:1.2rem; padding:0.5rem 1rem; margin-top:0.5rem; border-radius:10px; border:2px solid #ffb300; background:#ffe082; cursor:pointer; transition:all 0.2s; }
    #check-btn:hover { background:#ffd54f; transform:scale(1.05); }
    #msg { font-size:1.2rem; margin-top:0.5rem; font-weight:700; }
    #card { font-weight:700; font-size:3rem; padding:2rem; background:#e8f5e9; border-radius:12px; margin:1rem auto; width:200px; cursor:pointer; transition:all 0.2s; }
    #card:hover { background:#c8e6c9; transform:scale(1.05); }
    #next-card { font-weight:700; font-size:1.2rem; padding:0.5rem 1rem; border-radius:10px; border:2px solid #43a047; background:#a5d6a7; cursor:pointer; transition:all 0.2s; }
    #next-card:hover { background:#81c784; transform:scale(1.05); }
  </style>
</head>
<body>
  <h1>Read & Play</h1>

  <!-- LETTER GRID -->
  <section id="letters">
    <h2>Tap a letter to hear its sound</h2>
    <div class="letter-grid"></div>
  </section>

  <!-- WORD BUILDER -->
  <section id="word-builder">
    <h2>Build the word</h2>
    <img id="pic" src="" alt="picture" />
    <div id="slots"></div>
    <div id="letters-pool"></div>
    <button id="check-btn">Check</button>
    <p id="msg"></p>
  </section>

  <!-- FLASHCARDS -->
  <section id="flashcards">
    <h2>Sight-word flashcards</h2>
    <div id="card">?</div>
    <button id="next-card">Next</button>
  </section>

<script>
const levels = [
  [{word:'cat', pic:'🐱'}, {word:'dog', pic:'🐶'}, {word:'sun', pic:'☀️'}],
  [{word:'fish', pic:'🐟'}, {word:'book', pic:'📖'}, {word:'star', pic:'⭐'}]
];

let currentLevel = 0;
let currentWord = null;
let voices = [];
let selectedVoice = '';

const letterGrid = document.querySelector('.letter-grid');
const slotsEl = document.getElementById('slots');
const poolEl = document.getElementById('letters-pool');
const checkBtn = document.getElementById('check-btn');
const msg = document.getElementById('msg');
const pic = document.getElementById('pic');
const card = document.getElementById('card');
const nextCardBtn = document.getElementById('next-card');

function shuffleArray(a){const arr=[...a];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}

function loadVoices(){voices = speechSynthesis.getVoices(); if(voices[0]) selectedVoice = voices[0];}
speechSynthesis.onvoiceschanged = loadVoices;
setTimeout(loadVoices,200);

function speak(text){if(!text) return; const u = new SpeechSynthesisUtterance(text); if(selectedVoice) u.voice=selectedVoice; u.rate=0.9; speechSynthesis.cancel(); speechSynthesis.speak(u);}

// Initialize letters
(function initLetterGrid(){
  const letters='abcdefghijklmnopqrstuvwxyz';
  letters.split('').forEach(l=>{
    const btn = document.createElement('button');
    btn.textContent = l.toUpperCase();
    btn.addEventListener('click',()=>{speak(l); placeLetterFromPool(l)});
    letterGrid.appendChild(btn);
  });
})();

function setEmoji(emoji){
  try{
    const codepoints = Array.from(emoji).map(c => c.codePointAt(0).toString(16));
    pic.src = `https://twemoji.maxcdn.com/v/14.0.2/72x72/${codepoints.join('-')}.png`;
  }catch(e){pic.src='';}
  pic.alt = emoji;
}

function pickWord(){
  const words = levels[currentLevel];
  if(!words || words.length===0){msg.textContent='No more words!'; return;}
  currentWord = words[Math.floor(Math.random()*words.length)];
  setEmoji(currentWord.pic);
  slotsEl.innerHTML=''; poolEl.innerHTML=''; msg.textContent='';
  
  currentWord.word.split('').forEach(()=>{ 
    const slot = document.createElement('div'); slot.className='slot'; slotsEl.appendChild(slot); 
  });

  shuffleArray([...currentWord.word]).forEach(l=>{
    const chip = document.createElement('button');
    chip.className='letter-chip';
    chip.textContent = l.toUpperCase();
    chip.addEventListener('click',()=>selectChip(chip));
    poolEl.appendChild(chip);
  });
}

function selectChip(chip){
  const emptySlot = Array.from(slotsEl.children).find(s=>!s.textContent);
  if(!emptySlot) return;
  emptySlot.textContent = chip.textContent;
  emptySlot.classList.add('filled');
  chip.disabled = true;
  speak(chip.textContent);
}

// Remove last filled slot
document.addEventListener('keydown', e=>{
  if(!currentWord) return;
  if(e.key === 'Backspace'){
    e.preventDefault();
    const filledSlots = Array.from(slotsEl.children).filter(s=>s.textContent);
    if(filledSlots.length===0) return;
    const last = filledSlots[filledSlots.length-1];
    const letter = last.textContent;
    last.textContent=''; last.classList.remove('filled');
    Array.from(poolEl.children).find(c=>c.textContent===letter && c.disabled).disabled=false;
  }
  if(/^[a-z]$/.test(e.key)){
    placeLetterFromPool(e.key);
  }
});

function placeLetterFromPool(letter){
  const chip = Array.from(poolEl.children).find(c=>c.textContent.toLowerCase()===letter.toLowerCase() && !c.disabled);
  if(chip) selectChip(chip);
}

checkBtn.addEventListener('click', ()=>{
  const built = Array.from(slotsEl.children).map(s=>s.textContent||'').join('').toLowerCase();
  if(built===currentWord.word){
    msg.textContent='🎉 Correct!';
    speak(currentWord.word);
    levels[currentLevel] = levels[currentLevel].filter(w=>w.word!==currentWord.word);
    setTimeout(()=>{
      if(levels[currentLevel].length===0){
        currentLevel++;
        if(currentLevel>=levels.length){ msg.textContent='🏆 You finished all levels!'; return;}
        msg.textContent=`🎉 Level ${currentLevel+1}!`;
      }
      pickWord();
    },900);
  }else{
    msg.textContent='Try again!';
  }
});

// Flashcards
const sightWords = ["the","and","you","that","was","for","are","with","his","they"];
let cardIndex = 0;
nextCardBtn.addEventListener('click', ()=>{
  cardIndex = (cardIndex+1)%sightWords.length;
  card.textContent = sightWords[cardIndex];
  speak(card.textContent);
});
card.addEventListener('click', ()=>speak(card.textContent));

pickWord();
</script>
</body>
</html>
