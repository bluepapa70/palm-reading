(() => {
  // ===== State =====
  let currentFile = null;
  let currentDataURL = null;
  let mediaStream = null;

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
  const cameraBtn = document.getElementById('cameraBtn');
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
    currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentDataURL = e.target.result;
      previewImage.src = currentDataURL;
      showView('preview');
    };
    reader.readAsDataURL(file);
  }

  // Drop zone events
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
  cameraBtn.addEventListener('click', async () => {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
    } catch {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch {
        alert('카메라에 접근할 수 없습니다. 브라우저 권한을 확인해 주세요.');
        return;
      }
    }
    videoFeed.srcObject = mediaStream;
    cameraModal.classList.remove('hidden');
  });

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
    const filename = currentFile.name || 'palm.jpg';
    formData.append('palmImage', currentFile, filename);

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
    overallText.textContent = data.overall || '';
    fortuneText.textContent = data.fortune || '';

    // Line cards
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

    // Lucky items
    const { color = '', number = '', direction = '' } = data.luckyItems || {};
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

    // Animate score bars after DOM paint
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
    analyzeBtn.disabled = false;
    showView('upload');
  });

  // ===== Init =====
  initStars();
})();
