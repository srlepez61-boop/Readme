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

    // create slots
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
      const chip = document.createElement('button');
      chip.className = 'letter-chip';
      chip.type = 'button';
      chip.textContent = l.toUpperCase();
      chip.dataset.used = 'false';
      chip.addEventListener('click', () => {
        if (chip.dataset.used === 'true') return;
        placeLetter(chip);
        enableAudio();
        speak(l);
      });
      poolEl.appendChild(chip);
    });
  }

  // ---------------- PLACE LETTER ----------------
  function placeLetter(chip, specificSlot = null) {
    const slot = specificSlot || Array.from(slotsEl.children).find(s => !s.textContent);
    if (!slot) return;
    slot.textContent = chip.textContent;
    slot.classList.add('filled');
    chip.dataset.used = 'true';
    chip.disabled = true;
  }

  function placeLetterByKey(letter) {
    const chip = Array.from(poolEl.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'false');
    if (chip) placeLetter(chip);
  }

  // ---------------- KEYBOARD ----------------
  document.addEventListener('keydown', (e) => {
    if (!currentWord) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      const filled = Array.from(slotsEl.children).filter(s => s.textContent);
      if (!filled.length) return;
      const last = filled[filled.length - 1];
      const letter = last.textContent;
      last.textContent = '';
      last.classList.remove('filled');
      const chip = Array.from(poolEl.children).find(c => c.textContent === letter && c.dataset.used === 'true');
      if (chip) { chip.dataset.used = 'false'; chip.disabled = false; }
      return;
    }
    if (/^[a-zA-Z]$/.test(e.key)) placeLetterByKey(e.key);
  });

  // ---------------- CHECK ----------------
  checkBtn.addEventListener('click', () => {
    const built = Array.from(slotsEl.children).map(s => s.textContent || '').join('').toLowerCase();
    if (built === currentWord.word) {
      msgEl.textContent = '🎉 Correct!';
      speak(currentWord.word);
      levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);
      setTimeout(() => {
        if (levels[currentLevel].length === 0) {
          currentLevel++;
          if (currentLevel >= levels.length) {
            msgEl.textContent = '🏆 All levels complete!';
            return;
          }
        }
        pickWord();
      }, 800);
    } else {
      msgEl.textContent = 'Try again!';
    }
  });

  // ---------------- SHUFFLE ----------------
  shuffleBtn.addEventListener('click', () => {
    const letters = Array.from(poolEl.children).map(c => c.textContent);
    poolEl.innerHTML = '';
    shuffle(letters).forEach(l => {
      const chip = document.createElement('button');
      chip.className = 'letter-chip';
      chip.type = 'button';
      chip.textContent = l;
      chip.dataset.used = 'false';
      chip.addEventListener('click', () => {
        if (chip.dataset.used === 'true') return;
        placeLetter(chip);
        speak(l);
      });
      poolEl.appendChild(chip);
    });
  });

  // ---------------- HINT ----------------
  hintBtn.addEventListener('click', () => {
    const emptySlots = Array.from(slotsEl.children).filter(s => !s.textContent);
    if (!emptySlots.length) return;
    const idx = Array.from(slotsEl.children).indexOf(emptySlots[0]);
    const correctLetter = currentWord.word[idx];
    placeLetterByKey(correctLetter);
  });

  pickWord();
});
