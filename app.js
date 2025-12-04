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

// ---------- UTIL ----------
function shuffleArray(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- VOICES ----------
function loadVoices() {
  voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
}
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speak(text) {
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  if (voices[0]) utter.voice = voices[0];
  utter.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// ---------- LETTER GRID ----------
(function initLetterGrid() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  letterGrid.innerHTML = '';
  [...letters].forEach(l => {
    const btn = document.createElement('button');
    btn.textContent = l.toUpperCase();
    btn.addEventListener('click', () => {
      speak(l);
      placeLetterFromPool(l);
    });
    letterGrid.appendChild(btn);
  });
})();

// ---------- WORD BUILDER ----------
function setEmojiImage(emoji) {
  pic.src = '';
  pic.alt = emoji;
  try {
    const codepoints = Array.from(emoji).map(c => c.codePointAt(0).toString(16));
    pic.src = `https://twemoji.maxcdn.com/v/latest/72x72/${codepoints.join('-')}.png`;
  } catch {}
}

function pickWord() {
  const levelWords = levels[currentLevel];
  if (!levelWords || levelWords.length === 0) {
    msg.textContent = 'No more words in this level.';
    return;
  }
  currentWord = levelWords[Math.floor(Math.random() * levelWords.length)];
  setEmojiImage(currentWord.pic);
  slotsEl.innerHTML = '';
  poolEl.innerHTML = '';
  msg.textContent = `Level ${currentLevel + 1}`;

  // create slots
  currentWord.word.split('').forEach(() => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slotsEl.appendChild(slot);
  });

  // letter pool
  const lettersShuffled = shuffleArray([...currentWord.word]);
  lettersShuffled.forEach(l => {
    const chip = document.createElement('div');
    chip.className = 'letter-chip';
    chip.textContent = l.toUpperCase();
    chip.dataset.used = 'false';
    chip.addEventListener('click', () => selectChip(chip));
    poolEl.appendChild(chip);
  });
}

function selectChip(chip) {
  if (chip.dataset.used === 'true') return;
  const emptySlot = Array.from(slotsEl.children).find(s => !s.textContent);
  if (!emptySlot) return;
  emptySlot.textContent = chip.textContent;
  chip.dataset.used = 'true';
  chip.style.opacity = 0.5;
  speak(chip.textContent);
}

function placeLetterFromPool(letter) {
  const poolLetters = Array.from(poolEl.children)
    .filter(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'false');
  if (poolLetters.length === 0) return;
  selectChip(poolLetters[0]);
}

// ---------- CHECK ----------
checkBtn.addEventListener('click', () => {
  const built = Array.from(slotsEl.children).map(s => s.textContent || '').join('').toLowerCase();
  if (built === currentWord.word) {
    msg.textContent = '🎉 Correct!';
    speak(currentWord.word);
    levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);
    setTimeout(() => {
      if (levels[currentLevel].length === 0) {
        currentLevel++;
        if (currentLevel >= levels.length) {
          msg.textContent = '🏆 You completed all levels!';
          return;
        }
      }
      pickWord();
    }, 800);
  } else {
    msg.textContent = 'Try again!';
  }
});

// ---------- FLASHCARDS ----------
nextCardBtn.addEventListener('click', () => {
  cardIndex = (cardIndex + 1) % sightWords.length;
  card.textContent = sightWords[cardIndex];
  speak(card.textContent);
});
card.addEventListener('click', () => speak(card.textContent));

// ---------- INIT ----------
pickWord();
