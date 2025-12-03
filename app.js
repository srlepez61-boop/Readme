// ---------- LETTER SOUNDS ----------
const letters = "abcdefghijklmnopqrstuvwxyz";
const letterGrid = document.querySelector(".letter-grid");

letters.split("").forEach(l => {
  const b = document.createElement("button");
  b.textContent = l.toUpperCase();
  b.onclick = () => speak(l);
  letterGrid.appendChild(b);
});

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.8;
  speechSynthesis.speak(utter);
}

// ---------- WORD BUILDER WITH LEVELS ----------
const levels = [
  [ // Level 1
    { word: "cat", pic: "🐱" },
    { word: "dog", pic: "🐶" },
    { word: "sun", pic: "☀️" },
    { word: "bat", pic: "🦇" },
    { word: "car", pic: "🚗" },
    { word: "cup", pic: "☕" },
    { word: "fox", pic: "🦊" },
    { word: "hat", pic: "🎩" },
    { word: "pen", pic: "🖊️" },
    { word: "egg", pic: "🥚" }
  ],
  [ // Level 2
    { word: "fish", pic: "🐟" },
    { word: "book", pic: "📖" },
    { word: "star", pic: "⭐" },
    { word: "tree", pic: "🌳" },
    { word: "milk", pic: "🥛" },
    { word: "cake", pic: "🍰" },
    { word: "lion", pic: "🦁" },
    { word: "bear", pic: "🐻" },
    { word: "moon", pic: "🌙" },
    { word: "leaf", pic: "🍃" }
  ],
  [ // Level 3
    { word: "bird", pic: "🐦" },
    { word: "frog", pic: "🐸" },
    { word: "rain", pic: "🌧️" },
    { word: "ship", pic: "🚢" },
    { word: "plane", pic: "✈️" },
    { word: "shoe", pic: "👟" },
    { word: "ball", pic: "⚽" },
    { word: "bell", pic: "🔔" },
    { word: "kite", pic: "🪁" },
    { word: "ring", pic: "💍" }
  ]
];

let currentLevel = 0;
let currentWord, slotsEl, poolEl, checkBtn, msg, pic;

// Initialize Word Builder
function initBuilder() {
  slotsEl = document.getElementById("slots");
  poolEl = document.getElementById("letters-pool");
  checkBtn = document.getElementById("check-btn");
  msg = document.getElementById("msg");
  pic = document.getElementById("pic");

  pickWord();
  checkBtn.onclick = checkWord;
}

// Pick a random word from current level
function pickWord() {
  const levelWords = levels[currentLevel];
  if (!levelWords || levelWords.length === 0) return;

  currentWord = levelWords[Math.floor(Math.random() * levelWords.length)];

  pic.src =
    "https://twemoji.maxcdn.com/v/14.0.2/72x72/" +
    currentWord.pic.codePointAt(0).toString(16) +
    ".png";
  pic.alt = currentWord.word;

  slotsEl.innerHTML = "";
  poolEl.innerHTML = "";
  msg.textContent = `Level ${currentLevel + 1}`;

  currentWord.word.split("").forEach(() => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.ondrop = drop;
    slot.ondragover = e => e.preventDefault();
    slotsEl.appendChild(slot);
  });

  const lettersShuffled = [...currentWord.word].sort(() => Math.random() - 0.5);
  lettersShuffled.forEach(l => {
    const chip = document.createElement("div");
    chip.className = "letter-chip";
    chip.textContent = l.toUpperCase();
    chip.draggable = true;
    chip.ondragstart = e => e.dataTransfer.setData("text", l);
    poolEl.appendChild(chip);
  });
}

// Handle dropping letters
function drop(e) {
  e.preventDefault();
  const letter = e.dataTransfer.getData("text");
  e.target.textContent = letter.toUpperCase();
}

// Check word and handle level progression
function checkWord() {
  const built = Array.from(slotsEl.children)
    .map(s => s.textContent.toLowerCase())
    .join("");

  if (built === currentWord.word) {
    speak(currentWord.word);
    msg.textContent = `🎉 Correct!`;

    // Remove completed word
    levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);

    // If level complete, advance
    if (levels[currentLevel].length === 0) {
      currentLevel++;
      if (currentLevel >= levels.length) {
        msg.textContent = "🏆 You completed all levels!";
        return;
      } else {
        msg.textContent = `🎉 Level ${currentLevel} complete! Advancing...`;
      }
    }

    setTimeout(pickWord, 1500);
  } else {
    msg.textContent = "Try again!";
  }
}

// ---------- FLASHCARDS ----------
const sightWords = ["the","and","you","that","was","for","are","with","his","they"];
let cardIndex = 0;
const card = document.getElementById("card");
const nextBtn = document.getElementById("next-card");

card.onclick = () => speak(card.textContent);
nextBtn.onclick = () => {
  cardIndex = (cardIndex + 1) % sightWords.length;
  card.textContent = sightWords[cardIndex];
  speak(card.textContent);
};

// ---------- INIT ----------
initBuilder();
card.textContent = sightWords[0];
