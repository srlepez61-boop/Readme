document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------------------------------------
   * NAVIGATION
   * --------------------------------------------------- */
  const screens = document.querySelectorAll(".screen");
  const menuButtons = document.querySelectorAll(".menu-btn");
  const backButtons = document.querySelectorAll(".nav-back");

  function showScreen(id) {
    screens.forEach(s => s.classList.add("hidden"));
    document.getElementById(id)?.classList.remove("hidden");
  }

  menuButtons.forEach(btn =>
    btn.addEventListener("click", () => showScreen(btn.dataset.screen))
  );
  backButtons.forEach(btn =>
    btn.addEventListener("click", () => showScreen("menu"))
  );

  showScreen("menu");

  /* ---------------------------------------------------
   * XP & PATH PROGRESSION
   * --------------------------------------------------- */
  let xp = 0;              // 0–100
  let maxLevelReached = 1; // 1–10

  const xpBar = document.getElementById("xp-bar-inner");
  const xpText = document.getElementById("xp-text");

  function updateXPUI() {
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
   * SPEECH + DING
   * --------------------------------------------------- */
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.9;
    msg.pitch = 1.1;
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
   * DATA
   * --------------------------------------------------- */

  // Letters grouped into 10 levels
  const LETTER_LEVELS = [
    ["A", "B", "C"],
    ["D", "E", "F"],
    ["G", "H", "I"],
    ["J", "K", "L"],
    ["M", "N", "O"],
    ["P", "Q", "R"],
    ["S", "T", "U"],
    ["V", "W"],
    ["X", "Y"],
    ["Z"]
  ];

  // LETTERS now use emojis instead of images
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
    Q: { word: "Queen", emoji: "👸" },
    R: { word: "Rabbit", emoji: "🐰" },
    S: { word: "Sun", emoji: "☀️" },
    T: { word: "Turtle", emoji: "🐢" },
    U: { word: "Umbrella", emoji: "☂️" },
    V: { word: "Violin", emoji: "🎻" },
    W: { word: "Whale", emoji: "🐋" },
    X: { word: "Xylophone", emoji: "🎼" },
    Y: { word: "Yak", emoji: "🐃" },
    Z: { word: "Zebra", emoji: "🦓" }
  };

  const WORD_LEVELS = [
    "CAT","DOG","SUN","FROG","FISH",
    "BIRD","TREE","MILK","CLOUD","SNAKE"
  ];

  // Emojis for Word Builder words
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

  const RHYME_LEVELS = [
    { base: "cat",   correct: "hat",   others: ["dog","bus"] },
    { base: "sun",   correct: "run",   others: ["cup","fish"] },
    { base: "ball",  correct: "tall",  others: ["bed","fox"] },
    { base: "tree",  correct: "bee",   others: ["hat","pig"] },
    { base: "cake",  correct: "lake",  others: ["rock","bug"] },
    { base: "book",  correct: "hook",  others: ["pen","door"] },
    { base: "moon",  correct: "spoon", others: ["chair","train"] },
    { base: "star",  correct: "car",   others: ["shoe","lamp"] },
    { base: "chair", correct: "bear",  others: ["cup","ring"] },
    { base: "mouse", correct: "house", others: ["ship","lake"] }
  ];

  /* ---------------------------------------------------
   * LETTERS GAME (with emojis)
   * --------------------------------------------------- */
  let lettersLevelIndex = 0;

  const lettersLevelLabel = document.getElementById("letters-level");
  const lettersBank = document.getElementById("letters-bank");
  const lettersDrop = document.getElementById("letters-drop");
  const lettersPic = document.getElementById("letters-picture");
  const lettersCaption = document.getElementById("letters-caption");
  const lettersPrev = document.getElementById("letters-prev");
  const lettersNext = document.getElementById("letters-next");

  function renderLettersLevel() {
    const levelNum = lettersLevelIndex + 1;
    lettersLevelLabel.textContent = levelNum;

    lettersBank.innerHTML = "";
    lettersDrop.innerHTML = "Drop letters here";
    lettersPic.style.display = "none";
    lettersCaption.textContent = "";

    const levelLetters = LETTER_LEVELS[lettersLevelIndex];

    levelLetters.forEach(ch => {
      const btn = document.createElement("button");
      btn.className = "letter-tile";
      btn.textContent = ch;
      btn.dataset.letter = ch;
      btn.setAttribute("draggable","true");

      btn.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", ch);
      });

      btn.addEventListener("click", () => {
        const d = LETTER_DATA[ch];
        if (d) {
          const sentence = `${ch} is for ${d.word}.`;
          speak(sentence);
          showLetterEmoji(d.emoji, sentence);
        } else {
          speak(ch);
        }
      });

      lettersBank.appendChild(btn);
    });
  }

  function showLetterEmoji(emoji, sentence) {
    // We ignore the <img> and show a big emoji instead
    lettersPic.style.display = "none";
    lettersCaption.innerHTML = `
      <div class="big-emoji">${emoji}</div>
      <div>${sentence}</div>
    `;
  }

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
    const tile =
      lettersBank.querySelector(`[data-letter="${letter}"]`) ||
      lettersDrop.querySelector(`[data-letter="${letter}"]`);

    if (tile) {
      lettersDrop.appendChild(tile);
      tile.style.transform = "scale(1.1)";
      setTimeout(() => (tile.style.transform = "scale(1)"), 150);
      ding();

      const neededCount = LETTER_LEVELS[lettersLevelIndex].length;
      const inDrop = lettersDrop.querySelectorAll(".letter-tile").length;
      if (inDrop === neededCount) {
        addXP(5);
        markLevelCompleted(lettersLevelIndex + 1);
      }
    }
  });

  lettersPrev.addEventListener("click", () => {
    if (lettersLevelIndex > 0) {
      lettersLevelIndex--;
      renderLettersLevel();
    }
  });

  lettersNext.addEventListener("click", () => {
    if (lettersLevelIndex < LETTER_LEVELS.length - 1) {
      lettersLevelIndex++;
      renderLettersLevel();
    }
  });

  /* ---------------------------------------------------
   * WORD BUILDER GAME (with emojis)
   * --------------------------------------------------- */
  let wordLevelIndex = 0;

  const wordLevelLabel = document.getElementById("word-level");
  const wordTarget = document.getElementById("word-target");
  const wordSlots = document.getElementById("word-slots");
  const wordPool = document.getElementById("word-pool");
  const wordFeedback = document.getElementById("word-feedback");
  const wordImg = document.getElementById("word-img");
  const wordImgCaption = document.getElementById("word-img-caption");
  const checkWordBtn = document.getElementById("check-word");
  const wordPrev = document.getElementById("word-prev");
  const wordNext = document.getElementById("word-next");

  function showWordPicture(word) {
    const emoji = WORD_EMOJIS[word] || "❓";

    // Hide the <img>, use emoji in caption instead
    wordImg.style.display = "none";
    wordImgCaption.innerHTML = `
      <div class="big-emoji">${emoji}</div>
      <div>This is ${word.toLowerCase()}.</div>
    `;
  }

  function renderWordLevel() {
    const word = WORD_LEVELS[wordLevelIndex];
    const levelNum = wordLevelIndex + 1;
    wordLevelLabel.textContent = levelNum;

    wordTarget.textContent = `Build the word: ${word}`;
    wordSlots.innerHTML = "";
    wordPool.innerHTML = "";
    wordFeedback.textContent = "";

    showWordPicture(word);

    // Make slots
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
      .slice(0, Math.max(0, 6 - baseLetters.length));

    const poolLetters = [...baseLetters, ...extras].sort(
      () => Math.random() - 0.5
    );

    poolLetters.forEach((ch, idx) => {
      const token = document.createElement("button");
      token.className = "token";
      token.textContent = ch;
      token.dataset.id = `w-${wordLevelIndex}-${idx}`;
      token.setAttribute("draggable","true");
      token.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", token.dataset.id);
      });
      wordPool.appendChild(token);
    });

    // Set up slots for drops
    wordSlots.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", e => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        const t = document.querySelector(`[data-id="${id}"]`);
        if (t) {
          slot.appendChild(t);
          ding();
        }
      });
    });
  }

  // Allow dragging back to pool
  wordPool.addEventListener("dragover", e => e.preventDefault());
  wordPool.addEventListener("drop", e => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const t = document.querySelector(`[data-id="${id}"]`);
    if (t) wordPool.appendChild(t);
  });

  checkWordBtn.addEventListener("click", () => {
    const word = WORD_LEVELS[wordLevelIndex];
    const built = Array.from(wordSlots.children)
      .map(slot => slot.querySelector(".token")?.textContent || "")
      .join("");
    if (built === word) {
      wordFeedback.textContent = "✅ Great job!";
      speak(word.split("").join(" ") + `. ${word}.`);
      addXP(8);
      markLevelCompleted(wordLevelIndex + 1);
    } else {
      wordFeedback.textContent = "❌ Try again!";
    }
  });

  wordPrev.addEventListener("click", () => {
    if (wordLevelIndex > 0) {
      wordLevelIndex--;
      renderWordLevel();
    }
  });

  wordNext.addEventListener("click", () => {
    if (wordLevelIndex < WORD_LEVELS.length - 1) {
      wordLevelIndex++;
      renderWordLevel();
    }
  });

  /* ---------------------------------------------------
   * SENTENCE BUILDER GAME
   * --------------------------------------------------- */
  let sentLevelIndex = 0;

  const sentLevelLabel = document.getElementById("sent-level");
  const sentSlots = document.getElementById("sentence-slots");
  const sentPool = document.getElementById("sentence-pool");
  const sentFeedback = document.getElementById("sentence-feedback");
  const checkSentBtn = document.getElementById("check-sentence");
  const sentPrev = document.getElementById("sent-prev");
  const sentNext = document.getElementById("sent-next");

  function renderSentenceLevel() {
    const sentence = SENTENCE_LEVELS[sentLevelIndex];
    const levelNum = sentLevelIndex + 1;
    sentLevelLabel.textContent = levelNum;

    const words = sentence.split(" ");
    sentSlots.innerHTML = "";
    sentPool.innerHTML = "";
    sentFeedback.textContent = "";

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
      token.setAttribute("draggable","true");
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
        const t = document.querySelector(`[data-id="${id}"]`);
        if (t) {
          slot.appendChild(t);
          ding();
        }
      });
    });
  }

  sentPool.addEventListener("dragover", e => e.preventDefault());
  sentPool.addEventListener("drop", e => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const t = document.querySelector(`[data-id="${id}"]`);
    if (t) sentPool.appendChild(t);
  });

  checkSentBtn.addEventListener("click", () => {
    const sentence = SENTENCE_LEVELS[sentLevelIndex];
    const built = Array.from(sentSlots.children)
      .map(slot => slot.querySelector(".token")?.textContent || "")
      .join(" ");
    if (built === sentence) {
      sentFeedback.textContent = "✅ Nice sentence!";
      speak(sentence);
      addXP(10);
      markLevelCompleted(sentLevelIndex + 1);
    } else {
      sentFeedback.textContent = "❌ Not quite. Try again!";
    }
  });

  sentPrev.addEventListener("click", () => {
    if (sentLevelIndex > 0) {
      sentLevelIndex--;
      renderSentenceLevel();
    }
  });

  sentNext.addEventListener("click", () => {
    if (sentLevelIndex < SENTENCE_LEVELS.length - 1) {
      sentLevelIndex++;
      renderSentenceLevel();
    }
  });

  /* ---------------------------------------------------
   * RHYMING GAME
   * --------------------------------------------------- */
  let rhymeLevelIndex = 0;

  const rhymeLevelLabel = document.getElementById("rhyme-level");
  const rhymeTarget = document.getElementById("rhyme-target");
  const rhymeChoices = document.getElementById("rhyme-choices");
  const rhymeFeedback = document.getElementById("rhyme-feedback");
  const rhymePrev = document.getElementById("rhyme-prev");
  const rhymeNext = document.getElementById("rhyme-next");

  function renderRhymeLevel() {
    const level = RHYME_LEVELS[rhymeLevelIndex];
    const levelNum = rhymeLevelIndex + 1;
    rhymeLevelLabel.textContent = levelNum;

    rhymeTarget.textContent = `Which word rhymes with “${level.base}”?`;
    rhymeChoices.innerHTML = "";
    rhymeFeedback.textContent = "";

    const options = [level.correct, ...level.others].sort(
      () => Math.random() - 0.5
    );

    options.forEach(word => {
      const btn = document.createElement("button");
      btn.className = "token";
      btn.textContent = word;
      btn.addEventListener("click", () => {
        if (word === level.correct) {
          rhymeFeedback.textContent = "✅ Yes, that rhymes! 🌟";
          speak(`${level.base} rhymes with ${level.correct}.`);
          addXP(6);
          markLevelCompleted(rhymeLevelIndex + 1);
        } else {
          rhymeFeedback.textContent = "❌ Try a different word.`;
        }
      });
      rhymeChoices.appendChild(btn);
    });
  }

  rhymePrev.addEventListener("click", () => {
    if (rhymeLevelIndex > 0) {
      rhymeLevelIndex--;
      renderRhymeLevel();
    }
  });

  rhymeNext.addEventListener("click", () => {
    if (rhymeLevelIndex < RHYME_LEVELS.length - 1) {
      rhymeLevelIndex++;
      renderRhymeLevel();
    }
  });

  /* ---------------------------------------------------
   * LEARNING PATH
   * --------------------------------------------------- */
  const pathMap = document.getElementById("path-map");
  const pathDetail = document.getElementById("path-detail");
  const pathStatus = document.getElementById("path-status");

  function renderPath(container) {
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

  function renderPathMap() {
    renderPath(pathMap);
  }

  function renderPathDetail() {
    renderPath(pathDetail);
    pathStatus.textContent = `Highest step reached: ${maxLevelReached} / 10`;
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
  renderLettersLevel();
  renderWordLevel();
  renderSentenceLevel();
  renderRhymeLevel();
  renderPathMap();
  renderPathDetail();
  renderAchievements();
  updateXPUI();
});
