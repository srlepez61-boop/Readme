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

// ---------- WORD BUILDER ----------
const words = [
  { word: "cat", pic: "🐱" },
  { word: "dog", pic: "🐶" },
  { word: "sun", pic: "☀️" }
];

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
  currentWord = words[Math.floor(Math.random() * words.length)];
  pic.src =
    "https://twemoji.maxcdn.com/v/14.0.2/72x72/" +
    currentWord.pic.codePointAt(0).toString(16) +
    ".png";
  pic.alt = currentWord.word;

  slotsEl.innerHTML = "";
  poolEl.innerHTML = "";
  msg.textContent = "";

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
    msg.textContent = "🎉 Great job!";
    speak(currentWord.word);
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

// init
initBuilder();
card.textContent = sightWords[0];
