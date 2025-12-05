document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------------------------------------
   * NAVIGATION
   * --------------------------------------------------- */
  const screens = document.querySelectorAll(".screen");
  const menuButtons = document.querySelectorAll(".menu-btn");
  const backButtons = document.querySelectorAll(".nav-back");

  function showScreen(id) {
    screens.forEach(s => s.classList.add("hidden"));
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  }

  menuButtons.forEach(btn =>
    btn.addEventListener("click", () => showScreen(btn.dataset.screen))
  );
  backButtons.forEach(btn =>
    btn.addEventListener("click", () => showScreen("menu"))
  );

  showScreen("menu");

  /* ---------------------------------------------------
   * XP & PATH
   * --------------------------------------------------- */
  let xp = 0;
  let maxLevelReached = 1;

  const xpBar = document.getElementById("xp-bar-inner");
  const xpText = document.getElementById("xp-text");

  function updateXPUI() {
    if (!xpBar || !xpText) return;
    xpBar.style.width = xp + "%";
    xpText.textContent = `${xp} / 100`;
  }

  function addXP(amount = 5) {
    xp = Math.min(100, xp + amount);
    updateXPUI();
    renderAchievements();
  }

  function markLevelCompleted(levelNum) {
    if (levelNum > maxLevelReached) {
      maxLevelReached = levelNum;
      renderPathMap();
      renderPathDetail();
      renderAchievements();
    }
  }

  /* ---------------------------------------------------
   * SPEECH + SOUND
   * --------------------------------------------------- */
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.95;
    msg.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  }

  const dingSound = document.getElementById("ding-sound");
  function ding() {
    if (!dingSound) return;
    try {
      dingSound.currentTime = 0;
      dingSound.play().catch(() => {});
    } catch {}
  }

  /* ---------------------------------------------------
   * LETTERS GAME — FULL A–Z IN TWO ROWS
   * --------------------------------------------------- */
  const lettersBank = document.getElementById("letters-bank");
  const lettersDrop = document.getElementById("letters-drop");
  const lettersCaption = document.getElementById("letters-caption");

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const LETTER_DATA = {
    A: { word: "Apple", emoji: "🍎" },
    B: { word: "Ball", emoji: "🏀" },
    C: { word: "Cat", emoji: "🐱" },
    D: { word: "Dog", emoji: "🐶" },
    E: { word: "Elephant", emoji: "🐘" },
    F: { word: "Fish", emoji: "🐟" },
    G: { word: "Goat", emoji: "🐐" },
    H: { word: "Hat", emoji: "🎩" },
    I: { word: "Ice Cream", emoji: "🍦" },
    J: { word: "Jelly", emoji: "🍮" },
    K: { word: "Kite", emoji: "🪁" },
    L: { word: "Lion", emoji: "🦁" },
    M: { word: "Monkey", emoji: "🐒" },
    N: { word: "Nest", emoji: "🪺" },
    O: { word: "Octopus", emoji: "🐙" },
    P: { word: "Pig", emoji: "🐷" },
    Q: { word: "Queen", emoji: "👑" },
    R: { word: "Rabbit", emoji: "🐰" },
    S: { word: "Sun", emoji: "☀️" },
    T: { word: "Turtle", emoji: "🐢" },
    U: { word: "Umbrella", emoji: "☂️" },
    V: { word: "Violin", emoji: "🎻" },
    W: { word: "Whale", emoji: "🐋" },
    X: { word: "Xylophone", emoji: "🎼" },
    Y: { word: "Yak", emoji: "🐂" },
    Z: { word: "Zebra", emoji: "🦓" }
  };

  function renderAlphabet() {
    if (!lettersBank || !lettersDrop || !lettersCaption) return;
    lettersBank.innerHTML = "";
    lettersDrop.innerHTML = "Drop letters here";
    lettersCaption.innerHTML = "";

    ALPHABET.forEach(letter => {
      const tile = document.createElement("button");
      tile.className = "letter-tile";
      tile.textContent = letter;
      tile.dataset.letter = letter;
      tile.setAttribute("draggable", "true");

      tile.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", letter);
      });

      tile.addEventListener("click", () => {
        const info = LETTER_DATA[letter];
        if (!info) return;
        const sentence = `${letter} is for ${info.word}.`;
        speak(sentence);
        lettersCaption.innerHTML = `
          <div class="big-emoji">${info.emoji}</div>
          <p>${sentence}</p>
        `;
      });

      lettersBank.appendChild(tile);
    });
  }

  if (lettersDrop) {
    lettersDrop.addEventListener("dragover", e => {
      e.preventDefault();
      lettersDrop.classList.add("hover");
    });
    lettersDrop.addEventListener("dragleave", () => {
      lettersDrop.classList.remove("hover");
    });
    lettersDrop.addEventListener("drop", e => {
      e.preventDefault();
      lettersDrop.classList.remove("hover");
      const letter = e.dataTransfer.getData("text/plain");
      const tile = lettersBank.querySelector(`[data-letter="${letter}"]`);
      if (tile) {
        lettersDrop.appendChild(tile);
        ding();
        addXP(1);
      }
    });
  }

  /* ---------------------------------------------------
   * WORD BUILDER GAME
   * --------------------------------------------------- */
  const WORD_LEVELS = [
    "CAT", "DOG", "SUN", "FROG", "FISH",
    "BIRD", "TREE", "MILK", "CLOUD", "SNAKE"
  ];

  const WORD_EMOJIS = {
    CAT: "🐱",
    DOG: "🐶",
    SUN: "☀️",
    FROG: "🐸",
    FISH: "🐟",
    BIRD: "🐦",
    TREE: "🌳",
    MILK: "🥛",
    CLOUD: "☁️",
    SNAKE: "🐍"
  };

  let wordLevelIndex = 0;

  const wordLevelLabel = document.getElementById("word-level");
  const wordTarget = document.getElementById("word-target");
  const wordSlots = document.getElementById("word-slots");
  const wordPool = document.getElementById("word-pool");
  const wordFeedback = document.getElementById("word-feedback");
  const wordImgCaption = document.getElementById("word-img-caption");
  const checkWordBtn = document.getElementById("check-word");
  const wordPrev = document.getElementById("word-prev");
  const wordNext = document.getElementById("word-next");

  function articleFor(word) {
    return /^[aeiou]/i.test(word) ? "an" : "a";
  }

  function showWordPicture(word) {
    if (!wordImgCaption) return;
    const emoji = WORD_EMOJIS[word] || "⭐";
    const a = articleFor(word);
    const caption = `This is ${a} ${word.toLowerCase()}.`;
    wordImgCaption.innerHTML = `
      <div class="big-emoji">${emoji}</div>
      <div>${caption}</div>
    `;
  }

  function renderWordLevel() {
    if (!wordTarget || !wordSlots || !wordPool || !wordFeedback) return;
    const word = WORD_LEVELS[wordLevelIndex];
    wordLevelLabel.textContent = wordLevelIndex + 1;

    wordTarget.textContent = `Build the word: ${word}`;
    wordSlots.innerHTML = "";
    wordPool.innerHTML = "";
    wordFeedback.textContent = "";

    showWordPicture(word);

    // Slots
    for (let i = 0; i < word.length; i++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      wordSlots.appendChild(slot);
    }

    // Pool letters
    const baseLetters = word.split("");
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const extras = alphabet
      .filter(c => !baseLetters.includes(c))
      .sort(() => Math.random() - 0.5)
      .slice(0, 6 - baseLetters.length);

    const poolLetters = [...baseLetters, ...extras].sort(
      () => Math.random() - 0.5
    );

    poolLetters.forEach((ch, idx) => {
      const token = document.createElement("button");
      token.className = "token";
      token.textContent = ch;
      token.dataset.id = `w-${wordLevelIndex}-${idx}`;
      token.setAttribute("draggable", "true");

      token.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", token.dataset.id);
      });

      wordPool.appendChild(token);
    });

    wordSlots.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", e => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        const token = document.querySelector(`[data-id="${id}"]`);
        if (token) {
          slot.appendChild(token);
          ding();
        }
      });
    });
  }

  if (wordPool) {
    wordPool.addEventListener("dragover", e => e.preventDefault());
    wordPool.addEventListener("drop", e => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      const token = document.querySelector(`[data-id="${id}"]`);
      if (token) wordPool.appendChild(token);
    });
  }

  if (checkWordBtn) {
    checkWordBtn.addEventListener("click", () => {
      const word = WORD_LEVELS[wordLevelIndex];
      const built = Array.from(wordSlots.children)
        .map(slot => slot.querySelector(".token")?.textContent || "")
        .join("");

      if (built === word) {
        wordFeedback.textContent = "✅ Great job!";
        speak(word);
        addXP(8);
        markLevelCompleted(wordLevelIndex + 1);
      } else {
        wordFeedback.textContent = "❌ Try again!";
      }
    });
  }

  if (wordPrev) {
    wordPrev.addEventListener("click", () => {
      if (wordLevelIndex > 0) {
        wordLevelIndex--;
        renderWordLevel();
      }
    });
  }
  if (wordNext) {
    wordNext.addEventListener("click", () => {
      if (wordLevelIndex < WORD_LEVELS.length - 1) {
        wordLevelIndex++;
        renderWordLevel();
      }
    });
  }

  /* ---------------------------------------------------
   * SENTENCE BUILDER (with emoji reward)
   * --------------------------------------------------- */
  const SENTENCE_LEVELS = [
    "I see a cat",
    "The dog runs fast",
    "Bubba likes milk",
    "We play outside",
    "The sun is bright",
    "The frog can jump",
    "I read a book",
    "The fish can swim",
    "We go to school",
    "The bird can fly"
  ];

  const SENTENCE_EMOJI = {
    cat: "🐱",
    dog: "🐶",
    milk: "🥛",
    outside: "🌳",
    sun: "☀️",
    frog: "🐸",
    book: "📘",
    fish: "🐟",
    school: "🏫",
    bird: "🐦"
  };

  function getSentenceEmoji(sentence) {
    const words = sentence.toLowerCase().split(/\s+/);
    for (let w of words) {
      if (SENTENCE_EMOJI[w]) return SENTENCE_EMOJI[w];
    }
    return "⭐";
  }

  let sentLevelIndex = 0;

  const sentLevelLabel = document.getElementById("sent-level");
  const sentSlots = document.getElementById("sentence-slots");
  const sentPool = document.getElementById("sentence-pool");
  const sentFeedback = document.getElementById("sentence-feedback");
  const checkSentBtn = document.getElementById("check-sentence");
  const sentPrev = document.getElementById("sent-prev");
  const sentNext = document.getElementById("sent-next");

  function renderSentenceLevel() {
    if (!sentSlots || !sentPool || !sentFeedback) return;
    const sentence = SENTENCE_LEVELS[sentLevelIndex];
    const levelNum = sentLevelIndex + 1;
    sentLevelLabel.textContent = levelNum;

    const words = sentence.split(" ");
    sentSlots.innerHTML = "";
    sentPool.innerHTML = "";
    sentFeedback.innerHTML = "";

    words.forEach(() => {
      const slot = document.createElement("div");
      slot.className = "slot";
      sentSlots.appendChild(slot);
    });

    const shuffled = [...words].sort(() => Math.random() - 0.5);

    shuffled.forEach((word, idx) => {
      const token = document.createElement("button");
      token.className = "token";
      token.textContent = word;
      token.dataset.id = `s-${sentLevelIndex}-${idx}`;
      token.setAttribute("draggable", "true");

      token.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", token.dataset.id);
      });

      sentPool.appendChild(token);
    });

    sentSlots.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", e => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        const token = document.querySelector(`[data-id="${id}"]`);
        if (token) {
          slot.appendChild(token);
          ding();
        }
      });
    });
  }

  if (sentPool) {
    sentPool.addEventListener("dragover", e => e.preventDefault());
    sentPool.addEventListener("drop", e => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      const token = document.querySelector(`[data-id="${id}"]`);
      if (token) sentPool.appendChild(token);
    });
  }

  if (checkSentBtn) {
    checkSentBtn.addEventListener("click", () => {
      const sentence = SENTENCE_LEVELS[sentLevelIndex];
      const built = Array.from(sentSlots.children)
        .map(slot => slot.querySelector(".token")?.textContent || "")
        .join(" ");

      if (built === sentence) {
        const emoji = getSentenceEmoji(sentence);
        sentFeedback.innerHTML = `
          <div class="big-emoji">${emoji}</div>
          <p>Great job!</p>
          <p>"${sentence}"</p>
        `;
        speak(sentence);
        addXP(10);
        markLevelCompleted(sentLevelIndex + 1);
      } else {
        sentFeedback.textContent = "❌ Not quite. Try again!";
      }
    });
  }

  if (sentPrev) {
    sentPrev.addEventListener("click", () => {
      if (sentLevelIndex > 0) {
        sentLevelIndex--;
        renderSentenceLevel();
      }
    });
  }

  if (sentNext) {
    sentNext.addEventListener("click", () => {
      if (sentLevelIndex < SENTENCE_LEVELS.length - 1) {
        sentLevelIndex++;
        renderSentenceLevel();
      }
    });
  }

  /* ---------------------------------------------------
   * RHYMING GAME (with emoji reward)
   * --------------------------------------------------- */
  const RHYME_LEVELS = [
    { base: "cat",   correct: "hat",   others: ["dog", "bus"] },
    { base: "sun",   correct: "run",   others: ["cup", "fish"] },
    { base: "ball",  correct: "tall",  others: ["bed", "fox"] },
    { base: "tree",  correct: "bee",   others: ["hat", "pig"] },
    { base: "cake",  correct: "lake",  others: ["rock", "bug"] },
    { base: "book",  correct: "hook",  others: ["pen", "door"] },
    { base: "moon",  correct: "spoon", others: ["chair", "train"] },
    { base: "star",  correct: "car",   others: ["shoe", "lamp"] },
    { base: "chair", correct: "bear",  others: ["cup", "ring"] },
    { base: "mouse", correct: "house", others: ["ship", "lake"] }
  ];

  const RHYME_EMOJI = {
    cat: "🐱",
    hat: "🎩",
    dog: "🐶",
    bus: "🚌",
    sun: "☀️",
    run: "🏃",
    ball: "🏀",
    tall: "🧍",
    tree: "🌳",
    bee: "🐝",
    cake: "🎂",
    lake: "🏞️",
    book: "📘",
    hook: "🪝",
    moon: "🌙",
    spoon: "🥄",
    star: "⭐",
    car: "🚗",
    chair: "🪑",
    bear: "🐻",
    mouse: "🐭",
    house: "🏠"
  };

  let rhymeLevelIndex = 0;

  const rhymeLevelLabel = document.getElementById("rhyme-level");
  const rhymeTarget = document.getElementById("rhyme-target");
  const rhymeChoices = document.getElementById("rhyme-choices");
  const rhymeFeedback = document.getElementById("rhyme-feedback");
  const rhymePrev = document.getElementById("rhyme-prev");
  const rhymeNext = document.getElementById("rhyme-next");

  function renderRhymeLevel() {
    if (!rhymeTarget || !rhymeChoices || !rhymeFeedback) return;
    const level = RHYME_LEVELS[rhymeLevelIndex];
    const levelNum = rhymeLevelIndex + 1;
    rhymeLevelLabel.textContent = levelNum;

    rhymeChoices.innerHTML = "";
    rhymeFeedback.textContent = "";

    rhymeTarget.innerHTML = `
      Which word rhymes with 
      <span class="big-emoji">${RHYME_EMOJI[level.base] || ""}</span>
      <strong>${level.base}</strong>?
    `;

    const options = [level.correct, ...level.others].sort(
      () => Math.random() - 0.5
    );

    options.forEach(word => {
      const btn = document.createElement("button");
      btn.className = "token";
      btn.textContent = word;

      btn.addEventListener("click", () => {
        if (word === level.correct) {
          rhymeFeedback.innerHTML = `
            <div class="big-emoji">${RHYME_EMOJI[level.base] || ""}</div>
            <div class="big-emoji">${RHYME_EMOJI[word] || ""}</div>
            <p><strong>${level.base}</strong> rhymes with <strong>${word}</strong>!</p>
          `;
          speak(`${level.base} rhymes with ${word}.`);
          addXP(6);
          markLevelCompleted(rhymeLevelIndex + 1);
        } else {
          rhymeFeedback.textContent = "❌ Try again!";
        }
      });

      rhymeChoices.appendChild(btn);
    });
  }

  if (rhymePrev) {
    rhymePrev.addEventListener("click", () => {
      if (rhymeLevelIndex > 0) {
        rhymeLevelIndex--;
        renderRhymeLevel();
      }
    });
  }
  if (rhymeNext) {
    rhymeNext.addEventListener("click", () => {
      if (rhymeLevelIndex < RHYME_LEVELS.length - 1) {
        rhymeLevelIndex++;
        renderRhymeLevel();
      }
    });
  }

  /* ---------------------------------------------------
   * TRACING GAME (A–Z and a–z)
   * --------------------------------------------------- */
  const TRACING_CHARS = [
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ..."abcdefghijklmnopqrstuvwxyz"
  ];

  let traceIndex = 0;

  const traceLevelLabel = document.getElementById("trace-level");
  const traceCanvas = document.getElementById("trace-canvas");
  const traceFeedback = document.getElementById("trace-feedback");
  const tracePrev = document.getElementById("trace-prev");
  const traceNext = document.getElementById("trace-next");
  const traceClear = document.getElementById("trace-clear");
  const traceShow = document.getElementById("trace-show");
  const traceCheck = document.getElementById("trace-check");

  let traceCtx = traceCanvas ? traceCanvas.getContext("2d") : null;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let drawnPoints = 0;

  function clearTraceCanvas() {
    if (!traceCtx || !traceCanvas) return;
    traceCtx.clearRect(0, 0, traceCanvas.width, traceCanvas.height);
    drawnPoints = 0;
  }

  function drawGuideLetterAnimated(char) {
    if (!traceCtx || !traceCanvas) return;
    clearTraceCanvas();
    const ctx = traceCtx;
    const w = traceCanvas.width;
    const h = traceCanvas.height;

    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Light background letter
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.font = "200px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#999";
    ctx.fillText(char, w / 2, h / 2);
    ctx.restore();

    // Animated "stroke" effect (fade-in stronger outline)
    let alpha = 0;
    function step() {
      if (!traceCtx) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#ff7f50";
      ctx.lineWidth = 8;
      ctx.font = "200px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(char, w / 2, h / 2);
      ctx.restore();

      alpha += 0.06;
      if (alpha <= 1) {
        requestAnimationFrame(step);
      }
    }
    step();
  }

  function startDraw(x, y) {
    if (!traceCtx) return;
    isDrawing = true;
    lastX = x;
    lastY = y;
  }

  function continueDraw(x, y) {
    if (!isDrawing || !traceCtx) return;
    traceCtx.save();
    traceCtx.strokeStyle = "#2c7cf6";
    traceCtx.lineWidth = 5;
    traceCtx.lineCap = "round";
    traceCtx.beginPath();
    traceCtx.moveTo(lastX, lastY);
    traceCtx.lineTo(x, y);
    traceCtx.stroke();
    traceCtx.restore();
    lastX = x;
    lastY = y;
    drawnPoints++;
  }

  function endDraw() {
    isDrawing = false;
  }

  function getCanvasPos(evt) {
    if (!traceCanvas) return { x: 0, y: 0 };
    const rect = traceCanvas.getBoundingClientRect();
    return {
      x: ((evt.clientX || (evt.touches && evt.touches[0].clientX)) - rect.left),
      y: ((evt.clientY || (evt.touches && evt.touches[0].clientY)) - rect.top)
    };
  }

  if (traceCanvas) {
    traceCanvas.addEventListener("mousedown", e => {
      const { x, y } = getCanvasPos(e);
      startDraw(x, y);
    });
    traceCanvas.addEventListener("mousemove", e => {
      const { x, y } = getCanvasPos(e);
      continueDraw(x, y);
    });
    traceCanvas.addEventListener("mouseup", endDraw);
    traceCanvas.addEventListener("mouseleave", endDraw);

    traceCanvas.addEventListener("touchstart", e => {
      e.preventDefault();
      const { x, y } = getCanvasPos(e);
      startDraw(x, y);
    }, { passive: false });

    traceCanvas.addEventListener("touchmove", e => {
      e.preventDefault();
      const { x, y } = getCanvasPos(e);
      continueDraw(x, y);
    }, { passive: false });

    traceCanvas.addEventListener("touchend", e => {
      e.preventDefault();
      endDraw();
    }, { passive: false });
  }

  function renderTracingLevel() {
    if (!traceLevelLabel || !traceFeedback) return;
    const total = TRACING_CHARS.length;
    traceLevelLabel.textContent = `${traceIndex + 1} / ${total}`;
    traceFeedback.textContent = "";

    const char = TRACING_CHARS[traceIndex];
    drawGuideLetterAnimated(char);
  }

  if (traceClear) {
    traceClear.addEventListener("click", () => {
      clearTraceCanvas();
      const char = TRACING_CHARS[traceIndex];
      drawGuideLetterAnimated(char);
      if (traceFeedback) traceFeedback.textContent = "";
    });
  }

  if (traceShow) {
    traceShow.addEventListener("click", () => {
      const char = TRACING_CHARS[traceIndex];
      drawGuideLetterAnimated(char);
    });
  }

  if (traceCheck) {
    traceCheck.addEventListener("click", () => {
      if (!traceFeedback) return;
      if (drawnPoints > 20) {
        const char = TRACING_CHARS[traceIndex];
        traceFeedback.innerHTML = `
          <div class="big-emoji">⭐</div>
          <p>Nice tracing of <strong>${char}</strong>!</p>
        `;
        speak(`Great tracing of ${char}!`);
        addXP(7);
        markLevelCompleted(traceIndex + 1);
      } else {
        traceFeedback.textContent = "Try tracing on the letter!";
      }
    });
  }

  if (tracePrev) {
    tracePrev.addEventListener("click", () => {
      if (traceIndex > 0) {
        traceIndex--;
        clearTraceCanvas();
        renderTracingLevel();
      }
    });
  }
  if (traceNext) {
    traceNext.addEventListener("click", () => {
      if (traceIndex < TRACING_CHARS.length - 1) {
        traceIndex++;
        clearTraceCanvas();
        renderTracingLevel();
      }
    });
  }

  /* ---------------------------------------------------
   * MATH GAME (addition & subtraction, emoji + numbers)
   * --------------------------------------------------- */
  const MATH_LEVELS = [
    { a: 1, b: 2, op: "+", emoji: "🍎" },
    { a: 3, b: 1, op: "+", emoji: "🐟" },
    { a: 4, b: 2, op: "-", emoji: "🍪" },
    { a: 2, b: 2, op: "+", emoji: "⭐" },
    { a: 5, b: 3, op: "-", emoji: "🍇" },
    { a: 3, b: 3, op: "+", emoji: "🐰" },
    { a: 6, b: 1, op: "-", emoji: "🍓" },
    { a: 4, b: 4, op: "+", emoji: "🦴" },
    { a: 7, b: 2, op: "-", emoji: "🌟" },
    { a: 5, b: 5, op: "+", emoji: "🐤" }
  ];

  let mathIndex = 0;

  const mathLevelLabel = document.getElementById("math-level");
  const mathProblem = document.getElementById("math-problem");
  const mathEmojiRow = document.getElementById("math-emoji-row");
  const mathChoices = document.getElementById("math-choices");
  const mathFeedback = document.getElementById("math-feedback");
  const mathPrev = document.getElementById("math-prev");
  const mathNext = document.getElementById("math-next");

  function getMathAnswer(level) {
    return level.op === "+"
      ? level.a + level.b
      : level.a - level.b;
  }

  function renderMathLevel() {
    if (!mathProblem || !mathEmojiRow || !mathChoices || !mathFeedback) return;

    const level = MATH_LEVELS[mathIndex];
    const ans = getMathAnswer(level);
    const totalLevels = MATH_LEVELS.length;

    if (mathLevelLabel) {
      mathLevelLabel.textContent = `${mathIndex + 1} / ${totalLevels}`;
    }

    // Emoji row
    mathEmojiRow.innerHTML = "";
    for (let i = 0; i < level.a; i++) {
      mathEmojiRow.textContent += level.emoji;
    }
    mathEmojiRow.textContent += `  ${level.op}  `;
    for (let i = 0; i < level.b; i++) {
      mathEmojiRow.textContent += level.emoji;
    }

    // Numeric part
    mathProblem.textContent = `${level.a} ${level.op} ${level.b} = ?`;
    mathChoices.innerHTML = "";
    mathFeedback.textContent = "";

    // generate 3 options: 1 correct, 2 wrong
    const options = new Set([ans]);
    while (options.size < 3) {
      const delta = Math.floor(Math.random() * 3) + 1;
      const wrong = Math.random() < 0.5 ? ans - delta : ans + delta;
      if (wrong >= 0 && wrong <= 20) options.add(wrong);
    }
    const optionArr = Array.from(options).sort(() => Math.random() - 0.5);

    optionArr.forEach(value => {
      const btn = document.createElement("button");
      btn.className = "token";
      btn.textContent = value;

      btn.addEventListener("click", () => {
        if (value === ans) {
          mathFeedback.innerHTML = `
            <div class="big-emoji">${level.emoji}</div>
            <p>Great job!</p>
            <p>${level.a} ${level.op} ${level.b} = ${ans}</p>
          `;
          speak(`${level.a} ${level.op === "+" ? "plus" : "minus"} ${level.b} equals ${ans}.`);
          addXP(9);
          markLevelCompleted(mathIndex + 1);
        } else {
          mathFeedback.textContent = "❌ Not quite. Try again!";
        }
      });

      mathChoices.appendChild(btn);
    });
  }

  if (mathPrev) {
    mathPrev.addEventListener("click", () => {
      if (mathIndex > 0) {
        mathIndex--;
        renderMathLevel();
      }
    });
  }

  if (mathNext) {
    mathNext.addEventListener("click", () => {
      if (mathIndex < MATH_LEVELS.length - 1) {
        mathIndex++;
        renderMathLevel();
      }
    });
  }

  /* ---------------------------------------------------
   * LEARNING PATH
   * --------------------------------------------------- */
  const pathMap = document.getElementById("path-map");
  const pathDetail = document.getElementById("path-detail");
  const pathStatus = document.getElementById("path-status");

  function renderPath(container) {
    if (!container) return;
    container.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
      const node = document.createElement("div");
      node.className = "path-node";
      node.textContent = i;
      if (i <= maxLevelReached) node.classList.add("done");
      if (i === maxLevelReached) node.classList.add("current");
      container.appendChild(node);
    }
  }

  function renderPathMap() { renderPath(pathMap); }
  function renderPathDetail() {
    renderPath(pathDetail);
    if (pathStatus) {
      pathStatus.textContent = `Highest level reached: ${maxLevelReached} / 10`;
    }
  }

  /* ---------------------------------------------------
   * ACHIEVEMENTS
   * --------------------------------------------------- */
  const achList = document.getElementById("ach-list");

  const ACH_CONFIG = [
    { id: "first-xp", label: "First XP", xp: 5, icon: "⭐" },
    { id: "half-xp", label: "Halfway Hero (50 XP)", xp: 50, icon: "🌟" },
    { id: "full-xp", label: "XP Master (100 XP)", xp: 100, icon: "🏆" },
    { id: "path-3", label: "Path Explorer (Level 3)", level: 3, icon: "🗺️" },
    { id: "path-7", label: "Big Adventurer (Level 7)", level: 7, icon: "🚀" },
    { id: "path-10", label: "Path Champion (Level 10)", level: 10, icon: "👑" }
  ];

  function renderAchievements() {
    if (!achList) return;
    achList.innerHTML = "";
    ACH_CONFIG.forEach(a => {
      const unlocked =
        (a.xp && xp >= a.xp) ||
        (a.level && maxLevelReached >= a.level);

      const card = document.createElement("div");
      card.className = "ach-card" + (unlocked ? "" : " locked");

      const icon = document.createElement("div");
      icon.className = "ach-icon";
      icon.textContent = a.icon;

      const text = document.createElement("div");
      text.innerHTML = `<strong>${a.label}</strong><br/>${
        a.xp ? `${a.xp} XP` : `Reach level ${a.level}`
      }`;

      card.appendChild(icon);
      card.appendChild(text);
      achList.appendChild(card);
    });
  }

  /* ---------------------------------------------------
   * INITIAL RENDER
   * --------------------------------------------------- */
  renderAlphabet();
  renderWordLevel();
  renderSentenceLevel();
  renderRhymeLevel();
  renderTracingLevel();
  renderMathLevel();
  renderPathMap();
  renderPathDetail();
  renderAchievements();
  updateXPUI();
});
