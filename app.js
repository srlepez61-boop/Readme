// app.js - Clean Build-a-Word (fixed)
// Replace existing app.js with this file. Assumes index.html contains:
// .letter-grid, #slots, #letters-pool, #check-btn, #msg, #pic, #shuffle-btn, #hint-btn

document.addEventListener('DOMContentLoaded', () => {
  // ---------- CONFIG / DATA ----------
  const levels = [
    [{ word: 'cat', pic: '🐱' }, { word: 'dog', pic: '🐶' }, { word: 'sun', pic: '☀️' }],
    [{ word: 'fish', pic: '🐟' }, { word: 'book', pic: '📖' }, { word: 'star', pic: '⭐' }]
  ];

  const sightWords = ["the","and","you","that","was","for","are","with","his","they"];

  // ---------- STATE ----------
  let currentLevel = 0;
  let currentWord = null;
  let voices = [];
  let audioEnabled = false; // required gesture on iOS
  let cardIndex = 0;

  // ---------- ELEMENTS ----------
  const letterGrid = document.querySelector('.letter-grid');
  const slotsEl = document.getElementById('slots');
  const poolEl = document.getElementById('letters-pool');
  const checkBtn = document.getElementById('check-btn');
  const msgEl = document.getElementById('msg');
  const picEl = document.getElementById('pic');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const hintBtn = document.getElementById('hint-btn');

  if (!letterGrid || !slotsEl || !poolEl || !checkBtn || !msgEl || !picEl) {
    console.error('app.js: required DOM elements missing. Make sure your index.html has .letter-grid, #slots, #letters-pool, #check-btn, #msg, #pic');
    return;
  }

  // ---------- UTIL ----------
  function shuffleArray(a) {
    const arr = [...a];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ---------- VOICES / SPEECH ----------
  function loadVoices() {
    voices = speechSynthesis.getVoices();
  }
  speechSynthesis.onvoiceschanged = loadVoices;
  setTimeout(loadVoices, 200);

  function enableAudioGesture() {
    if (audioEnabled) return;
    audioEnabled = true;
    // warm up speech engine with a short silent utterance (some iOS need a gesture)
    try {
      const u = new SpeechSynthesisUtterance('');
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  function speak(text) {
    if (!audioEnabled) return; // require gesture on mobile
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    if (voices[0]) u.voice = voices[0];
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  // enable audio on first user click/tap anywhere
  document.body.addEventListener('pointerdown', enableAudioGesture, { once: true });

  // ---------- TWEMOJI (emoji images) ----------
  function setEmoji(emoji) {
    picEl.alt = emoji || '';
    if (!emoji) { picEl.src = ''; return; }
    try {
      const codepoints = Array.from(emoji).map(c => c.codePointAt(0).toString(16)).join('-');
      picEl.src = `https://twemoji.maxcdn.com/v/latest/72x72/${codepoints}.png`;
    } catch (err) {
      picEl.src = '';
      console.warn('Twemoji load failed for', emoji);
    }
  }

  // ---------- PICK WORD ----------
  function pickWord() {
    const words = levels[currentLevel];
    if (!words || words.length === 0) {
      msgEl.textContent = 'No more words in this level.';
      return;
    }

    currentWord = words[Math.floor(Math.random() * words.length)];
    msgEl.textContent = '';
    setEmoji(currentWord.pic);

    // clear slots + pool
    slotsEl.innerHTML = '';
    poolEl.innerHTML = '';

    // create slots (one per letter) with click-to-clear
    currentWord.word.split('').forEach((ch, idx) => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.pos = idx;
      slot.addEventListener('click', () => {
        if (!slot.textContent) return;
        // remove letter from slot and re-enable chip
        const letter = slot.textContent;
        slot.textContent = '';
        slot.classList.remove('filled');

        const chip = Array.from(poolEl.children).find(c => c.textContent === letter && c.dataset.used === 'true');
        if (chip) {
          chip.dataset.used = 'false';
          chip.disabled = false;
        }
      });
      // drag/drop on slots set up after chips are created
      slotsEl.appendChild(slot);
    });

    // create shuffled chips for pool
    const scrambled = shuffleArray([...currentWord.word]);
    scrambled.forEach(l => {
      const chip = document.createElement('button');
      chip.className = 'letter-chip';
      chip.type = 'button';
      chip.textContent = l.toUpperCase();
      chip.dataset.used = 'false';
      chip.addEventListener('click', () => {
        if (chip.dataset.used === 'true') return;
        placeSpecificChip(chip);
        enableAudioGesture(); // first touch enables speech
        speak(l);
      });

      // drag support
      chip.draggable = true;
      chip.addEventListener('dragstart', ev => ev.dataTransfer.setData('text/plain', chip.textContent));

      poolEl.appendChild(chip);
    });

    // enable slots to accept drops
    Array.from(slotsEl.children).forEach(slot => {
      slot.addEventListener('dragover', e => e.preventDefault());
      slot.addEventListener('drop', e => {
        e.preventDefault();
        const letter = e.dataTransfer.getData('text/plain');
        if (!letter) return;
        if (slot.textContent) return; // prevent overwriting
        const chip = Array.from(poolEl.children).find(c => c.textContent === letter && c.dataset.used === 'false');
        if (!chip) return;
        slot.textContent = chip.textContent;
        slot.classList.add('filled');
        chip.dataset.used = 'true';
        chip.disabled = true;
      });
    });
  }

  // ---------- PLACE / REMOVE letters ----------
  function placeSpecificChip(chip) {
    const emptySlot = Array.from(slotsEl.children).find(s => !s.textContent);
    if (!emptySlot) return;
    emptySlot.textContent = chip.textContent;
    emptySlot.classList.add('filled');
    chip.dataset.used = 'true';
    chip.disabled = true;
  }

  function placeLetterFromPool(letter) {
    const chip = Array.from(poolEl.children).find(c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === 'false');
    if (!chip) return;
    placeSpecificChip(chip);
  }

  // ---------- KEYBOARD & BACKSPACE ----------
  document.addEventListener('keydown', (e) => {
    if (!currentWord) return;
    // Backspace: remove last filled slot
    if (e.key === 'Backspace') {
      e.preventDefault();
      const filled = Array.from(slotsEl.children).filter(s => s.textContent);
      if (filled.length === 0) return;
      const last = filled[filled.length - 1];
      const letter = last.textContent;
      last.textContent = '';
      last.classList.remove('filled');

      const chip = Array.from(poolEl.children).find(c => c.textContent === letter && c.dataset.used === 'true');
      if (chip) {
        chip.dataset.used = 'false';
        chip.disabled = false;
      }
      return;
    }

    // Letters
    if (/^[a-zA-Z]$/.test(e.key)) {
      placeLetterFromPool(e.key);
    }
  });

  // ---------- CHECK & AUTO-ADVANCE ----------
  checkBtn.addEventListener('click', checkAndAdvance);

  function checkAndAdvance() {
    if (!currentWord) return;
    const built = Array.from(slotsEl.children).map(s => s.textContent || '').join('').toLowerCase();
    if (built === currentWord.word) {
      msgEl.textContent = '🎉 Correct!';
      enableAudioGesture();
      speak(currentWord.word);

      // remove word from level so user doesn't get same again
      levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);

      setTimeout(() => {
        // if level empty, advance
        if (levels[currentLevel].length === 0) {
          currentLevel++;
          if (currentLevel >= levels.length) {
            msgEl.textContent = '🏆 All levels complete!';
            return;
          } else {
            msgEl.textContent = `🎉 Level ${currentLevel + 1}!`;
          }
        }
        pickWord();
      }, 800);
    } else {
      msgEl.textContent = 'Try again!';
    }
  }

  // ---------- SHUFFLE ----------
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      if (!currentWord) return;
      // re-create pool shuffled from remaining letters (including already used ones)
      const letters = Array.from(poolEl.children).map(c => c.textContent);
      const shuffled = shuffleArray(letters);
      poolEl.innerHTML = '';
      shuffled.forEach(l => {
        const chip = document.createElement('button');
        chip.className = 'letter-chip';
        chip.type = 'button';
        chip.textContent = l;
        chip.dataset.used = 'false';
        chip.addEventListener('click', () => {
          if (chip.dataset.used === 'true') return;
          placeSpecificChip(chip);
          enableAudioGesture();
          speak(l);
        });
        chip.draggable = true;
        chip.addEventListener('dragstart', ev => ev.dataTransfer.setData('text/plain', chip.textContent));
        poolEl.appendChild(chip);
      });
    });
  }

  // ---------- HINT ----------
  if (hintBtn) {
    hintBtn.addEventListener('click', () => {
      if (!currentWord) return;
      const emptySlots = Array.from(slotsEl.children).filter(s => !s.textContent);
      if (emptySlots.length === 0) return;
      // pick first empty slot's correct letter
      const idx = Array.from(slotsEl.children).indexOf(emptySlots[0]);
      const correctLetter = currentWord.word[idx];
      placeLetterFromPool(correctLetter);
    });
  }

  // ---------- INIT ----------
  pickWord();

  // Expose small debug helpers in console if needed:
  window._game = { pickWord, levels };
});
