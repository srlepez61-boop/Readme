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
  const PATH_MAX = 10; // 🔧 cap path at 10 nodes

  const xpBar = document.getElementById("xp-bar-inner");
  const xpText = document.getElementById("xp-text");

  function updateXPUI() {
    if (!xpBar || !xpText) return;
    const clamped = Math.min(100, Math.max(0, xp)); // 🔧 ensure valid
    xpBar.style.width = clamped + "%";
    xpText.textContent = `${clamped} / 100`;
  }

  function addXP(amount = 5) {
    xp = Math.min(100, xp + amount);
    updateXPUI();
    renderAchievements();
  }

  function markLevelCompleted(levelNum) {
    // 🔧 clamp tracing & other game levels
    const clamped = Math.min(levelNum, PATH_MAX);
    if (clamped > maxLevelReached) {
      maxLevelReached = clamped;
      renderPathMap();
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
   * LETTERS A–Z
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
   * WORD BUILDER
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

  const wordCaption = document.getElementById("word-caption");
  const wordTarget = document.getElementById("word-target");
  const wordSlots = document.getElementById("word-slots");
  const wordPool = document.getElementById("word-pool");
  const wordFeedback = document.getElementById("word-feedback");
  const checkWordBtn = document.getElementById("check-word");

  function articleFor(word) {
    return /^[aeiou]/i.test(word) ? "an" : "a";
  }

  function showWordEmoji(word) {
    if (!wordCaption) return;
    const emoji = WORD_EMOJIS[word] || "⭐";
    const a = articleFor(word);
    const caption = `This is ${a} ${word.toLowerCase()}.`;
    wordCaption.innerHTML = `
      <div class="big-emoji">${emoji}</div>
      <div>${caption}</div>
    `;
  }

  function renderWordLevel() {
    if (!wordTarget || !wordSlots || !wordPool || !wordFeedback) return;

    const word = WORD_LEVELS[wordLevelIndex];
    wordTarget.textContent = `Build the word: ${word}`;
    wordSlots.innerHTML = "";
    wordPool.innerHTML = "";
    wordFeedback.textContent = "";
    showWordEmoji(word);

    // Create slots
    for (let i = 0; i < word.length; i++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      wordSlots.appendChild(slot);
    }

    // safer pool-size logic 🔧
    const baseLetters = word.split("");
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const maxPool = 6;
    const extraCount = Math.max(0, maxPool - baseLetters.length);

    const extras = alphabet
      .filter(c => !baseLetters.includes(c))
      .sort(() => Math.random() - 0.5)
      .slice(0, extraCount);

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

    // slot listeners
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

  // 🔧 Word pool listeners attached ONCE
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
        if (wordLevelIndex < WORD_LEVELS.length - 1) {
          wordLevelIndex++;
          renderWordLevel();
        }
      } else {
        wordFeedback.textContent = "❌ Try again!";
      }
    });
  }
