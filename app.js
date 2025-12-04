<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Read & Play — Clean Version</title>
  <style>
    :root{--accent:#ff6f00;--bg:#f7f7f8;--card:#ffffff;--muted:#666}
    html,body{height:100%;margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial}
    body{background:linear-gradient(180deg,#eef2f6,white);display:flex;align-items:center;justify-content:center;padding:20px}
    .app{width:100%;max-width:980px;background:var(--card);border-radius:16px;box-shadow:0 6px 30px rgba(20,20,40,0.08);padding:20px;display:grid;grid-template-columns:1fr 360px;gap:20px}
    header{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between}
    h1{font-size:20px;margin:0}
    .main{padding:8px}

    .letter-grid{display:grid;grid-template-columns:repeat(13,1fr);gap:6px;margin-bottom:12px}
    .letter-btn{padding:8px 6px;border-radius:8px;background:#fff;border:1px solid #eee;font-weight:600;cursor:pointer}

    .game{display:flex;flex-direction:column;gap:12px}
    .pic-row{display:flex;align-items:center;gap:12px}
    .pic{width:64px;height:64px;display:inline-grid;place-items:center;font-size:34px;background:#fff;border-radius:8px;border:1px solid #eee}
    .meta{flex:1}
    #msg{font-weight:600;color:var(--accent)}

    .slots{display:flex;gap:8px;padding:12px;background:#fbfbfb;border-radius:12px;min-height:64px;align-items:center}
    .slot{width:48px;height:48px;border-radius:8px;border:2px dashed #e6e6e6;display:grid;place-items:center;font-weight:700;font-size:18px;background:white}
    .slot.filled{border-style:solid}

    .pool{display:flex;flex-wrap:wrap;gap:8px;padding:8px}
    .letter-chip{padding:8px 10px;border-radius:10px;background:white;border:1px solid #eee;cursor:pointer;user-select:none;font-weight:700}
    .letter-chip[aria-pressed="true"]{outline:3px solid rgba(255,111,0,0.14)}
    .letter-chip[data-used="true"]{opacity:0.38}

    .controls{display:flex;gap:8px}
    button.btn{padding:8px 12px;border-radius:10px;background:var(--accent);color:white;border:0;cursor:pointer}
    button.ghost{background:transparent;border:1px solid #ddd;color:var(--muted)}

    aside{padding:12px;border-left:1px dashed #eee}
    .voice-row{display:flex;gap:8px;align-items:center}
    select{padding:8px;border-radius:8px}

    .flashcard{margin-top:12px;padding:12px;background:#fff;border-radius:10px;border:1px solid #eee;display:flex;align-items:center;justify-content:space-between}

    footer{grid-column:1/-1;text-align:center;color:var(--muted);margin-top:6px;font-size:13px}

    @media (max-width:920px){.app{grid-template-columns:1fr;}.letter-grid{grid-template-columns:repeat(7,1fr)}}
  </style>
</head>
<body>
  <div class="app" role="application" aria-label="Read and Play">
    <header>
      <h1>Read & Play</h1>
      <div id="level-badge">Level 1</div>
    </header>

    <main class="main">
      <div class="letter-grid" aria-hidden="true"></div>

      <section class="game" aria-live="polite">
        <div class="pic-row">
          <img id="pic" class="pic" src="" alt="emoji" />
          <div class="meta">
            <div id="msg">Welcome!</div>
            <div id="word-length" style="color:var(--muted);font-size:13px"></div>
          </div>
        </div>

        <div id="slots" class="slots" aria-label="Word slots" tabindex="0"></div>
        <div id="letters-pool" class="pool" aria-label="Letter pool"></div>

        <div class="controls">
          <button id="check-btn" class="btn">Check</button>
          <button id="shuffle-btn" class="ghost">Shuffle</button>
          <button id="hint-btn" class="ghost">Hint</button>
          <button id="next-btn" class="ghost">Skip</button>
        </div>
      </section>
    </main>

    <aside>
      <div class="voice-row">
        <label for="voice-select">Voice</label>
        <select id="voice-select" aria-label="Select voice"></select>
        <button id="speak-word" class="ghost">Speak</button>
      </div>

      <div class="flashcard" role="group" aria-label="Sight words">
        <div id="card" style="font-weight:700">the</div>
        <button id="next-card" class="ghost">Next</button>
      </div>

      <div style="margin-top:12px;color:var(--muted);font-size:13px">
        Tip: click letters or use keyboard. Backspace removes the last filled slot.
      </div>
    </aside>

    <footer>Built for learning — drag & drop + keyboard + speech</footer>
  </div>

  <script>
    // ALL your original JS goes here (clean and un-duplicated)
    // I did not alter anything except removing broken duplicated code

    // ---------- DATA ----------
    const levels = [
      [ { word: 'cat', pic: '🐱' },{ word: 'dog', pic: '🐶' },{ word: 'sun', pic: '☀️' },{ word: 'bat', pic: '🦇' },{ word: 'car', pic: '🚗' },{ word: 'cup', pic: '☕' },{ word: 'fox', pic: '🦊' },{ word: 'hat', pic: '🎩' },{ word: 'pen', pic: '🖊️' },{ word: 'egg', pic: '🥚' } ],
      [ { word: 'fish', pic: '🐟' },{ word: 'book', pic: '📖' },{ word: 'star', pic: '⭐' },{ word: 'tree', pic: '🌳' },{ word: 'milk', pic: '🥛' },{ word: 'cake', pic: '🍰' },{ word: 'lion', pic: '🦁' },{ word: 'bear', pic: '🐻' },{ word: 'moon', pic: '🌙' },{ word: 'leaf', pic: '🍃' } ]
    ];

    let currentLevel = 0;
    let currentWord = null;
    let voices = [];
    let selectedVoiceName = '';

    const letterGrid = document.querySelector('.letter-grid');
    const slotsEl = document.getElementById('slots');
    const poolEl = document.getElementById('letters-pool');
    const checkBtn = document.getElementById('check-btn');
    const msg = document.getElementById('msg');
    const pic = document.getElementById('pic');
    const voiceSelect = document.getElementById('voice-select');
    const speakWordBtn = document.getElementById('speak-word');
    const levelBadge = document.getElementById('level-badge');
    const wordLengthEl = document.getElementById('word-length');

    function shuffleArray(a){const arr=[...a];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j]]}return arr}

    function loadVoices(){voices = speechSynthesis.getVoices().filter(v=>v.lang.startsWith('en') || v.lang==='');voiceSelect.innerHTML='';voices.forEach(v=>{const opt=document.createElement('option');opt.value=

