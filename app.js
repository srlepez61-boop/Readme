/* ==========  CONFIG  ========== */
const levels = [
  {word:'cat', pic:'https://cdn.pixabay.com/photo/2016/03/28/10/05/kitten-1285341_960_720.jpg'},
  {word:'dog', pic:'https://cdn.pixabay.com/photo/2016/02/18/18/37/puppy-1207816_960_720.jpg'},
  {word:'sun', pic:'https://cdn.pixabay.com/photo/2017/03/27/14/56/sun-2178203_960_720.jpg'}
];

const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
const sentenceWords = ['The','cat','is','on','the','mat'];

const rhymes = [
  {target:'cat', choices:['bat','hat','dog','sun'], correct:'hat'},
  {target:'dog', choices:['log','frog','cat','sun'], correct:'log'},
  {target:'sun', choices:['fun','run','cat','dog'], correct:'fun'}
];

let currentLevel = 0;
let xp = 0;

/* ==========  DOM CACHING  ========== */
const xpBar  = document.getElementById('xp-bar');
const xpText = document.getElementById('xp-text');
const pathEl = document.getElementById('path');

/* ==========  LEARNING PATH  ========== */
function drawLearningPath(){
  pathEl.innerHTML = '';
  levels.forEach((_,i)=>{
    const node = document.createElement('div');
    node.className = 'level-node';
    node.textContent = i+1;
    if(i < currentLevel) node.classList.add('completed');
    node.addEventListener('click',()=>{
      currentLevel = i;
      updateLearningPath();
      pickWord();
    });
    pathEl.appendChild(node);
  });
}
function updateLearningPath(){
  document.querySelectorAll('.level-node').forEach((n,i)=>{
    n.classList.toggle('completed', i < currentLevel);
  });
}

/* ==========  XP  ========== */
function updateXP(amount){
  xp = Math.min(xp + amount, 100);
  xpBar.style.width = xp + '%';
  xpText.textContent = `XP: ${xp}`;
  if(xp >= 100){
    xp = 0;
    if(currentLevel < levels.length-1){
      currentLevel++;
      pickWord();
      updateLearningPath();
    }else{
      showRewardScreen();
    }
  }
}