document.getElementById("sentence-emoji").textContent = emoji;

  /* ---------------------------------------------------
   * SENTENCE BUILDER
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

  const sentSlots = document.getElementById("sentence-slots");
  const sentPool = document.getElementById("sentence-pool");
  const sentFeedback = document.getElementById("sentence-feedback");
  const checkSentBtn = document.getElementById("check-sentence");

  function renderSentenceLevel() {
    if (!sentSlots || !sentPool || !sentFeedback) return;
    const sentence = SENTENCE_LEVELS[sentLevelIndex];
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

  // 🔧 Sentence pool listeners attached ONCE
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
        if (sentLevelIndex < SENTENCE_LEVELS.length - 1) {
          sentLevelIndex++;
          renderSentenceLevel();
        }
      } else {
        sentFeedback.textContent = "❌ Not quite. Try again!";
      }
    });
  }

  /* ---------------------------------------------------
   * RHYMING GAME
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

  const rhymeTarget = document.getElementById("rhyme-target");
  const rhymeChoices = document.getElementById("rhyme-choices");
  const rhymeFeedback = document.getElementById("rhyme-feedback");

  function renderRhymeLevel() {
    if (!rhymeTarget || !rhymeChoices || !rhymeFeedback) return;
    const level = RHYME_LEVELS[rhymeLevelIndex];

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
          if (rhymeLevelIndex < RHYME_LEVELS.length - 1) {
            rhymeLevelIndex++;
            setTimeout(renderRhymeLevel, 900);
          }
        } else {
          rhymeFeedback.textContent = "❌ Try again!";
        }
      });
      rhymeChoices.appendChild(btn);
    });
  }

  /* ---------------------------------------------------
   * TRACING GAME
   * --------------------------------------------------- */
  const TRACING_CHARS = [
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ..."abcdefghijklmnopqrstuvwxyz"
  ];

  let traceIndex = 0;

  const traceLabel = document.getElementById("trace-label");
  const traceCanvas = document.getElementById("trace-canvas");
  const traceFeedback = document.getElementById("trace-feedback");
  const tracePrev = document.getElementById("trace-prev");
  const traceNext = document.getElementById("trace-next");

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

  function drawTraceGuide(char) {
    if (!traceCtx || !traceCanvas) return;
    clearTraceCanvas();
    const ctx = traceCtx;
    const w = traceCanvas.width;
    const h = traceCanvas.height;

    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.font = "260px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#999";
    ctx.fillText(char, w / 2, h / 2);
    ctx.restore();

    let alpha = 0;
    function step() {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#ff7f50";
      ctx.lineWidth = 10;
      ctx.font = "260px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(char, w / 2, h / 2);
      ctx.restore();
      alpha += 0.05;
      if (alpha <= 1) requestAnimationFrame(step);
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
    if (!isDrawing) return;
    isDrawing = false;
    if (!traceFeedback) return;
    if (drawnPoints > 40) {
      const char = TRACING_CHARS[traceIndex];
      traceFeedback.innerHTML = `
        <div class="big-emoji">⭐</div>
        <p>Nice tracing of <strong>${char}</strong>!</p>
      `;
      speak(`Great tracing of ${char}!`);
      addXP(7);

      // 🔧 clamped automatically by markLevelCompleted
      markLevelCompleted(traceIndex + 1);
    }
  }

  function getCanvasPos(evt) {
    if (!traceCanvas) return { x: 0, y: 0 };
    const rect = traceCanvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
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
    if (!traceLabel || !traceCanvas) return;
    const char = TRACING_CHARS[traceIndex];
    traceLabel.textContent = char;
    if (traceFeedback) traceFeedback.textContent = "";
    drawTraceGuide(char);
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
   * MATH GAME
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

  const mathProblem = document.getElementById("math-problem");
  const mathChoices = document.getElementById("math-choices");
  const mathFeedback = document.getElementById("math-feedback");

  function getMathAnswer(level) {
    return level.op === "+" ? level.a + level.b : level.a - level.b;
  }

  function renderMathLevel() {
    if (!mathProblem || !mathChoices || !mathFeedback) return;
    const level = MATH_LEVELS[mathIndex];
    const ans = getMathAnswer(level);

    mathProblem.textContent =
      `${level.emoji.repeat(level.a)} ${level.op} ${level.emoji.repeat(level.b)}  (${level.a} ${level.op} ${level.b} = ? )`;

    mathChoices.innerHTML = "";
    mathFeedback.textContent = "";

    const options = new Set([ans]);
    while (options.size < 3) {
      const delta = Math.floor(Math.random() * 3) + 1;
      const wrong = Math.random() < 0.5 ? ans - delta : ans + delta;
      if (wrong >= 0 && wrong <= 20) options.add(wrong);
    }
    const arr = Array.from(options).sort(() => Math.random() - 0.5);

    arr.forEach(val => {
      const btn = document.createElement("button");
      btn.textContent = val;
      btn.addEventListener("click", () => {
        if (val === ans) {
          mathFeedback.innerHTML = `
            <div class="big-emoji">${level.emoji}</div>
            <p>Great job!</p>
            <p>${level.a} ${level.op} ${level.b} = ${ans}</p>
          `;
          speak(
            `${level.a} ${level.op === "+" ? "plus" : "minus"} ${level.b} equals ${ans}.`
          );
          addXP(9);
          markLevelCompleted(mathIndex + 1);
          if (mathIndex < MATH_LEVELS.length - 1) {
            mathIndex++;
            setTimeout(renderMathLevel, 1000);
          }
        } else {
          mathFeedback.textContent = "❌ Not quite. Try again!";
        }
      });
      mathChoices.appendChild(btn);
    });
  }

  /* ---------------------------------------------------
   * LEARNING PATH
   * --------------------------------------------------- */
  const pathMap = document.getElementById("path-map");
  const pathStatus = document.getElementById("path-status");

  function renderPathMap() {
    if (!pathMap) return;
    pathMap.innerHTML = "";
    for (let i = 1; i <= PATH_MAX; i++) {
      const node = document.createElement("div");
      node.className = "path-node";
      if (i <= maxLevelReached) node.style.background = "#7dd37d";
      node.textContent = i;
      pathMap.appendChild(node);
    }
    if (pathStatus) {
      pathStatus.textContent = `Highest level reached so far: ${maxLevelReached} / ${PATH_MAX}`;
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
      card.className = "ach-card";
      if (!unlocked) card.style.opacity = "0.4";

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
  renderAchievements();
  updateXPUI();
});
