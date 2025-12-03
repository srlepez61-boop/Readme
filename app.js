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

  if (!selectedVoiceName && voices.length > 0) {
    selectedVoiceName = voices[0].name;
    voiceSelect.value = selectedVoiceName;
  }
}

voiceSelect.onchange = () => { selectedVoiceName = voiceSelect.value; };
speechSynthesis.onvoiceschanged = loadVoices;
setTimeout(loadVoices, 100);

function speak(text) {
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";

  const voice = voices.find(v => v.name === selectedVoiceName);
  if (voice) utter.voice = voice;

  utter.rate = 0.8;
  speechSynthesis.speak(utter);
}

// ---------- LETTER SOUNDS ----------
const letters = "abcdefghijklmnopqrstuvwxyz";
const letterGrid = document.querySelector(".letter-grid");
letters.split("").forEach(l => {
  const btn = document.createElement("button");
  btn.textContent = l.toUpperCase();
  btn.className = "letter-btn";
  btn.onclick = () => speak(l.toUpperCase());
  letterGrid.appendChild(btn);
});

// ---------- UTILITY: FISHER-YATES SHUFFLE ----------
function shuffleArray(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
let currentWord = null;
let selectedLetter = null;

const slotsEl = document.getElementById("slots");
const poolEl = document.getElementById("letters-pool");
const checkBtn = document.getElementById("check-btn");
const msg = document.getElementById("msg");
const pic = document.getElementById("pic");

function pickWord() {
  const levelWords = levels[currentLevel];
  if (!levelWords || levelWords.length === 0) return;

  currentWord = levelWords[Math.floor(Math.random() * levelWords.length)];

  // Handle multi-codepoint emojis
  pic.src = `https://twemoji.maxcdn.com/v/14.0.2/72x72/${Array.from(currentWord.pic).map(c => c.codePointAt(0).toString(16)).join('-')}.png`;
  pic.alt = currentWord.word;

  slotsEl.innerHTML = "";
  poolEl.innerHTML = "";
  msg.textContent = `Level ${currentLevel + 1}`;

  // Create slots
  currentWord.word.split("").forEach(() => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slotsEl.appendChild(slot);
  });

  // Shuffle letters
  const lettersShuffled = shuffleArray([...currentWord.word]);
  lettersShuffled.forEach(l => {
    const chip = document.createElement("div");
    chip.className = "letter-chip";
    chip.textContent = l.toUpperCase();
    poolEl.appendChild(chip);
  });
}

function checkWord() {
  const built = Array.from(slotsEl.children).map(s => s.textContent.toLowerCase()).join("");
  if (built === currentWord.word) {
    speak(currentWord.word);
    msg.textContent = "🎉 Correct!";

    // Remove word from level
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

// ---------- TAP-TO-PLACE LETTERS ----------
poolEl.addEventListener("click", e => {
  if (e.target.classList.contains("letter-chip") && !e.target.dataset.used) {
    selectedLetter = e.target.textContent;
    document.querySelectorAll(".letter-chip").forEach(c => { if (!c.dataset.used) c.style.border = "none"; });
    e.target.style.border = "2px solid #ff6f00";
    speak(selectedLetter);
  }
});

slotsEl.addEventListener("click", e => {
  if (selectedLetter && e.target.classList.contains("slot")) {
    e.target.textContent = selectedLetter;

    // Mark chip as used
    const chip = Array.from(poolEl.children).find(c => c.textContent === selectedLetter && !c.dataset.used);
    if (chip) chip.dataset.used = "true";

    selectedLetter = null;
    document.querySelectorAll(".letter-chip").forEach(c => { if (!c.dataset.used) c.style.border = "none"; });
  }
});

checkBtn.onclick = checkWord;

// ---------- KEYBOARD SUPPORT ----------
document.addEventListener("keydown", e => {
  if (!currentWord) return;
  const key = e.key.toLowerCase();

  if (!/^[a-z]$/.test(key)) return; // Only letters

  const poolLetters = Array.from(poolEl.children)
    .filter(c => c.textContent.toLowerCase() === key && !c.dataset.used);

  if (poolLetters.length === 0) return;

  const chip = poolLetters[0];
  selectedLetter = chip.textContent;
  chip.style.border = "2px solid #ff6f00";
  speak(selectedLetter);

  const emptySlot = Array.from(slotsEl.children).find(s => !s.textContent);
  if (emptySlot) {
    emptySlot.textContent = selectedLetter;
    chip.dataset.used = "true";
    selectedLetter = null;

    document.querySelectorAll(".letter-chip").forEach(c => { if (!c.dataset.used) c.style.border = "none"; });
  }

  // Backspace support
  if (key === "backspace") {
    const filledSlots = Array.from(slotsEl.children).filter(s => s.textContent);
    if (filledSlots.length > 0) {
      const lastSlot = filledSlots[filledSlots.length - 1];
      const letter = lastSlot.textContent;
      lastSlot.textContent = "";

      const chipToReturn = Array.from(poolEl.children).find(c => c.textContent === letter && c.dataset.used === "true");
      if (chipToReturn) delete chipToReturn.dataset.used;
    }
  }
});

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
pickWord();
card.textContent = sightWords[0];
