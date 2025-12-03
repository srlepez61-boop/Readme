// ---------- VOICE SELECTION ----------
let voices = [];
let selectedVoiceName = "";

const voiceContainer = document.getElementById("voice-container");
const voiceSelect = document.createElement("select");
voiceSelect.id = "voice-select";
voiceContainer.appendChild(voiceSelect);

function loadVoices() {
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach(v => {
    const option = document.createElement("option");
    option.value = v.name;
    option.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(option);
  });

  if (voices.length > 0 && !selectedVoiceName) {
    selectedVoiceName = voices[0].name;
    voiceSelect.value = selectedVoiceName;
  }
}

voiceSelect.onchange = () => { selectedVoiceName = voiceSelect.value; };
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

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
const letters = "abcdefghijklmnopqrstuvwxyz";
const letterGrid = document.querySelector(".letter-grid");

letters.split("").forEach(l => {
  const b = document.createElement("button");
  b.textContent = l.toUpperCase();
  b.onclick = () => speak(l.toUpperCase()); // speak the letter name
  letterGrid.appendChild(b);
});

// ---------- WORD BUILDER ----------
const levels = [
  [
    { word: "cat", pic: "🐱" }, { word: "dog", pic: "🐶" }, { word: "sun", pic: "☀️" },
    { word: "bat", pic: "🦇" }, { word: "car", pic: "🚗" }, { word: "cup", pic: "☕" },
    { word: "fox", pic: "🦊" }, { word: "hat", pic: "🎩" }, { word: "pen", pic: "🖊️" },
    { word: "egg", pic: "🥚" }
  ],
  [
    { word: "fish", pic: "🐟" }, { word: "book", pic: "📖" }, { word: "star", pic: "⭐" },
    { word: "tree", pic: "🌳" }, { word: "milk", pic: "🥛" }, { word: "cake", pic: "🍰" },
    { word: "lion", pic: "🦁" }, { word: "bear", pic: "🐻" }, { word: "moon", pic: "🌙" },
    { word: "leaf", pic: "🍃" }
  ]
];

let currentLevel = 0;
let currentWord, slotsEl, poolEl, checkBtn, msg, pic;
let selectedLetter = null;

function initBuilder() {
  slotsEl = document.getElementById("slots");
  poolEl = document.getElementById("letters-pool");
  checkBtn = document.getElementById("check-btn");
  msg = document.getElementById("msg");
  pic = document.getElementById("pic");

  pickWord();
  checkBtn.onclick = checkWord;

  // Tap-to-place letters for mobile
  poolEl.addEventListener("click", e => {
    if (e.target.classList.contains("letter-chip")) {
      selectedLetter = e.target.textContent;
      document.querySelectorAll(".letter-chip").forEach(c => c.style.border = "none");
      e.target.style.border = "2px solid #ff6f00";
      speak(selectedLetter);
    }
  });

  slotsEl.addEventListener("click", e => {
    if (selectedLetter && e.target.classList.contains("slot")) {
      e.target.textContent = selectedLetter;
      selectedLetter = null;
      document.querySelectorAll(".letter-chip").forEach(c => c.style.border = "none");
    }
  });
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
    slotsEl.appendChild(slot);
  });

  const lettersShuffled = [...currentWord.word].sort(() => Math.random() - 0.5);
  lettersShuffled.forEach(l => {
    const chip = document.createElement("div");
    chip.className = "letter-chip";
    chip.textContent = l.toUpperCase();
    poolEl.appendChild(chip);
  });
}

function checkWord() {
  const built = Array.from(slotsEl.children)
    .map(s => s.textContent.toLowerCase())
    .join("");

  if (built === currentWord.word) {
    speak(currentWord.word);
    msg.textContent = `🎉 Correct!`;

    levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);

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
