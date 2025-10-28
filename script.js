(function () {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (!params.get('overlay')) return;
  const canvas = document.querySelector('.canvas');
  if (!canvas) return;
  canvas.classList.add('debug-overlay');
})();
(function () {
  if (typeof window === 'undefined') return;
  const baseWidth = 1920;
  const baseHeight = 1080;
  const scaled = document.querySelector('.scaled');
  if (!scaled) return;

  function resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / baseWidth, vh / baseHeight);
    scaled.style.transform = 'scale(' + scale + ')';
  }

  window.addEventListener('resize', resize);
  resize();
})();

(function () {
  if (typeof window === 'undefined') return;
  const body = document.body;
  const divergenceEl = document.getElementById('divergenceValue');
  const powerBtn = document.getElementById('powerBtn');
  const worldlineToggle = document.getElementById('worldlineToggle');
  const terminalFab = document.getElementById('terminalFab');
  const consoleClose = document.getElementById('consoleClose');
  const consoleBackdrop = document.getElementById('consoleBackdrop');
  const consoleEl = document.getElementById('console');
  const consoleOutput = document.getElementById('consoleOutput');
  const consoleForm = document.getElementById('consoleForm');
  const consoleCmd = document.getElementById('consoleCmd');

  requestAnimationFrame(function () { body.classList.add('ready'); });
  const contactRows = document.querySelectorAll('.contact-row');
  const copyNotification = document.getElementById('copyNotification');
  
  contactRows.forEach(function(row) {
    row.addEventListener('click', function() {
      const textSpan = row.querySelector('span');
      if (!textSpan) return;
      
      const text = textSpan.textContent.trim();
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
          showCopyNotification(row);
        }).catch(function() {
          fallbackCopy(text, row);
        });
      } else {
        fallbackCopy(text, row);
      }
    });
  });
  
  function fallbackCopy(text, row) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showCopyNotification(row);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textarea);
  }
  
  function showCopyNotification(row) {
    if (!copyNotification) return;
    
    const rowRect = row.getBoundingClientRect();
    const contactsRect = row.parentElement.getBoundingClientRect();
    const offsetTop = rowRect.top - contactsRect.top + (rowRect.height / 2) - (copyNotification.offsetHeight / 2);
    
    copyNotification.style.top = offsetTop + 'px';
    copyNotification.classList.add('show');
    
    setTimeout(function() {
      copyNotification.classList.remove('show');
    }, 1500);
  }

  const experienceToggle = document.getElementById('experienceToggle');
  const experienceContent = document.getElementById('experienceContent');
  
  if (experienceToggle && experienceContent) {
    experienceToggle.addEventListener('click', function() {
      experienceToggle.classList.toggle('collapsed');
      experienceContent.classList.toggle('collapsed');
    });
  }

  const scrollWrapper = document.querySelector('.content-scroll-wrapper');
  const scrollInner = document.querySelector('.content-scroll-inner');
  
  if (scrollWrapper && scrollInner) {
    scrollInner.addEventListener('scroll', function() {
      const scrollTop = scrollInner.scrollTop;
      const scrollHeight = scrollInner.scrollHeight;
      const clientHeight = scrollInner.clientHeight;
      
      if (scrollTop > 10) {
        scrollWrapper.classList.add('scrolled');
      } else {
        scrollWrapper.classList.remove('scrolled');
      }
      
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        scrollWrapper.classList.add('at-bottom');
      } else {
        scrollWrapper.classList.remove('at-bottom');
      }
    });
  }

  const skillsSection = document.querySelector('.skills');
  const skillBarItems = document.querySelectorAll('.skill-bar-item');
  
  if (skillsSection && skillBarItems.length > 0) {
    let skillsAnimated = false;
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !skillsAnimated) {
          skillsAnimated = true;
          skillBarItems.forEach(function(item, index) {
            setTimeout(function() {
              const level = item.getAttribute('data-level');
              const fill = item.querySelector('.skill-bar-fill');
              if (fill && level) {
                fill.style.width = level + '%';
              }
            }, index * 150);
          });
        }
      });
    }, {
      threshold: 0.3
    });
    
    observer.observe(skillsSection);
  }

  if (!divergenceEl || !powerBtn || !worldlineToggle) return;
  let audioCtx = null;
  let ambientSource = null;
  let startupPlayed = false;

  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }

  function playStartup() {
    if (!audioCtx || startupPlayed) return;
    startupPlayed = true;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.value = 220;
    g.gain.value = 0.0001;
    o.connect(g).connect(audioCtx.destination);
    o.start();
    const now = audioCtx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.06, now + 0.05);
    o.frequency.exponentialRampToValueAtTime(660, now + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    o.stop(now + 0.72);
  }

  function playClick(freq) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq || 440;
    g.gain.value = 0.0001;
    o.connect(g).connect(audioCtx.destination);
    o.start();
    const now = audioCtx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    o.stop(now + 0.09);
  }

  function startAmbient() {
    if (!audioCtx || ambientSource) return;
    const o = audioCtx.createOscillator();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    const g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 110;
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 4;
    lfo.connect(lfoGain).connect(o.frequency);
    g.gain.value = 0.015;
    o.connect(g).connect(audioCtx.destination);
    o.start(); lfo.start();
    ambientSource = { o, lfo, lfoGain, g };
  }

  function stopAmbient() {
    if (!ambientSource) return;
    try { ambientSource.o.stop(); ambientSource.lfo.stop(); } catch (e) {}
    ambientSource = null;
  }

  function setDivergence(v) {
    if (!divergenceEl) return;
    const target = Number(v).toFixed(6);
    divergenceEl.textContent = target;
  }

  function randomDivergence(alpha) {
    const base = alpha ? 1.04 : 0.57;
    const jitter = (Math.random() * 0.01);
    return (base + jitter).toFixed(6);
  }

  function updateWorldlineClass() {
    if (worldlineToggle.checked) {
      body.classList.add('worldline-beta');
    } else {
      body.classList.remove('worldline-beta');
    }
  }

  powerBtn.addEventListener('click', function () {
    initAudio();
    if (body.classList.toggle('powered')) {
      playStartup();
      startAmbient();
    } else {
      stopAmbient();
    }
    powerBtn.setAttribute('aria-pressed', body.classList.contains('powered') ? 'true' : 'false');
  });

  worldlineToggle.addEventListener('change', function () {
    updateWorldlineClass();
    setDivergence(randomDivergence(!worldlineToggle.checked));
    playClick(worldlineToggle.checked ? 520 : 380);
  });
  updateWorldlineClass();

  function printLine(text, opts) {
    if (!consoleOutput) return;
    const line = document.createElement('div');
    if (opts && opts.color) line.style.color = opts.color;
    if (opts && opts.animate) {
      let i = 0;
      const interval = setInterval(function() {
        if (i < text.length) {
          line.textContent += text[i++];
        } else {
          clearInterval(interval);
        }
      }, 20);
    } else {
      line.textContent = text;
    }
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  const commands = {
    help() {
      printLine("Available commands:");
      printLine("  help     - show this help");
      printLine("  time     - show current time");
      printLine("  accent   - change accent color");
      printLine("  clear    - clear terminal");
    },
    time() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {hour12: false});
      const dateStr = now.toLocaleDateString('en-US');
      printLine('Local time: ' + timeStr);
      printLine('Date: ' + dateStr);
    },
    accent() {
      const currentAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#88ddcc';
      printLine('Current accent color: ' + currentAccent);
      printLine('Select new accent (live preview):');
      
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display: flex; align-items: center; gap: 12px; margin: 8px 0;';
      
      const colorPicker = document.createElement('input');
      colorPicker.type = 'color';
      colorPicker.value = currentAccent;
      colorPicker.style.cssText = 'cursor: pointer; width: 60px; height: 40px; border: 1px solid var(--accent); background: transparent;';
      
      const hexDisplay = document.createElement('span');
      hexDisplay.textContent = currentAccent;
      hexDisplay.style.cssText = 'font-family: "Share Tech Mono", monospace; color: var(--accent); font-size: 14px;';
      
      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'Reset';
      resetBtn.style.cssText = 'padding: 8px 16px; background: var(--accent-dim); color: var(--text); border: 1px solid var(--accent); cursor: pointer; font-family: "Share Tech Mono", monospace; transition: all 0.2s;';
      resetBtn.onmouseover = () => resetBtn.style.background = 'var(--accent)';
      resetBtn.onmouseout = () => resetBtn.style.background = 'var(--accent-dim)';
      resetBtn.onclick = () => {
        document.documentElement.style.removeProperty('--accent');
        document.documentElement.style.removeProperty('--accent-dim');
        const defaultAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
        colorPicker.value = defaultAccent;
        hexDisplay.textContent = defaultAccent;
        printLine('Accent reset to default: ' + defaultAccent);
      };
      
      colorPicker.addEventListener('input', (e) => {
        const newAccent = e.target.value;
        document.documentElement.style.setProperty('--accent', newAccent);
        const dimColor = newAccent + '44';
        document.documentElement.style.setProperty('--accent-dim', dimColor);
        hexDisplay.textContent = newAccent;
      });
      
      wrapper.appendChild(colorPicker);
      wrapper.appendChild(hexDisplay);
      wrapper.appendChild(resetBtn);
      
      if (consoleOutput) {
        consoleOutput.appendChild(wrapper);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
      }
    },
    clear() { if (consoleOutput) consoleOutput.textContent = ''; },
  };

  let consoleInitialized = false;
  function openConsole() {
    if (!consoleBackdrop) return;
    consoleBackdrop.classList.add('open');
    consoleBackdrop.setAttribute('aria-hidden', 'false');
    if (!consoleInitialized) {
      consoleInitialized = true;
      setTimeout(function() {
        commands.help();
      }, 50);
    }
    setTimeout(function(){ consoleCmd?.focus(); }, 320);
  }
  function closeConsole() {
    if (!consoleBackdrop) return;
    consoleBackdrop.classList.remove('open');
    consoleBackdrop.setAttribute('aria-hidden', 'true');
  }
  terminalFab?.addEventListener('click', openConsole);
  consoleClose?.addEventListener('click', closeConsole);
  consoleBackdrop?.addEventListener('click', function(e) {
    if (e.target === consoleBackdrop) closeConsole();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && consoleBackdrop?.classList.contains('open')) {
      closeConsole();
    }
  });

  consoleForm?.addEventListener('submit', function (e) {
    e.preventDefault();
    const value = (consoleCmd?.value || '').trim();
    if (!value) return;
    printLine('> ' + value);
    const [cmd] = value.split(/\s+/);
    if (commands[cmd]) {
      commands[cmd]();
    } else {
      printLine('command not found: ' + cmd);
    }
    consoleCmd.value = '';
  });
})();

