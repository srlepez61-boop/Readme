// ---------- DATA ----------
const levels = [
  [{ word: 'cat', pic: '🐱' }, { word: 'dog', pic: '🐶' }, { word: 'sun', pic: '☀️' }],
  [{ word: 'fish', pic: '🐟' }, { word: 'book', pic: '📖' }, { word: 'star', pic: '⭐' }]
];

const sightWords = ["the", "and", "you", "that", "was", "for", "are", "with", "his", "they"];

// ---------- STATE ----------
let currentLevel = 0;
let currentWord = null;
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

// ---------- LETTER GRID ----------
const letters = 'abcdefghijklmnopqrstuvwxyz';
letters.split('').forEach(l => {
  const btn = document.createElement('button');
  btn.textContent = l.toUpperCase();
  btn.addEventListener('click', () => speak(l));
  letterGrid.appendChild(btn);
});

// ---------- SPEECH ----------
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utter);
}

// ---------- PICK WORD ----------
function pickWord() {
  const levelWords = levels[currentLevel];
  if (!levelWords || levelWords.length === 0) return;
  currentWord = levelWords[Math.floor(Math.random() * levelWords.length)];
  pic.src = '';
  pic.alt = currentWord.word;
  slotsEl.innerHTML = '';
  poolEl.innerHTML = '';
  msg.textContent = '';

  // Slots
  currentWord.word.split('').forEach(() => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slotsEl.appendChild(slot);
  });

  // Pool
  const lettersShuffled = currentWord.word.split('').sort(() => Math.random() - 0.5);
  lettersShuffled.forEach(l => {
    const chip = document.createElement('div');
    chip.className = 'letter-chip';
    chip.textContent = l.toUpperCase();
    chip.addEventListener('click', () => selectChip(chip));
    poolEl.appendChild(chip);
  });
}

// ---------- SELECT CHIP ----------
function selectChip(chip) {
  const emptySlot = Array.from(slotsEl.children).find(s => !s.textContent);
  if (!emptySlot) return;
  emptySlot.textContent = chip.textContent;
  chip.style.opacity = 0.5;
  speak(chip.textContent);
}

// ---------- CHECK ----------
checkBtn.addEventListener('click', () => {
  const built = Array.from(slotsEl.children).map(s => s.textContent).join('').toLowerCase();
  if (built === currentWord.word) {
    msg.textContent = '✅ Correct!';
    pickWord();
  } else {
    msg.textContent = '❌ Try again!';
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
