// ---------- DATA ----------
const levels = [
  [{word:'cat',pic:'🐱'},{word:'dog',pic:'🐶'},{word:'sun',pic:'☀️'},{word:'fish',pic:'🐟'},{word:'hat',pic:'🎩'},{word:'ball',pic:'⚽'},{word:'apple',pic:'🍎'},{word:'car',pic:'🚗'},{word:'pen',pic:'🖊️'},{word:'cup',pic:'☕'}],
  [{word:'moon',pic:'🌙'},{word:'tree',pic:'🌳'},{word:'bird',pic:'🐦'},{word:'cake',pic:'🍰'},{word:'egg',pic:'🥚'},{word:'milk',pic:'🥛'},{word:'star',pic:'⭐'},{word:'book',pic:'📖'},{word:'leaf',pic:'🍃'},{word:'toy',pic:'🧸'}],
  [{word:'dog',pic:'🐶'},{word:'cat',pic:'🐱'},{word:'fish',pic:'🐟'},{word:'sun',pic:'☀️'},{word:'hat',pic:'🎩'},{word:'ball',pic:'⚽'},{word:'cup',pic:'☕'},{word:'car',pic:'🚗'},{word:'egg',pic:'🥚'},{word:'pen',pic:'🖊️'}],
  [{word:'moon',pic:'🌙'},{word:'tree',pic:'🌳'},{word:'star',pic:'⭐'},{word:'cake',pic:'🍰'},{word:'milk',pic:'🥛'},{word:'leaf',pic:'🍃'},{word:'apple',pic:'🍎'},{word:'toy',pic:'🧸'},{word:'bird',pic:'🐦'},{word:'book',pic:'📖'}],
  [{word:'dog',pic:'🐶'},{word:'cat',pic:'🐱'},{word:'sun',pic:'☀️'},{word:'fish',pic:'🐟'},{word:'hat',pic:'🎩'},{word:'ball',pic:'⚽'},{word:'star',pic:'⭐'},{word:'car',pic:'🚗'},{word:'apple',pic:'🍎'},{word:'cup',pic:'☕'}]
];

const sentences = [['I','see','a','cat'],['The','dog','is','big'],['I','like','the','sun'],['The','fish','swims','fast'],['A','ball','is','red']];
const rhymes = [{target:'cat',options:['bat','dog','sun','hat'],answer:'bat'},{target:'dog',options:['log','cat','sun','fish'],answer:'log'},{target:'sun',options:['fun','dog','hat','fish'],answer:'fun'}];

// ---------- STATE ----------
let currentLevel=0, currentWord=null, xp=0, currentSentence=null, currentRhyme=null;

// ---------- ELEMENTS ----------
const letterGrid=document.querySelector('.letter-grid');
const slotsEl=document.getElementById('slots');
const poolEl=document.getElementById('letters-pool');
const checkBtn=document.getElementById('check-btn');
const msg=document.getElementById('msg');
const pic=document.getElementById('pic');

const xpBar=document.getElementById('xp-bar');
const xpText=document.getElementById('xp-text');

const rewardScreen=document.getElementById('reward-screen');
const restartBtn=document.getElementById('restart-btn');
const confettiCanvas=document.getElementById('confetti');

const sentenceSlots=document.getElementById('sentence-slots');
const sentencePool=document.getElementById('sentence-pool');
const checkSentenceBtn=document.getElementById('check-sentence-btn');
const sentenceMsg=document.getElementById('sentence-msg');

const rhymeTarget=document.getElementById('rhyming-target');
const rhymeChoices=document.getElementById('rhyming-choices');
const rhymeMsg=document.getElementById('rhyme-msg');

