// ------------------ NAV ------------------
const screens = document.querySelectorAll(".screen");
document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = () => {
    screens.forEach(s => s.classList.remove("active"));
    document.getElementById(btn.dataset.screen).classList.add("active");
  };
});

// ------------------ AUDIO ------------------
let voices = [];
function loadVoices() { voices = speechSynthesis.getVoices(); }
speechSynthesis.onvoiceschanged = loadVoices;
setTimeout(loadVoices, 300);

function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  if (voices[0]) u.voice = voices[0];
  speechSynthesis.speak(u);
}

// ------------------ REWARDS ------------------
let stars = 0;
function addStar() {
  stars++;
  document.getElementById("stars").textContent = `⭐ ${stars}`;
}

// ------------------ ALPHABET ------------------
const letterGrid = document.getElementById("letter-grid");
"abcdefghijklmnopqrstuvwxyz".split("").forEach(l => {
  const b = document.createElement("button");
  b.textContent = l.toUpperCase();
  b.onclick = () => speak(l);
  letterGrid.appendChild(b);
});

// ------------------ BUILD A WORD ------------------
const words = [
  { word: "cat", pic: "🐱" },
  { word: "sun", pic: "☀️" },
  { word: "dog", pic: "🐶" }
];

let current = null;

function loadWord() {
  const item = words[Math.floor(Math.random()*words.length)];
  current = item;

  document.getElementById("builder-msg").textContent = "";
  document.getElementById("pic").src = "";
  document.getElementById("pic").alt = item.pic;
  document.getElementById("pic").textContent = item.pic;

  const slots = document.getElementById("slots");
  const pool = document.getElementById("pool");

  slots.innerHTML = "";
  pool.innerHTML = "";

  // create slots
  item.word.split("").forEach(() => {
    const s = document.createElement("div");
    s.className = "slot";
    slots.appendChild(s);
  });

  // create scrambled chips
  const scrambled = item.word.split("").sort(() => Math.random() - 0.5);
  scrambled.forEach(ch => {
    const c = document.createElement("button");
    c.className = "letter-chip";
    c.textContent = ch.toUpperCase();
    c.onclick = () => placeChip(c);
    pool.appendChild(c);
  });
}

function placeChip(chip) {
  const slots = [...document.getElementById("slots").children];
  const empty = slots.find(s => !s.textContent);
  if (!empty) return;
  empty.textContent = chip.textContent;
  chip.disabled = true;
}

document.getElementById("check").onclick = () => {
  const built = [...document.getElementById("slots").children]
    .map(s => s.textContent.toLowerCase())
    .join("");

  if (built === current.word) {
    document.getElementById("builder-msg").textContent = "🎉 Correct!";
    speak(current.word);
    addStar();
    setTimeout(loadWord, 900);
  } else {
    document.getElementById("builder-msg").textContent = "❌ Try again";
  }
};

// ------------------ FLASHCARDS ------------------
const sightWords = ["the", "and", "you", "for", "they", "was"];
let cardIndex = 0;

const card = document.getElementById("card");
const nextCard = document.getElementById("next-card");

function loadCard() {
  card.textContent = sightWords[cardIndex];
  speak(sightWords[cardIndex]);
}

card.onclick = () => speak(card.textContent);

nextCard.onclick = () => {
  cardIndex = (cardIndex + 1) % sightWords.length;
  loadCard();
};

// ------------------ INIT ------------------
loadWord();
loadCard();
