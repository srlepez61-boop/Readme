// ---------- VOICE SELECTION ----------
let voices = [];
let selectedVoiceName = ""; // default voice

const voiceSelect = document.createElement("select");
voiceSelect.id = "voice-select";
voiceSelect.style.marginBottom = "1rem";
document.body.insertBefore(voiceSelect, document.body.firstChild);

function loadVoices() {
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach(v => {
    const option = document.createElement("option");
    option.value = v.name;
    option.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(option);
  });

  // Set default selected voice
  if (voices.length > 0 && !selectedVoiceName) {
    selectedVoiceName = voices[0].name;
    voiceSelect.value = selectedVoiceName;
  }
}

voiceSelect.onchange = () => {
  selectedVoiceName = voiceSelect.value;
};

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices(); // initial load

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  if (voices.length > 0) {
    const voice = voices.find(v => v.name === selectedVoiceName);
    if (voice) utter.voice = voice;
  }
  utter.rate = 0.8;
  speechSynthesis.speak(utter);
}

// ---------- LETTER SOUNDS ----------
const letterSounds = {
  a: "ah",
  b: "buh",
  c: "cuh",
  d: "duh",
  e: "eh",
  f: "fuh",
  g: "guh",
  h: "huh",
  i: "ih",
  j: "juh",
  k: "kuh",
  l: "luh",
  m: "muh",
  n: "nuh",
  o: "oh",
  p: "puh",
  q: "kwuh",
  r: "ruh",
  s: "suh",
  t: "tuh",
  u: "uh",
  v: "vuh",
  w: "wuh",
  x: "ks",
  y: "yuh",
  z: "zuh"
};


const letterGrid = document.querySelector(".letter-grid");

letters.split("").forEach(l => {
  const b = document.createElement("button");
  b.textContent = l.toUpperCase();
  b.onclick = () => speak(l);
  letterGrid.appendChild(b);
});

// ---------- WORD BUILDER WITH LEVELS ----------
const levels = [
  [ // Level 1
    { word: "cat", pic: "🐱" }, { word: "dog", pic: "🐶" }, { word: "sun", pic: "☀️" },
    { word: "bat", pic: "🦇" }, { word: "car", pic: "🚗" }, { word: "cup", pic: "☕" },
    { word: "fox", pic: "🦊" }, { word: "hat", pic: "🎩" }, { word: "pen", pic: "🖊️" },
    { word: "egg", pic: "🥚" }
  ],
  [ // Level 2
    { word: "fish", pic: "🐟" }, { word: "book", pic: "📖" }, { word: "star", pic: "⭐" },
    { word: "tree", pic: "🌳" }, { word: "milk", pic: "🥛" }, { word: "cake", pic: "🍰" },
    { word: "lion", pic: "🦁" }, { word: "bear", pic: "🐻" }, { word: "moon", pic: "🌙" },
    { word: "leaf", pic: "🍃" }
  ],
  [ // Level 3
    { word: "bird", pic: "🐦" }, { word: "frog", pic: "🐸" }, { word: "rain", pic: "🌧️" },
    { word: "ship", pic: "🚢" }, { word: "plane", pic: "✈️" }, { word: "shoe", pic: "👟" },
    { word: "ball", pic: "⚽" }, { word: "bell", pic: "🔔" }, { word: "kite", pic: "🪁" },
    { word: "ring", pic: "💍" }
  ]
];

let currentLevel = 0;
let currentWord, slotsEl, poolEl, checkBtn, msg, pic;

function initBuilder() {
  slotsEl = document.getElementById("slots");
  poolEl = document.getElementById("letters-pool");
  checkBtn = document.getElementById("check-btn");
  msg = document.getElementById("msg");
  pic = document.getElementById("pic");

  pickWord();
  checkBtn.onclick = checkWord;
}

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

function drop(e) {
  e.preventDefault();
  const letter = e.dataTransfer.getData("text");
  e.target.textContent = letter.toUpperCase();
}

function checkWord() {
  const built = Array.from(slotsEl.children)
    .map(s => s.textContent.toLowerCase())
    .join("");

  if (built === currentWord.word) {
    speak(currentWord.word);
    msg.textContent = `🎉 Correct!`;

    // Remove completed word
    levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);

    // Advance level if done
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
let selectedLetter = null;

// Tap a letter to select it
poolEl.addEventListener("click", e => {
  if (e.target.classList.contains("letter-chip")) {
    selectedLetter = e.target.textContent;
    // highlight selected
    document.querySelectorAll(".letter-chip").forEach(c => c.style.border = "none");
    e.target.style.border = "2px solid #ff6f00";
  }
});

// Tap a slot to place the letter
slotsEl.addEventListener("click", e => {
  if (selectedLetter && e.target.classList.contains("slot")) {
    e.target.textContent = selectedLetter;
    selectedLetter = null;
    document.querySelectorAll(".letter-chip").forEach(c => c.style.border = "none");
  }
});
const letterSounds = {
  a: "ah",
  b: "buh",
  c: "cuh",
  d: "duh",
  e: "eh",
  f: "fuh",
  g: "guh",
  h: "huh",
  i: "ih",
  j: "juh",
  k: "kuh",
  l: "luh",
  m: "muh",
  n: "nuh",
  o: "oh",
  p: "puh",
  q: "kwuh",
  r: "ruh",
  s: "suh",
  t: "tuh",
  u: "uh",
  v: "vuh",
  w: "wuh",
  x: "ks",
  y: "yuh",
  z: "zuh"
};