// ---------- UTILS ----------
function shuffleArray(a){const arr=[...a];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function updateXP(amount){xp+=amount;xpBar.style.width=Math.min(xp,100)+'%';xpText.textContent=`XP: ${xp}`;}
function speak(text){const u=new SpeechSynthesisUtterance(text);speechSynthesis.cancel();speechSynthesis.speak(u);}
function setEmoji(emoji){pic.alt=emoji;try{const codepoints=Array.from(emoji).map(c=>c.codePointAt(0).toString(16));pic.src=`https://twemoji.maxcdn.com/v/latest/72x72/${codepoints.join('-')}.png`;}catch(e){pic.src='';}}

// ---------- LETTER GRID ----------
(function(){
  const letters='abcdefghijklmnopqrstuvwxyz';
  letterGrid.innerHTML='';
  [...letters].forEach(l=>{
    const b=document.createElement('button');b.textContent=l.toUpperCase();
    b.addEventListener('click',()=>{speak(`The letter ${l} says /${l}/`);placeLetterFromPool(l);});
    letterGrid.appendChild(b);
  });
})();

// ---------- WORD BUILDER ----------
function pickWord(){
  const words=levels[currentLevel];
  if(!words||words.length===0){showReward();return;}
  currentWord=words[Math.floor(Math.random()*words.length)];
  setEmoji(currentWord.pic);
  slotsEl.innerHTML=''; poolEl.innerHTML=''; msg.textContent='';

  currentWord.word.split('').forEach((ch,idx)=>{
    const slot=document.createElement('div'); slot.className='slot'; slot.dataset.pos=idx;
    slot.addEventListener('click',()=>{if(slot.textContent){const letter=slot.textContent;slot.textContent='';slot.classList.remove('filled');const chip=Array.from(poolEl.children).find(c=>c.textContent.toLowerCase()===letter.toLowerCase()&&c.dataset.used==='true');if(chip){chip.dataset.used='false';chip.removeAttribute('disabled');}}});
    slotsEl.appendChild(slot);
  });

  const shuffled=shuffleArray([...currentWord.word]);
  shuffled.forEach(l=>{
    const chip=document.createElement('button'); chip.className='letter-chip'; chip.textContent=l.toUpperCase(); chip.dataset.used='false';
    chip.addEventListener('click',()=>{if(chip.dataset.used==='true')return;placeLetterFromPool(l); speak(l);});
    poolEl.appendChild(chip);
  });
}

function placeLetterFromPool(letter){
  const chip=Array.from(poolEl.children).find(c=>c.textContent.toLowerCase()===letter.toLowerCase()&&c.dataset.used==='false');if(!chip)return;
  const emptySlot=Array.from(slotsEl.children).find(s=>!s.textContent);if(!emptySlot)return;
  emptySlot.textContent=chip.textContent; emptySlot.classList.add('filled'); chip.dataset.used='true';
}

// ---------- WORD CHECK ----------
checkBtn.addEventListener('click',()=>{
  const built=Array.from(slotsEl.children).map(s=>s.textContent||'').join('').toLowerCase();
  if(built===currentWord.word){msg.textContent='🎉 Correct!'; updateXP(10);
    levels[currentLevel]=levels[currentLevel].filter(w=>w.word!==currentWord.word);
    setTimeout(()=>{if(levels[currentLevel].length===0){currentLevel++;if(currentLevel>=levels.length){showReward();return;}}pickWord();},800);
  } else {msg.textContent='Try again!';}
});

// ---------- SENTENCE BUILDER ----------
function pickSentence(){
  currentSentence=sentences[Math.floor(Math.random()*sentences.length)];
  sentenceSlots.innerHTML=''; sentencePool.innerHTML=''; sentenceMsg.textContent='';
  currentSentence.forEach(_=>{ const slot=document.createElement('div'); slot.className='sentence-slot'; sentenceSlots.appendChild(slot);});
  const shuffled=shuffleArray(currentSentence);
  shuffled.forEach(word=>{
    const chip=document.createElement('button'); chip.className='sentence-chip'; chip.textContent=word;
    chip.addEventListener('click',()=>{const emptySlot=Array.from(sentenceSlots.children).find(s=>!s.textContent);if(!emptySlot)return;emptySlot.textContent=word; chip.disabled=true;});
    sentencePool.appendChild(chip);
  });
}
checkSentenceBtn.addEventListener('click',()=>{
  const built=Array.from(sentenceSlots.children).map(s=>s.textContent||'').join(' ');
  if(built===currentSentence.join(' ')){sentenceMsg.textContent='🎉 Correct!'; updateXP(10); pickSentence();}
  else{sentenceMsg.textContent='Try again!';}
});

// ---------- RHYMING GAME ----------
function pickRhyme(){
  currentRhyme=rhymes[Math.floor(Math.random()*rhymes.length)];
  rhymeTarget.textContent=`Find a word that rhymes with: ${currentRhyme.target}`;
  rhymeChoices.innerHTML='';
  const shuffled=shuffleArray(currentRhyme.options);
  shuffled.forEach(w=>{
    const chip=document.createElement('button'); chip.className='rhyme-chip'; chip.textContent=w;
    chip.addEventListener('click',()=>{if(w===currentRhyme.answer){rhymeMsg.textContent='🎉 Correct!'; updateXP(10); pickRhyme();} else{rhymeMsg.textContent='Try again!';}});
    rhymeChoices.appendChild(chip);
  });
}

// ---------- REWARD SCREEN + CONFETTI ----------
function showReward(){
  rewardScreen.classList.remove('hidden'); launchConfetti();
}
restartBtn.addEventListener('click',()=>{rewardScreen.classList.add('hidden'); currentLevel=0; xp=0; xpBar.style.width='0%'; pickWord(); pickSentence(); pickRhyme();});

// ---------- SIMPLE CONFETTI ----------
function launchConfetti(){
  const c=confettiCanvas, ctx=c.getContext('2d'); c.width=window.innerWidth; c.height=window.innerHeight;
  let particles=[]; for(let i=0;i<200;i++){particles.push({x:Math.random()*c.width,y:Math.random()*c.height,dx:(Math.random()-0.5)*2,dy:Math.random()*4,r:Math.random()*6+2,color:`hsl(${Math.random()*360},100%,50%)`});}
  function draw(){ctx.clearRect(0,0,c.width,c.height); particles.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,2*Math.PI);ctx.fillStyle=p.color;ctx.fill();p.x+=p.dx;p.y+=p.dy;if(p.y>c.height)p.y=0;if(p.x>c.width)p.x=0;if(p.x<0)p.x=c.width;});requestAnimationFrame(draw);}
  draw();
}

// ---------- INIT ----------
pickWord(); pickSentence(); pickRhyme();
