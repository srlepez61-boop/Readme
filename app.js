document.addEventListener('DOMContentLoaded', () => {
  const screens = document.querySelectorAll('.screen');
  const menuButtons = document.querySelectorAll('.menu-btn');
  const backButtons = document.querySelectorAll('.nav-back');
  const rewardOverlay = document.getElementById('reward-overlay');
  const closeReward = document.getElementById('close-reward');

  function showScreen(id) {
    screens.forEach(screen => screen.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
  }

  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen));
  });

  backButtons.forEach(btn => btn.addEventListener('click', () => showScreen('menu')));

  function showReward(text = 'You did it!') {
    rewardOverlay.querySelector('#reward-text').textContent = text;
    rewardOverlay.classList.remove('hidden');
    rewardOverlay.setAttribute('aria-hidden', 'false');
    closeReward.focus();
  }

  closeReward.addEventListener('click', () => {
    rewardOverlay.classList.add('hidden');
    rewardOverlay.setAttribute('aria-hidden', 'true');
    showScreen('menu');
  });

  // Initialize
  showScreen('menu');
});