/* ==========  LETTER SOUNDS  ========== */
function buildLetterBoard(){
  const grid = document.querySelector('.letter-grid');
  grid.innerHTML = '';
  letters.forEach(l=>{
    const tile = document.createElement('div');
    tile.className = 'letter';
    tile.textContent = l.toUpperCase();
    tile.addEventListener('click',()=>speak(l));
    grid.appendChild(tile);
  });
}
function speak(text){
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

/* ==========  WORD BUILDER  ========== */
function pickWord(){
  const lvl = levels[currentLevel];
  document.getElementById('pic').src = lvl.pic;
  const slots = document.getElementById('slots');
  const pool = document.getElementById('letters-pool');
  slots.innerHTML = '';
  pool.innerHTML = '';
  document.getElementById('msg').textContent = '';

  const word = lvl.word;
  const arr = word.split('').sort(()=>Math.random()-.5);
  arr.forEach(ch=>{
    const tile = makeTile(ch);
    pool.appendChild(tile);
  });
  word.split('').forEach(()=>{
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.addEventListener('dragover',e=>e.preventDefault());
    slot.addEventListener('drop',handleDrop);
    slots.appendChild(slot);
  });
  document.getElementById('check-btn').onclick = ()=>{
    const built = [...slots.children].map(s=>s.textContent).join('');
    if(built === word){
      document.getElementById('msg').textContent = 'Great!';
      updateXP(35);
    }else{
      document.getElementById('msg').textContent = 'Try again…';
    }
  };
}
function makeTile(ch){
  const tile = document.createElement('div');
  tile.className = 'letter-tile';
  tile.textContent = ch;
  tile.draggable = true;
  tile.addEventListener('dragstart',e=>{
    e.dataTransfer.setData('text',ch);
    tile.classList.add('dragging');
  });
  tile.addEventListener('dragend',()=>tile.classList.remove('dragging'));
  return tile;
}
function handleDrop(e){
  e.preventDefault();
  const ch = e.dataTransfer.getData('text');
  e.target.textContent = ch;
}

/* ==========  SENTENCE BUILDER  ========== */
function pickSentence(){
  const slotsBox = document.getElementById('sentence-slots');
  const poolBox = document.getElementById('sentence-pool');
  slotsBox.innerHTML = '';
  poolBox.innerHTML = '';
  document.getElementById('sentence-msg').textContent = '';

  const shuffled = [...sentenceWords].sort(()=>Math.random()-.5);
  shuffled.forEach(w=>{
    const tile = document.createElement('div');
    tile.className = 'word-tile';
    tile.textContent = w;
    tile.draggable = true;
    tile.addEventListener('dragstart',e=>{
      e.dataTransfer.setData('text',w);
      tile.classList.add('dragging');
    });
    tile.addEventListener('dragend',()=>tile.classList.remove('dragging'));
    poolBox.appendChild(tile);
  });
  sentenceWords.forEach(()=>{
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.addEventListener('dragover',e=>e.preventDefault());
    slot.addEventListener('drop',e=>{
      e.preventDefault();
      e.target.textContent = e.dataTransfer.getData('text');
    });
    slotsBox.appendChild(slot);
  });
  document.getElementById('check-sentence-btn').onclick = ()=>{
    const built = [...slotsBox.children].map(s=>s.textContent).join(' ');
    if(built === sentenceWords.join(' ')){
      document.getElementById('sentence-msg').textContent = 'Perfect sentence!';
      updateXP(35);
    }else{
      document.getElementById('sentence-msg').textContent = 'Not quite…';
    }
  };
}

/* ==========  RHYMING GAME  ========== */
function pickRhyme(){
  const item = rhymes[currentLevel % rhymes.length];
  document.getElementById('rhyming-target').textContent = `What rhymes with "${item.target}"?`;
  const box = document.getElementById('rhyming-choices');
  box.innerHTML = '';
  document.getElementById('rhyme-msg').textContent = '';
  item.choices.forEach(w=>{
    const btn = document.createElement('div');
    btn.className = 'rhyme-choice';
    btn.textContent = w;
    btn.onclick = ()=>{
      if(w === item.correct){
        document.getElementById('rhyme-msg').textContent = 'Nice rhyme!';
        updateXP(30);
      }else{
        document.getElementById('rhyme-msg').textContent = 'Nope, try again.';
      }
    };
    box.appendChild(btn);
  });
}

/* ==========  REWARD SCREEN  ========== */
function showRewardScreen(){
  document.getElementById('reward-screen').classList.remove('hidden');
  launchConfetti();
}
document.getElementById('restart-btn').addEventListener('click',()=>{
  currentLevel = 0;
  xp = 0;
  updateXP(0);
  updateLearningPath();
  pickWord();
  pickSentence();
  pickRhyme();
  document.getElementById('reward-screen').classList.add('hidden');
});

/* ==========  CONFETTI  ========== */
function launchConfetti(){
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const pieces = [];
  const colors = ['#f00','#0f0','#00f','#ff0','#f0f','#0ff'];
  for(let i=0;i<150;i++){
    pieces.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height - canvas.height,
      r: Math.random()*4 + 2,
      color: colors[Math.floor(Math.random()*colors.length)],
      vy: Math.random()*3 + 2
    });
  }
  function frame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let done = true;
    pieces.forEach(p=>{
      p.y += p.vy;
      if(p.y < canvas.height) done = false;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    if(!done) requestAnimationFrame(frame);
  }
  frame();
}

/* ==========  INIT  ========== */
buildLetterBoard();
drawLearningPath();
pickWord();
pickSentence();
pickRhyme();
