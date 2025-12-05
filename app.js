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
   * XP SYSTEM
   * --------------------------------------------------- */
  let xp = 0;
  let maxLevelReached = 1;

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
   * SPEECH + SOUND
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
    try {
      dingSound.currentTime = 0;
      dingSound.play().catch(() => {});
    } catch {}
  }


  /* ---------------------------------------------------
   * DATA — LETTERS A–Z WITH EMOJI
   * --------------------------------------------------- */
  const LETTERS = [
    "A","B","C","D","E","F","G","H","I",
    "J","K","L","M","N","O","P","Q","R",
    "S","T","U","V","W","X","Y","Z"
  ];

  const LETTER_DATA = {
    A:{ word:"Apple", emoji:"🍎" },
    B:{ word:"Ball", emoji:"🏀" },
    C:{ word:"Cat", emoji:"🐱" },
    D:{ word:"Dog", emoji:"🐶" },
    E:{ word:"Elephant", emoji:"🐘" },
    F:{ word:"Fish", emoji:"🐟" },
    G:{ word:"Goat", emoji:"🐐" },
    H:{ word:"Hat", emoji:"🎩" },
    I:{ word:"Ice Cream", emoji:"🍦" },
    J:{ word:"Jelly", emoji:"🍮" },
    K:{ word:"Kite", emoji:"🪁" },
    L:{ word:"Lion", emoji:"🦁" },
    M:{ word:"Monkey", emoji:"🐒" },
    N:{ word:"Nest", emoji:"🪺" },
    O:{ word:"Octopus", emoji:"🐙" },
    P:{ word:"Pig", emoji:"🐷" },
    Q:{ word:"Queen", emoji:"👸" },
    R:{ word:"Rabbit", emoji:"🐰" },
    S:{ word:"Sun", emoji:"☀️" },
    T:{ word:"Turtle", emoji:"🐢" },
    U:{ word:"Umbrella", emoji:"☂️" },
    V:{ word:"Violin", emoji:"🎻" },
    W:{ word:"Whale", emoji:"🐋" },
    X:{ word:"Xylophone", emoji:"🎼" },
    Y:{ word:"Yak", emoji:"🐃" },
    Z:{ word:"Zebra", emoji:"🦓" }
  };


  /* ---------------------------------------------------
   * LETTERS GAME — FULL A–Z
   * --------------------------------------------------- */
  const lettersBank = document.getElementById("letters-bank");
  const lettersDrop = document.getElementById("letters-drop");
  const lettersCaption = document.getElementById("letters-caption");

  function showLetterEmoji(emoji, sentence) {
    lettersCaption.innerHTML = `
      <div class="big-emoji">${emoji}</div>
      <div>${sentence}</div>
    `;
  }

  function renderLetters() {
    lettersBank.innerHTML = "";
    lettersDrop.innerHTML = "Drop letters here";
    lettersCaption.innerHTML = "";

    LETTERS.forEach(letter => {
      const btn = document.createElement("button");
      btn.className = "letter-tile";
      btn.textContent = letter;
      btn.dataset.letter = letter;
      btn.setAttribute("draggable","true");

      // Drag
      btn.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", letter);
      });

      // Tap
      btn.addEventListener("click", () => {
        const data = LETTER_DATA[letter];
        const sentence = `${letter} is for ${data.word}.`;
        speak(sentence);
        showLetterEmoji(data.emoji, sentence);
      });

      lettersBank.appendChild(btn);
    });
  }

  // Drop zone
  lettersDrop.addEventListener("dragover", e => e.preventDefault());
  lettersDrop.addEventListener("drop", e => {
    e.preventDefault();
    const letter = e.dataTransfer.getData("text/plain");
    const tile = lettersBank.querySelector(`[data-letter="${letter}"]`);
    if (tile) {
      lettersDrop.appendChild(tile);
      ding();
      addXP(1);
    }
  });


  /* ---------------------------------------------------
   * WORD BUILDER (unchanged)
   * --------------------------------------------------- */
  const WORD_LEVELS = [
    "CAT","DOG","SUN","FROG","FISH",
    "BIRD","TREE","MILK","CLOUD","SNAKE"
  ];

  const WORD_EMOJIS = {
    CAT:"🐱", DOG:"🐶", SUN:"☀️", FROG:"🐸", FISH:"🐟",
    BIRD:"🐦", TREE:"🌳", MILK:"🥛", CLOUD:"☁️", SNAKE:"🐍"
  };

  let wordLevelIndex = 0;

  const wordLevelLabel = document.getElementById("word-level");
  const wordTarget = document.getElementById("word-target");
  const wordSlots = document.getElementById("word-slots");
  const wordPool = document.getElementById("word-pool");
  const wordFeedback = document.getElementById("word-feedback");
  const wordImgCaption = document.getElementById("word-img-caption");

  function showWordPicture(word) {
    const emoji = WORD_EMOJIS[word];
    wordImgCaption.innerHTML = `
      <div class="big-emoji">${emoji}</div>
      <div>This is ${word.toLowerCase()}.</div>
    `;
  }

  function renderWordLevel() {
    const word = WORD_LEVELS[wordLevelIndex];
    wordLevelLabel.textContent = wordLevelIndex + 1;

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

    // Make letter pool
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
      token.setAttribute("draggable","true");

      token.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", token.dataset.id);
      });

      wordPool.appendChild(token);
    });

    wordSlots.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", e => {
        const id = e.dataTransfer.getData("text/plain");
        const token = document.querySelector(`[data-id="${id}"]`);
        if (token) {
          slot.appendChild(token);
          ding();
        }
      });
    });
  }

  wordPool.addEventListener("dragover", e => e.preventDefault());
  wordPool.addEventListener("drop", e => {
    const id = e.dataTransfer.getData("text/plain");
    const token = document.querySelector(`[data-id="${id}"]`);
    if (token) wordPool.appendChild(token);
  });

  document.getElementById("check-word").addEventListener("click", () => {
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

  document.getElementById("word-prev").addEventListener("click", () => {
    if (wordLevelIndex > 0) {
      wordLevelIndex--;
      renderWordLevel();
    }
  });

  document.getElementById("word-next").addEventListener("click", () => {
    if (wordLevelIndex < WORD_LEVELS.length - 1) {
      wordLevelIndex++;
      renderWordLevel();
    }
  });


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

  let sentLevelIndex = 0;

  const sentLevelLabel = document.getElementById("sent-level");
  const sentSlots = document.getElementById("sentence-slots");
  const sentPool = document.getElementById("sentence-pool");
  const sentFeedback = document.getElementById("sentence-feedback");

  function renderSentenceLevel() {
    const sentence = SENTENCE_LEVELS[sentLevelIndex];

    sentLevelLabel.textContent = sentLevelIndex + 1;
    sentSlots.innerHTML = "";
    sentPool.innerHTML = "";
    sentFeedback.textContent = "";

    const words = sentence.split(" ");

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
        const id = e.dataTransfer.getData("text/plain");
        const token = document.querySelector(`[data-id="${id}"]`);
        if (token) slot.appendChild(token);
      });
    });
  }

  sentPool.addEventListener("dragover", e => e.preventDefault());

  sentPool.addEventListener("drop", e => {
    const id = e.dataTransfer.getData("text/plain");
    const token = document.querySelector(`[data-id="${id}"]`);
    if (token) sentPool.appendChild(token);
  });

  document.getElementById("check-sentence").addEventListener("click", () => {
    const correct = SENTENCE_LEVELS[sentLevelIndex];
    const built = Array.from(sentSlots.children)
      .map(slot => slot.querySelector(".token")?.textContent || "")
      .join(" ");

    if (built === correct) {
      sentFeedback.textContent = "✅ Correct!";
      speak(correct);
      addXP(10);
      markLevelCompleted(sentLevelIndex + 1);
    } else {
      sentFeedback.textContent = "❌ Try again!";
    }
  });

  document.getElementById("sent-prev").addEventListener("click", () => {
    if (sentLevelIndex > 0) {
      sentLevelIndex--;
      renderSentenceLevel();
    }
  });

  document.getElementById("sent-next").addEventListener("click", () => {
    if (sentLevelIndex < SENTENCE_LEVELS.length - 1) {
      sentLevelIndex++;
      renderSentenceLevel();
    }
  });


  /* ---------------------------------------------------
   * RHYMING GAME
   * --------------------------------------------------- */
  const RHYME_LEVELS = [
    { base:"cat", correct:"hat", others:["dog","bus"] },
    { base:"sun", correct:"run", others:["cup","fish"] },
    { base:"ball", correct:"tall", others:["bed","fox"] },
    { base:"tree", correct:"bee", others:["hat","pig"] },
    { base:"cake", correct:"lake", others:["rock","bug"] },
    { base:"book", correct:"hook", others:["pen","door"] },
    { base:"moon", correct:"spoon", others:["chair","train"] },
    { base:"star", correct:"car", others:["shoe","lamp"] },
    { base:"chair", correct:"bear", others:["cup","ring"] },
    { base:"mouse", correct:"house", others:["ship","lake"] }
  ];

  let rhymeLevelIndex = 0;

  const rhymeLevelLabel = document.getElementById("rhyme-level");
  const rhymeTarget = document.getElementById("rhyme-target");
  const rhymeChoices = document.getElementById("rhyme-choices");
  const rhymeFeedback = document.getElementById("rhyme-feedback");

  function renderRhymeLevel() {
    const level = RHYME_LEVELS[rhymeLevelIndex];

    rhymeLevelLabel.textContent = rhymeLevelIndex + 1;
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
          rhymeFeedback.textContent = "✅ Yes! That rhymes!";
          speak(`${level.base} rhymes with ${level.correct}.`);
          addXP(6);
          markLevelCompleted(rhymeLevelIndex + 1);
        } else {
          rhymeFeedback.textContent = "❌ Try again!";
        }
      });

      rhymeChoices.appendChild(btn);
    });
  }

  document.getElementById("rhyme-prev").addEventListener("click", () => {
    if (rhymeLevelIndex > 0) {
      rhymeLevelIndex--;
      renderRhymeLevel();
    }
  });

  document.getElementById("rhyme-next").addEventListener("click", () => {
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
    pathStatus.textContent = `Highest level reached: ${maxLevelReached} / 10`;
  }


  /* ---------------------------------------------------
   * ACHIEVEMENTS
   * --------------------------------------------------- */
  const achList = document.getElementById("ach-list");

  const ACH_CONFIG = [
    { id:"first-xp", label:"First XP", xp:5, icon:"⭐" },
    { id:"half-xp", label:"Halfway Hero (50 XP)", xp:50, icon:"🌟" },
    { id:"full-xp", label:"XP Master (100 XP)", xp:100, icon:"🏆" },
    { id:"path-3", label:"Path Explorer (Level 3)", level:3, icon:"🗺️" },
    { id:"path-7", label:"Big Adventurer (Level 7)", level:7, icon:"🚀" },
    { id:"path-10", label:"Path Champion (Level 10)", level:10, icon:"👑" }
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
      text.innerHTML = `<strong>${a.label}</strong><br>${
        a.xp ? `${a.xp} XP` : `Reach level ${a.level}`
      }`;

      card.appendChild(icon);
      card.appendChild(text);
      achList.appendChild(card);
    });
  }


  /* ---------------------------------------------------
   * INITIALIZE EVERYTHING
   * --------------------------------------------------- */
  renderLetters();
  renderWordLevel();
  renderSentenceLevel();
  renderRhymeLevel();
  renderPathMap();
  renderPathDetail();
  renderAchievements();
  updateXPUI();

});
