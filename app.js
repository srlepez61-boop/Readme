// app.js - Build-a-Word + shuffle + hint + emoji

document.addEventListener('DOMContentLoaded', () => {

  const levels = [
    [{ word: 'cat', pic: '🐱' }, { word: 'dog', pic: '🐶' }, { word: 'sun', pic: '☀️' }],
    [{ word: 'fish', pic: '🐟' }, { word: 'book', pic: '📖' }, { word: 'star', pic: '⭐' }]
  ];

  let currentLevel = 0;
  let currentWord = null;
  let audioEnabled = false;

  const letterGrid = document.querySelector('.letter-grid');
  const slotsEl = document.getElementById('slots');
  const poolEl = document.getElementById('letters-pool');
  const checkBtn = document.getElementById('check-btn');
  const msgEl = document.getElementById('msg');
  const picEl = document.getElementById('pic');

  const shuffleBtn = document.createElement('button');
  shuffleBtn.textContent = '🔀 Shuffle';
  shuffleBtn.id = 'shuffle-btn';
  shuffleBtn.style.margin = '0.5rem';
  poolEl.parentNode.insertBefore(shuffleBtn, poolEl);

  const hintBtn = document.createElement('button');
  hintBtn.textContent = '💡 Hint';
  hintBtn.id = 'hint-btn';
  hintBtn.style.margin = '0.5rem';
  poolEl.parentNode.insertBefore(hintBtn, poolEl);

  // ---------------- UTILS ----------------
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  const enableAudio = () => {
    if (!audioEnabled) {
      audioEnabled = true;
      try { speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch {}
    }
  };

  const speak = (text) => {
    if (!audioEnabled || !text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  };

  document.body.addEventListener('pointerdown', enableAudio, { once: true });

  const setEmoji = (emoji) => {
    picEl.alt = emoji;
    if (!emoji) { picEl.src = ''; return; }
    try {
      const codepoints = Array.from(emoji).map(c => c.codePointAt(0).toString(16)).join('-');
      picEl.src = `https://twemoji.maxcdn.com/v/latest/72x72/${codepoints}.png`;
    } catch { picEl.src = ''; }
  };

  // ---------------- PICK WORD ----------------
  function pickWord() {
    if (!levels[currentLevel] || levels[currentLevel].length === 0) {
      msgEl.textContent = 'No more words in this level.';
      return;
    }

    currentWord = levels[currentLevel][Math.floor(Math.random() * levels[currentLevel].length)];
    setEmoji(currentWord.pic);
    msgEl.textContent = '';
    slotsEl.innerHTML = '';
    poolEl.innerHTML = '';

    currentWord.word.split('').forEach(() => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.addEventListener('click', () => {
        if (!slot.textContent) return;
        const letter = slot.textContent;
        slot.textContent = '';
        slot.classList.remove('filled');
        const chip = Array.from(poolEl.children).find(c => c.textContent === letter && c.dataset.used === 'true');
        if (chip) { chip.dataset.used = 'false'; chip.disabled = false; }
      });
      slotsEl.appendChild(slot);
    });

    createLetterChips();
  }

  // ---------------- CREATE LETTER CHIPS ----------------
  function createLetterChips() {
    const letters = shuffle([...currentWord.word]);
    letters.forEach(l => {
      const chip = document.creat
