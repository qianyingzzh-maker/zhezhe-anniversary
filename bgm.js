(() => {
  const audio = document.getElementById('anniversary-bgm');
  const button = document.getElementById('bgm-toggle');
  let enabled = true;
  let pending = false;
  audio.volume = 0.45;
  const render = () => {
    const playing = !audio.paused && !audio.ended;
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? '关闭背景音乐' : '播放背景音乐');
    button.title = playing ? '关闭背景音乐 · TINY 7《浆果》' : '播放背景音乐 · TINY 7《浆果》';
  };
  const start = () => {
    if (!enabled || pending || !audio.paused) return;
    pending = true;
    audio.play().then(() => {
      if (!enabled) audio.pause();
      render();
    }).catch(() => { render(); }).finally(() => { pending = false; });
  };
  button.addEventListener('click', () => {
    if (enabled && (pending || !audio.paused)) {
      enabled = false;
      audio.pause();
      render();
    } else {
      enabled = true;
      start();
    }
  });
  const unlock = event => {
    if (button.contains(event.target)) return;
    start();
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('error', () => {
    button.classList.remove('is-playing');
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', '音乐加载失败，点击重试');
    button.title = '音乐加载失败，点击重试';
  });
  render();
  start();
})();
