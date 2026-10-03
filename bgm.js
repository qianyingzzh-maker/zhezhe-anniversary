(() => {
  const audio = document.getElementById('anniversary-bgm');
  const button = document.getElementById('bgm-toggle');
  let enabled = true;
  let pending = false;
  audio.volume = 0.45;
  const simplifyPostcardEntry = () => {
    document.querySelectorAll('.postcard-open').forEach(entry => {
      const label = entry.textContent.replace(/[↗\uFE0F]/g, '').trim();
      if (entry.textContent !== label) entry.textContent = label;
    });
  };
  let routeFrame;
  const drawPostcardRoute = () => {
    const host = document.querySelector('.book-postcards');
    if (!host || window.innerWidth <= 760) return;
    const cards = [...host.querySelectorAll('.book-postcard')];
    const entries = cards.map(card => card.querySelector('.postcard-open'));
    if (entries.length !== 3 || entries.some(entry => !entry)) return;
    let svg = host.querySelector('.postcard-thread');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('postcard-thread');
      svg.setAttribute('aria-hidden', 'true');
      host.appendChild(svg);
    }
    const bounds = host.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const points = entries.map(entry => {
      const rect = entry.getBoundingClientRect();
      return {x:rect.left + rect.width / 2 - bounds.left, y:rect.bottom + 7 - bounds.top};
    });
    const [a,b,c] = points;
    const first = cards[0].getBoundingClientRect();
    const startX = first.left - bounds.left + 18;
    const bendX = Math.min(bounds.width - 6, Math.max(a.x,b.x) + 24);
    const d = `M ${startX} ${a.y + 10} Q ${(startX+a.x)/2} ${a.y+13} ${a.x} ${a.y} C ${bendX} ${a.y} ${bendX} ${b.y-25} ${b.x} ${b.y} C ${b.x+18} ${b.y+38} ${c.x+55} ${c.y-12} ${c.x} ${c.y}`;
    svg.innerHTML = `<path d="${d}"/>` + points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="3"/>`).join('');
  };
  const scheduleRoute = () => {
    cancelAnimationFrame(routeFrame);
    routeFrame = requestAnimationFrame(drawPostcardRoute);
  };
  window.addEventListener('resize', scheduleRoute);
  document.addEventListener('transitionend', scheduleRoute);
  document.addEventListener('animationend', scheduleRoute);
  document.addEventListener('load', scheduleRoute, true);
  simplifyPostcardEntry();
  scheduleRoute();
  new MutationObserver(records => { if (records.every(record => record.target.closest?.('.postcard-thread'))) return; simplifyPostcardEntry(); scheduleRoute(); }).observe(document.getElementById('root'), { childList: true, subtree: true });
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
  // A single quiet, dry click, generated locally without another sound file.
  let clickContext;
  let clickBuffer;
  document.addEventListener('click', () => {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      if (!clickContext) {
        clickContext = new Context();
        clickBuffer = clickContext.createBuffer(1, Math.ceil(clickContext.sampleRate * 0.018), clickContext.sampleRate);
        const samples = clickBuffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) {
          samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (samples.length * 0.13));
        }
      }
      const playClick = () => {
        const source = clickContext.createBufferSource();
        const gain = clickContext.createGain();
        const filter = clickContext.createBiquadFilter();
        source.buffer = clickBuffer;
        filter.type = 'lowpass';
        filter.frequency.value = 2400;
        gain.gain.value = 0.075;
        source.connect(filter).connect(gain).connect(clickContext.destination);
        source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
        source.start();
      };
      if (clickContext.state === 'suspended') clickContext.resume().then(playClick).catch(() => {});
      else if (clickContext.state === 'running') playClick();
    } catch (_) { /* Sound support must never block a page action. */ }
  }, true);
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
