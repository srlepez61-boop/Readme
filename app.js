// ---------------------- DATA ----------------------
const levels = [
  [
    { word: "cat", pic: "🐱" },
    { word: "dog", pic: "🐶" },
    { word: "sun", pic: "☀️" }
  ],
  [
    { word: "fish", pic: "🐟" },
    { word: "book", pic: "📖" },
    { word: "star", pic: "⭐" }
  ]
];

const sightWords = ["the", "and", "you", "that", "was", "for", "are", "with", "his", "they"];

// ---------------------- STATE ----------------------
let currentLevel = 0;
let currentWord = null;
let voices = [];
let userAudioEnabled = false;
let cardIndex = 0;

// ---------------------- ELEMENTS ----------------------
const letterGrid = document.querySelector(".letter-grid");
const slotsEl = document.getElementById("slots");
const poolEl = document.getElementById("letters-pool");
const checkBtn = document.getElementById("check-btn");
const msg = document.getElementById("msg");
const pic = document.getElementById("pic");
const card = document.getElementById("card");
const nextCardBtn = document.getElementById("next-card");

// ---------------------- UTILS ----------------------
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------- VOICES ----------------------
function loadVoices() {
  voices = speechSynthesis.getVoices();
}
speechSynthesis.onvoiceschanged = loadVoices;
setTimeout(loadVoices, 200);

// ---------------------- SPEAK ----------------------
function speak(text) {
  if (!userAudioEnabled) return;
  const u = new SpeechSynthesisUtterance(text);
  if (voices[0]) u.voice = voices[0];
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// Enable audio automatically on first tap
document.body.addEventListener("click", () => {
  if (!userAudioEnabled) userAudioEnabled = true;
}, { once: true });

// ---------------------- EMOJI ----------------------
function setEmoji(emoji) {
  pic.alt = emoji;

  try {
    const hex = Array.from(emoji).map(c => c.codePointAt(0).toString(16)).join("-");
    pic.src = `https://twemoji.maxcdn.com/v/latest/72x72/${hex}.png`;
  } catch {
    pic.src = "";
  }
}

// ---------------------- PICK WORD ----------------------
function pickWord() {
  const words = levels[currentLevel];
  if (!words || words.length === 0) {
    msg.textContent = "No more words!";
    return;
  }

  currentWord = words[Math.floor(Math.random() * words.length)];
  msg.textContent = "";
  setEmoji(currentWord.pic);

  slotsEl.innerHTML = "";
  poolEl.innerHTML = "";

  // build slots
  currentWord.word.split("").forEach((ch, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.pos = i;

    // allow clearing slot
    slot.addEventListener("click", () => {
      if (slot.textContent) {
        let letter = slot.textContent;
        slot.textContent = "";
        slot.classList.remove("filled");

        const chip = [...poolEl.children].find(c => c.textContent === letter && c.dataset.used === "true");
        if (chip) {
          chip.dataset.used = "false";
          chip.disabled = false;
        }
      }
    });

    slotsEl.appendChild(slot);
  });

  // build letter chips
  const shuffled = shuffleArray([...currentWord.word]);
  shuffled.forEach(letter => {
    const chip = document.createElement("button");
    chip.className = "letter-chip";
    chip.textContent = letter.toUpperCase();
    chip.dataset.used = "false";

    chip.addEventListener("click", () => {
      if (chip.dataset.used === "true") return;
      placeSpecificChip(chip);
      speak(letter);
    });

    chip.draggable = true;
    chip.addEventListener("dragstart", ev => ev.dataTransfer.setData("text/plain", chip.textContent));

    poolEl.appendChild(chip);
  });

  // make slots accept drops
  [...slotsEl.children].forEach(slot => {
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", e => {
      e.preventDefault();
      const letter = e.dataTransfer.getData("text/plain");
      if (!letter) return;
      if (slot.textContent) return;

      const chip = [...poolEl.children].find(c => c.textContent === letter && c.dataset.used === "false");
      if (!chip) return;

      slot.textContent = chip.textContent;
      slot.classList.add("filled");

      chip.dataset.used = "true";
      chip.disabled = true;
    });
  });
}

// ---------------------- LETTER PLACEMENT ----------------------
function placeLetterFromPool(letter) {
  const chip = [...poolEl.children].find(
    c => c.textContent.toLowerCase() === letter.toLowerCase() && c.dataset.used === "false"
  );
  if (!chip) return;
  placeSpecificChip(chip);
}

function placeSpecificChip(chip) {
  const emptySlot = [...slotsEl.children].find(s => !s.textContent);
  if (!emptySlot) return;

  emptySlot.textContent = chip.textContent;
  emptySlot.classList.add("filled");

  chip.dataset.used = "true";
  chip.disabled = true;
}

// ---------------------- KEYBOARD SUPPORT ----------------------
document.addEventListener("keydown", e => {
  if (!currentWord) return;

  if (e.key === "Backspace") {
    e.preventDefault();
    const filled = [...slotsEl.children].filter(s => s.textContent);
    if (filled.length === 0) return;

    const last = filled[filled.length - 1];
    const letter = last.textContent;

    last.textContent = "";
    last.classList.remove("filled");

    const chip = [...poolEl.children].find(c => c.textContent === letter && c.dataset.used === "true");
    if (chip) {
      chip.dataset.used = "false";
      chip.disabled = false;
    }
    return;
  }

  if (/^[a-zA-Z]$/.test(e.key)) {
    placeLetterFromPool(e.key);
  }
});

// ---------------------- CHECK WORD ----------------------
checkBtn.addEventListener("click", () => {
  const built = [...slotsEl.children]
    .map(s => s.textContent || "")
    .join("")
    .toLowerCase();

  if (built === currentWord.word) {
    msg.textContent = "🎉 Correct!";
    speak(currentWord.word);

    // remove completed word
    levels[currentLevel] = levels[currentLevel].filter(w => w.word !== currentWord.word);

    setTimeout(() => {
      if (levels[currentLevel].length === 0) {
        currentLevel++;
        if (currentLevel >= levels.length) {
          msg.textContent = "🏆 All levels complete!";
          return;
        }
      }
      pickWord();
    }, 800);

  } else {
    msg.textContent = "Try again!";
  }
});

// ---------------------- FLASHCARDS ----------------------
nextCardBtn.addEventListener("click", () => {
  cardIndex = (cardIndex + 1) % sightWords.length;
  card.textContent = sightWords[cardIndex];
  speak(card.textContent);
});

card.addEventListener("click", () => speak(card.textContent));

// ---------------------- INIT ----------------------
pickWord();
