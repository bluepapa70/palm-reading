(() => {
  // ===== State =====
  let currentFile = null;
  let currentDataURL = null;
  let mediaStream = null;
  let currentLuckyNumber = 7;
  let lastResultData = null;
  let lastLottoNumbers = null;

  // ===== DOM References =====
  const views = {
    upload: document.getElementById('view-upload'),
    preview: document.getElementById('view-preview'),
    loading: document.getElementById('view-loading'),
    results: document.getElementById('view-results'),
  };

  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const uploadBtn = document.getElementById('uploadBtn');
  const previewImage = document.getElementById('previewImage');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  const restartBtn = document.getElementById('restartBtn');

  const cameraModal = document.getElementById('cameraModal');
  const videoFeed = document.getElementById('videoFeed');
  const captureCanvas = document.getElementById('captureCanvas');
  const captureBtn = document.getElementById('captureBtn');
  const closeCameraBtn = document.getElementById('closeCameraBtn');
  const modalBackdrop = cameraModal.querySelector('.modal-backdrop');

  const overallText = document.getElementById('overallText');
  const linesContainer = document.getElementById('linesContainer');
  const fortuneText = document.getElementById('fortuneText');
  const luckyItemsEl = document.getElementById('luckyItems');
  const lottoBtn = document.getElementById('lottoBtn');
  const lottoBalls = document.getElementById('lottoBalls');
  const shareBtn = document.getElementById('shareBtn');

  // ===== Stars Canvas =====
  function initStars() {
    const canvas = document.getElementById('starsCanvas');
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createStars() {
      const count = Math.floor((canvas.width * canvas.height) / 6000);
      stars = Array.from({ length: Math.min(count, 200) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.2,
        alpha: Math.random(),
        speed: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.alpha += s.speed;
        if (s.alpha > 1) { s.alpha = 1; s.speed *= -1; }
        if (s.alpha < 0) { s.alpha = 0; s.speed *= -1; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 213, 255, ${s.alpha})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();
    window.addEventListener('resize', () => { resize(); createStars(); });
  }

  // ===== View Navigation =====
  function showView(id) {
    for (const [key, el] of Object.entries(views)) {
      el.classList.toggle('active', key === id);
    }
    if (id === 'results') {
      views.results.scrollTop = 0;
      renderReactions();
    }
  }

  // ===== File Handling =====
  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일을 선택해 주세요.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          currentFile = blob;
          currentDataURL = canvas.toDataURL('image/png');
          previewImage.src = currentDataURL;
          showView('preview');
        }, 'image/png');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    handleFile(fileInput.files[0]);
    fileInput.value = '';
  });

  // ===== Camera =====

  captureBtn.addEventListener('click', () => {
    captureCanvas.width = videoFeed.videoWidth;
    captureCanvas.height = videoFeed.videoHeight;
    captureCanvas.getContext('2d').drawImage(videoFeed, 0, 0);
    captureCanvas.toBlob((blob) => {
      stopCamera();
      cameraModal.classList.add('hidden');
      currentFile = blob;
      currentDataURL = captureCanvas.toDataURL('image/jpeg');
      previewImage.src = currentDataURL;
      showView('preview');
    }, 'image/jpeg', 0.92);
  });

  function stopCamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
    videoFeed.srcObject = null;
  }

  closeCameraBtn.addEventListener('click', () => {
    stopCamera();
    cameraModal.classList.add('hidden');
  });

  modalBackdrop.addEventListener('click', () => {
    stopCamera();
    cameraModal.classList.add('hidden');
  });

  // ===== Preview Controls =====
  retakeBtn.addEventListener('click', () => {
    currentFile = null;
    currentDataURL = null;
    previewImage.src = '';
    showView('upload');
  });

  // ===== Analysis =====
  analyzeBtn.addEventListener('click', async () => {
    if (!currentFile || analyzeBtn.disabled) return;

    analyzeBtn.disabled = true;
    showView('loading');

    const formData = new FormData();
    formData.append('palmImage', currentFile, currentFile.name || 'palm.jpg');

    try {
      const response = await fetch('/api/palm/', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        showView('upload');
        alert(result.error || '분석에 실패했습니다. 다시 시도해 주세요.');
        analyzeBtn.disabled = false;
        return;
      }

      renderResults(result.data);
      showView('results');
    } catch {
      showView('upload');
      alert('서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }

    analyzeBtn.disabled = false;
  });

  // ===== Results Rendering =====
  function renderResults(data) {
    lastResultData = data;
    overallText.textContent = data.overall || '';
    fortuneText.textContent = data.fortune || '';

    linesContainer.innerHTML = '';
    for (const line of Object.values(data.lines || {})) {
      const card = document.createElement('div');
      card.className = 'line-card';
      card.innerHTML = `
        <div class="line-header">
          <span class="line-emoji">${escapeHtml(line.emoji || '')}</span>
          <span class="line-name">${escapeHtml(line.name || '')}</span>
          <span class="line-score">${Number(line.score) || 0}/10</span>
        </div>
        <div class="score-bar">
          <div class="score-fill" data-score="${Number(line.score) || 0}"></div>
        </div>
        <p class="line-interpretation">${escapeHtml(line.interpretation || '')}</p>
      `;
      linesContainer.appendChild(card);
    }

    const { color = '', number = '', direction = '' } = data.luckyItems || {};
    const luckyNum = parseInt(number, 10);
    if (luckyNum >= 1 && luckyNum <= 45) currentLuckyNumber = luckyNum;
    lottoBalls.innerHTML = '';

    luckyItemsEl.innerHTML = `
      <div class="lucky-item">
        <span class="lucky-label">색상</span>
        <span class="lucky-value">${escapeHtml(String(color))}</span>
      </div>
      <div class="lucky-item">
        <span class="lucky-label">숫자</span>
        <span class="lucky-value">${escapeHtml(String(number))}</span>
      </div>
      <div class="lucky-item">
        <span class="lucky-label">방향</span>
        <span class="lucky-value">${escapeHtml(String(direction))}</span>
      </div>
    `;

    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll('.score-fill').forEach((el) => {
          const score = parseInt(el.dataset.score, 10);
          el.style.width = `${Math.min(Math.max(score, 0), 10) * 10}%`;
        });
      }, 200);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ===== Share / Save =====
  function drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    const chars = [...(text || '')];
    const lines = [];
    let line = '';
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line.length > 0) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  async function buildShareCanvas(data) {
    await document.fonts.ready;

    const W = 750;
    const P = 44;
    const tmp = document.createElement('canvas');
    tmp.width = W;
    tmp.height = 1;
    const tmpCtx = tmp.getContext('2d');

    const OVERALL_FONT = '27px "Noto Serif KR", serif';
    const FORTUNE_FONT = '25px "Noto Serif KR", serif';
    const INTERP_FONT = '22px "Noto Sans KR", sans-serif';
    tmpCtx.font = OVERALL_FONT;
    const overallLines = wrapText(tmpCtx, data.overall, W - P * 2);
    tmpCtx.font = FORTUNE_FONT;
    const fortuneLines = wrapText(tmpCtx, data.fortune, W - P * 2);
    tmpCtx.font = INTERP_FONT;
    const lineValues = Object.values(data.lines || {}).map((line) => ({
      ...line,
      interpLines: wrapText(tmpCtx, line.interpretation || '', W - P * 2).slice(0, 3),
    }));

    const lineBlockH = lineValues.reduce(
      (sum, line) => sum + 30 + 30 + line.interpLines.length * 28 + 14,
      0
    );

    const lottoSectionH = lastLottoNumbers ? 28 + 44 + 56 + 14 : 0; // sep + title + balls + margin

    const H =
      P + 130 + 52 + 40 + 28 +             // header: emoji, title, tagline, sep
      overallLines.length * 38 + 8 + 28 +  // overall + sep
      lineBlockH + 4 + 28 +                // lines + sep
      42 + fortuneLines.length * 36 + 8 + 28 + // fortune + sep
      44 + 3 * 44 +                         // lucky items
      lottoSectionH +
      P;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a0a2e');
    bg.addColorStop(1, '#0a0418');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.save();
    let seed = 42;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };
    for (let i = 0; i < 80; i++) {
      const alpha = rng() * 0.5 + 0.2;
      ctx.fillStyle = `rgba(232,213,255,${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(rng() * W, rng() * H, rng() * 1.8 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    let y = P;

    const sep = () => {
      ctx.strokeStyle = 'rgba(176,106,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(P, y);
      ctx.lineTo(W - P, y);
      ctx.stroke();
      y += 28;
    };

    // Header
    ctx.font = '72px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('🔮', W / 2, y + 74);
    y += 130;

    ctx.font = 'bold 46px "Noto Serif KR", serif';
    ctx.fillStyle = '#e8d5ff';
    ctx.fillText('운명의 손금', W / 2, y);
    y += 52;

    ctx.font = '23px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'rgba(176,106,255,0.7)';
    ctx.fillText('palm-reading.pages.dev', W / 2, y);
    y += 40;
    sep();

    // Overall
    ctx.font = OVERALL_FONT;
    ctx.fillStyle = 'rgba(232,213,255,0.88)';
    ctx.textAlign = 'left';
    for (const line of overallLines.slice(0, 4)) {
      ctx.fillText(line, P, y);
      y += 38;
    }
    y += 8;
    sep();

    // Lines
    for (const line of lineValues) {
      const score = Number(line.score) || 0;

      ctx.font = '28px serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.fillText(line.emoji || '', P, y + 22);

      ctx.font = 'bold 26px "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#e8d5ff';
      ctx.fillText(line.name || '', P + 42, y + 22);

      ctx.font = 'bold 26px "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#c08aff';
      ctx.textAlign = 'right';
      ctx.fillText(`${score}/10`, W - P, y + 22);
      y += 30;

      const bx = P, bw = W - P * 2, bh = 10;
      ctx.fillStyle = 'rgba(176,106,255,0.15)';
      drawRoundRect(ctx, bx, y, bw, bh, 5);
      ctx.fill();

      if (score > 0) {
        const sw = bw * (score / 10);
        const g = ctx.createLinearGradient(bx, 0, bx + sw, 0);
        g.addColorStop(0, '#8040cc');
        g.addColorStop(1, '#ff80c0');
        ctx.fillStyle = g;
        drawRoundRect(ctx, bx, y, sw, bh, 5);
        ctx.fill();
      }
      y += 30;

      ctx.font = INTERP_FONT;
      ctx.fillStyle = 'rgba(200,180,240,0.78)';
      ctx.textAlign = 'left';
      for (const iLine of line.interpLines) {
        ctx.fillText(iLine, P, y);
        y += 28;
      }
      y += 14;
    }
    y += 4;
    sep();

    // Fortune
    ctx.font = 'bold 28px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'left';
    ctx.fillText('🌟 이번 달 운세', P, y);
    y += 42;

    ctx.font = FORTUNE_FONT;
    ctx.fillStyle = 'rgba(232,213,255,0.88)';
    for (const line of fortuneLines.slice(0, 3)) {
      ctx.fillText(line, P, y);
      y += 36;
    }
    y += 8;
    sep();

    // Lucky items
    ctx.font = 'bold 28px "Noto Sans KR", sans-serif';
    ctx.fillStyle = '#7cfc00';
    ctx.textAlign = 'left';
    ctx.fillText('🍀 행운의 아이템', P, y);
    y += 44;

    const lucky = data.luckyItems || {};
    for (const [label, value] of [
      ['색상', String(lucky.color || '-')],
      ['숫자', String(lucky.number || '-')],
      ['방향', String(lucky.direction || '-')],
    ]) {
      ctx.font = '26px "Noto Sans KR", sans-serif';
      ctx.fillStyle = 'rgba(176,106,255,0.7)';
      ctx.textAlign = 'left';
      ctx.fillText(label, P, y);
      const lw = ctx.measureText(label).width;
      ctx.fillStyle = '#e8d5ff';
      ctx.fillText(value, P + lw + 20, y);
      y += 44;
    }

    // Lotto numbers (only if generated)
    if (lastLottoNumbers) {
      sep();

      ctx.font = 'bold 28px "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'left';
      ctx.fillText('🎰 행운의 로또 번호', P, y);
      y += 44;

      const ballR = 28;
      const ballGap = 18;
      const totalW = lastLottoNumbers.length * (ballR * 2) + (lastLottoNumbers.length - 1) * ballGap;
      let bx = (W - totalW) / 2 + ballR;

      for (const n of lastLottoNumbers) {
        const isLucky = n === currentLuckyNumber;
        const g = ctx.createRadialGradient(bx - 8, y + ballR - 8, 3, bx, y + ballR, ballR);
        if (isLucky) {
          g.addColorStop(0, '#ffee66');
          g.addColorStop(1, '#ff8c00');
        } else {
          g.addColorStop(0, '#cc88ff');
          g.addColorStop(1, '#6020aa');
        }
        ctx.beginPath();
        ctx.arc(bx, y + ballR, ballR, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.font = `bold ${n >= 10 ? '21' : '23'}px "Noto Sans KR", sans-serif`;
        ctx.fillStyle = isLucky ? '#1a0a2e' : '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(String(n), bx, y + ballR + 8);

        bx += ballR * 2 + ballGap;
      }
      y += ballR * 2 + 14;
    }

    return canvas;
  }

  shareBtn.addEventListener('click', async () => {
    if (!lastResultData || shareBtn.disabled) return;
    shareBtn.disabled = true;
    const orig = shareBtn.innerHTML;
    shareBtn.innerHTML = '<span class="btn-icon">⏳</span> 생성 중...';
    try {
      const canvas = await buildShareCanvas(lastResultData);
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      const file = new File([blob], '운명의손금.png', { type: 'image/png' });

      const shareText = lastLottoNumbers
        ? '운명의 손금\n👉 https://palm-reading.pages.dev\n\n통계왕 AI Lotto\n🎰 https://ailottoo.pages.dev/'
        : '운명의 손금\n👉 https://palm-reading.pages.dev';

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '손금으로 알아보는 나의 운명',
          text: shareText,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: '손금으로 알아보는 나의 운명',
          text: shareText,
          url: 'https://palm-reading.pages.dev',
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '운명의손금.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch (err) {
      if (err.name !== 'AbortError') alert('공유 중 오류가 발생했습니다.');
    } finally {
      shareBtn.disabled = false;
      shareBtn.innerHTML = orig;
    }
  });

  // ===== Lotto =====
  function generateLottoNumbers(luckyNum) {
    const nums = new Set([luckyNum]);
    while (nums.size < 6) {
      nums.add(Math.floor(Math.random() * 45) + 1);
    }
    return [...nums].sort((a, b) => a - b);
  }

  function renderLottoBalls(numbers, luckyNum) {
    lottoBalls.innerHTML = '';
    numbers.forEach((n, i) => {
      const ball = document.createElement('span');
      ball.className = 'lotto-ball' + (n === luckyNum ? ' lucky' : '');
      ball.textContent = n;
      ball.style.animationDelay = `${i * 60}ms`;
      lottoBalls.appendChild(ball);
    });
  }

  lottoBtn.addEventListener('click', () => {
    const numbers = generateLottoNumbers(currentLuckyNumber);
    lastLottoNumbers = numbers;
    renderLottoBalls(numbers, currentLuckyNumber);
  });

  // ===== Reactions =====
  const REACTION_KEY = 'palmReactions';

  function loadReactions() {
    try {
      return JSON.parse(localStorage.getItem(REACTION_KEY)) || { counts: {}, selected: null };
    } catch {
      return { counts: {}, selected: null };
    }
  }

  function saveReactions(state) {
    localStorage.setItem(REACTION_KEY, JSON.stringify(state));
  }

  function renderReactions() {
    const state = loadReactions();
    document.querySelectorAll('.reaction-btn').forEach((btn) => {
      const type = btn.dataset.type;
      const count = state.counts[type] || 0;
      btn.querySelector('.reaction-count').textContent = count;
      btn.classList.toggle('selected', state.selected === type);
    });
  }

  document.querySelectorAll('.reaction-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const state = loadReactions();

      if (state.selected === type) {
        state.counts[type] = Math.max((state.counts[type] || 1) - 1, 0);
        state.selected = null;
      } else {
        if (state.selected) {
          state.counts[state.selected] = Math.max((state.counts[state.selected] || 1) - 1, 0);
        }
        state.counts[type] = (state.counts[type] || 0) + 1;
        state.selected = type;
      }

      saveReactions(state);
      renderReactions();

      btn.classList.add('pop');
      btn.addEventListener('animationend', () => btn.classList.remove('pop'), { once: true });
    });
  });

  // ===== Restart =====
  restartBtn.addEventListener('click', () => {
    currentFile = null;
    currentDataURL = null;
    previewImage.src = '';
    linesContainer.innerHTML = '';
    overallText.textContent = '';
    fortuneText.textContent = '';
    luckyItemsEl.innerHTML = '';
    lottoBalls.innerHTML = '';
    lastLottoNumbers = null;
    analyzeBtn.disabled = false;
    showView('upload');
  });

  // ===== Copy Homepage Link =====
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const copyToast = document.createElement('div');
  copyToast.className = 'copy-toast';
  copyToast.textContent = '🔗 링크가 복사되었습니다!';
  document.body.appendChild(copyToast);

  let toastTimer = null;
  copyLinkBtn.addEventListener('click', async () => {
    const url = 'https://palm-reading.pages.dev/';
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    copyToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => copyToast.classList.remove('show'), 2000);
  });

  // ===== Init =====
  initStars();
})();
