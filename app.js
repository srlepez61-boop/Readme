document.addEventListener('DOMContentLoaded', () => {
  const screens = document.querySelectorAll('.screen');
  const menuButtons = document.querySelectorAll('.menu-btn');
  const backButtons = document.querySelectorAll('.nav-back');
  const rewardOverlay = document.getElementById('reward-overlay');
  const closeReward = document.getElementById('close-reward');

  // Show one screen
  function showScreen(id) {
    screens.forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
  }

  // Menu navigation
  menuButtons.forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.screen)));

  // Back buttons
  backButtons.forEach(btn => btn.addEventListener('click', () => showScreen('menu')));

  // Show reward overlay
  function showReward(text='You did it!') {
    rewardOverlay.querySelector('#reward-text').textContent = text;
    rewardOverlay.classList.remove('hidden');
    rewardOverlay.setAttribute('aria-hidden','false');
    closeReward.focus();
  }

  // Close reward overlay
  closeReward.addEventListener('click', () => {
    rewardOverlay.classList.add('hidden');
    rewardOverlay.setAttribute('aria-hidden','true');
    showScreen('menu');
  });

  // Initialize
  showScreen('menu');

  // Example: automatically show reward for testing
  // showReward('Congratulations!');
});
