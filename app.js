const dropZone = document.getElementById("drop-zone");
const letterBank = document.getElementById("letter-bank");
const dingSound = document.getElementById("ding-sound");
const picture = document.getElementById("picture");

// A–Z words
const LETTERS = {
  A: "Apple",
  B: "Ball",
  C: "Cat",
  D: "Dog",
  E: "Elephant",
  F: "Fish",
  G: "Goat",
  H: "Hat",
  I: "Ice cream",
  J: "Jelly",
  K: "Kite",
  L: "Lion",
  M: "Monkey",
  N: "Nest",
  O: "Octopus",
  P: "Pig",
  Q: "Queen",
  R: "Rabbit",
  S: "Sun",
  T: "Turtle",
  U: "Umbrella",
  V: "Violin",
  W: "Whale",
  X: "Xylophone",
  Y: "Yak",
  Z: "Zebra"
};

// Create letter blocks
Object.keys(LETTERS).forEach(letter => {
  const div = document.createElement("div");
  div.className = "letter";
  div.textContent = letter;
  div.draggable = true;
  div.dataset.letter = letter;
  div.dataset.word = LETTERS[letter];
  div.dataset.img = `img/${letter}.png`;

  letterBank.appendChild(div);

  // CLICK = speak + show image
  div.addEventListener("click", () => {
    speak(`${letter}. ${LETTERS[letter]}.`);
    picture.src = div.dataset.img;
    picture.style.display = "block";
  });

  // DRAG START
  div.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text", letter);
  });
});

// SPEECH
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 0.9;
  msg.pitch = 1.1;
  speechSynthesis.cancel();
  speechSynthesis.speak(msg);
}

// DRAG OVER DROP ZONE
dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("hover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("hover");
});

// DROP
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("hover");

  const letter = e.dataTransfer.getData("text");
  const elem = document.querySelector(`[data-letter="${letter}"]`);

  // animate
  elem.style.transform = "scale(1.3)";
  setTimeout(() => elem.style.transform = "scale(1)", 200);

  dingSound.currentTime = 0;
  dingSound.play();

  dropZone.appendChild(elem);
});
