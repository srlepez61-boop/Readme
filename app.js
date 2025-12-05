document.addEventListener('DOMContentLoaded', () => {
  const screens = document.querySelectorAll('.screen');
  const menuButtons = document.querySelectorAll('.menu-btn');
  const backButtons = document.querySelectorAll('.nav-back');
  const dingSound = document.getElementById('ding-sound');

  function showScreen(id) {
    screens.forEach(s => s.classList.add('hidden'));
    document.getElementById(id)?.classList.remove('hidden');
  }
  menuButtons.forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.screen)));
  backButtons.forEach(btn => btn.addEventListener('click', () => showScreen('menu')));
  showScreen('menu');

  // ===== Letters =====
  const lettersGrid = document.querySelector('.letter-grid');
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
    const btn = document.createElement('button');
    btn.textContent = letter; btn.className = 'letter-btn';
    btn.addEventListener('click', () => alert(`You clicked ${letter}`));
    lettersGrid.appendChild(btn);
  });

  function animateDrop(element) {
    element.style.transform = 'scale(1.3)';
    element.style.transition = 'transform 0.2s';
    setTimeout(() => element.style.transform='scale(1)', 200);
    dingSound.currentTime=0; dingSound.play();
  }

  function makeDraggable(el, type) {
    el.setAttribute('draggable','true');
    el.addEventListener('dragstart', e => e.dataTransfer.setData('text', el.dataset[type]));
  }

  // ===== Word Builder =====
  const slots = document.getElementById('slots');
  const pool = document.getElementById('pool');
  const wordFeedback = document.getElementById('word-feedback');
  let currentWord = 'CAT'.split('');

  function populateWordBuilder() {
    slots.innerHTML=''; pool.innerHTML='';
    currentWord.forEach(()=> {
      const slot = document.createElement('div');
      slot.classList.add('slot');
      slot.addEventListener('dragover', e => e.preventDefault());
      slot.addEventListener('drop', e => {
        const letter = e.dataTransfer.getData('text');
        const dragged = document.querySelector(`[data-letter="${letter}"]`);
        if(dragged) { slot.appendChild(dragged); animateDrop(dragged); }
      });
      slots.appendChild(slot);
    });
    ['C','A','T','B','D','E'].forEach(l=>{
      const btn=document.createElement('button');
      btn.textContent=l; btn.className='pool-btn'; btn.dataset.letter=l;
      makeDraggable(btn,'letter');
      pool.appendChild(btn);
    });
    wordFeedback.textContent='';
  }
  populateWordBuilder();

  document.getElementById('check-word').addEventListener('click', () => {
    const built = Array.from(slots.children).map(s=>s.firstChild?.textContent||'').join('');
    wordFeedback.textContent = built===currentWord.join('')?'✅ Correct!':'❌ Try again!';
  });
  document.getElementById('shuffle-word').addEventListener('click', populateWordBuilder);

  // ===== Sentence Builder =====
  const sentenceSlots = document.getElementById('sentence-slots');
  const sentencePool = document.getElementById('sentence-pool');
  const sentenceFeedback = document.getElementById('sentence-feedback');
  const sentenceWords = ['The','cat','runs'];

  function populateSentence() {
    sentenceSlots.innerHTML=''; sentencePool.innerHTML='';
    sentenceWords.forEach(()=> {
      const slot=document.createElement('div'); slot.classList.add('slot');
      slot.addEventListener('dragover', e=>e.preventDefault());
      slot.addEventListener('drop', e=>{
        const word = e.dataTransfer.getData('text');
        const dragged = document.querySelector(`[data-word="${word}"]`);
        if(dragged) { slot.appendChild(dragged); animateDrop(dragged); }
      });
      sentenceSlots.appendChild(slot);
    });
    shuffle(sentenceWords).forEach(w=>{
      const btn=document.createElement('button');
      btn.textContent=w; btn.className='pool-btn'; btn.dataset.word=w;
      makeDraggable(btn,'word'); sentencePool.appendChild(btn);
    });
    sentenceFeedback.textContent='';
  }
  populateSentence();
  document.getElementById('check-sentence').addEventListener('click', () => {
    const built=Array.from(sentenceSlots.children).map(s=>s.firstChild?.textContent||'').join(' ');
    sentenceFeedback.textContent = built===sentenceWords.join(' ')?'✅ Correct!':'❌ Try again!';
  });
  document.getElementById('new-sentence').addEventListener('click', populateSentence);

  // ===== Rhyming Game =====
  const rhymeTarget = document.getElementById('rhyme-target');
  const rhymeChoices = document.getElementById('rhyme-choices');
  const rhymeFeedback = document.getElementById('rhyme-feedback');
  const targetWord='cat';
  const options=['dog','hat','sun'];
  rhymeTarget.textContent = `Select a word that rhymes with "${targetWord}"`;
  options.forEach(opt=>{
    const btn=document.createElement('button'); btn.textContent=opt; btn.className='pool-btn';
    btn.addEventListener('click', ()=> rhymeFeedback.textContent = opt==='hat'?'✅ Correct!':'❌ Try again!');
    rhymeChoices.appendChild(btn);
  });

  // ===== Learning Path =====
  const pathNodes=document.getElementById('path-nodes');
  const pathStatus=document.getElementById('path-status');
  ['Letters','Word Builder','Sentence Builder','Rhymes'].forEach(n=>{
    const div=document.createElement('div'); div.textContent=n; div.className='path-node';
    pathNodes.appendChild(div);
  });
  pathStatus.textContent='You have completed 0 of 4 nodes.';

  // ===== Achievements =====
  const achList=document.getElementById('ach-list');
  ['First Letter','First Word','First Sentence'].forEach(a=>{
    const div=document.createElement('div'); div.textContent=a; div.className='ach-item';
    achList.appendChild(div);
  });

  function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }
});
