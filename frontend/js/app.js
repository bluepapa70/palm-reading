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

  // ===== Palm Reading Data =====
  const PALM_DATA = {
    overall: [
      '당신의 손은 강한 의지와 따뜻한 감성이 조화롭게 공존하고 있습니다. 타고난 직관력과 실행력으로 주변 사람들의 신뢰를 받고 있으며, 삶에서 중요한 전환점들을 현명하게 극복해온 흔적이 역력합니다. 이번 해는 그동안 갈고닦은 능력들이 빛을 발하기 시작하는 시기로, 새로운 기회들이 연이어 찾아올 것입니다. 자신을 믿고 용감하게 도전한다면 원하는 목표를 달성할 수 있는 강운의 시기입니다.',
      '손금에서 독특하고 강한 개성이 드러납니다. 남들이 쉽게 걷지 않는 길을 선택하는 용기를 가진 분으로, 창의적인 사고와 실행력으로 자신만의 세계를 구축해가고 있습니다. 과거의 경험들이 현재의 당신을 더욱 깊고 풍요롭게 만들었으며, 앞으로의 삶에서 이 경험들이 큰 자산이 될 것입니다. 균형 잡힌 삶을 추구하면서도 열정을 잃지 않는 것이 행복의 비결입니다.',
      '당신의 손금은 풍요로운 감수성과 실용적인 능력이 균형을 이루는 아름다운 배열을 보여줍니다. 사람들과의 관계에서 진정성을 중요시하며, 당신 주변에는 항상 당신을 아끼는 귀한 인연들이 함께하고 있습니다. 때로는 힘든 시기가 있었지만 그 모든 것이 성장의 발판이 되었습니다. 앞으로의 여정에서 탁월한 감성과 능력이 더욱 빛을 발하게 될 것입니다.',
      '손의 전체적인 기운에서 강한 목적의식과 내면의 열정이 느껴집니다. 한번 마음먹은 일은 끝까지 해내는 집념과 끈기가 있어, 어떤 분야에서든 전문성을 쌓아가는 타입입니다. 현재 삶의 중요한 분기점에 서 있으며, 올바른 선택 하나가 앞으로의 10년을 바꿀 수 있는 시기입니다.',
    ],
    lines: {
      생명선: {
        emoji: '❤️',
        texts: [
          '생명선이 길고 선명하게 뻗어 있어 강한 생명력과 왕성한 활력을 지니고 있습니다. 건강에 대한 자기관리 능력이 뛰어나며 큰 질병 없이 장수할 가능성이 높습니다. 육체적으로도 정신적으로도 탄탄한 기반을 갖추고 있어 어떤 어려움도 이겨낼 힘이 있습니다.',
          '생명선에서 중요한 전환점이 보입니다. 생활 방식이나 환경의 큰 변화가 예상되나, 이는 오히려 더 나은 삶으로 도약하는 계기가 될 것입니다. 꾸준한 건강 관리와 규칙적인 생활 습관이 중요한 시기입니다.',
          '생명선이 넓게 호를 그리며 활기찬 에너지를 나타냅니다. 외부 활동을 즐기고 사람들과 어울리는 것을 좋아하는 사교적인 기질이 반영됩니다. 체력이 좋아 다양한 활동에서 두각을 나타낼 수 있습니다.',
          '생명선에서 회복력과 치유의 기운이 감지됩니다. 과거의 어려움을 극복하고 더욱 단단해진 내면의 힘이 느껴지며, 앞으로의 삶에서 건강과 활력이 더욱 충만해질 것입니다.',
        ],
      },
      감정선: {
        emoji: '💕',
        texts: [
          '감정선이 선명하고 깊게 새겨져 있어 감정이 풍부하고 사랑에 충실한 성격을 보여줍니다. 파트너에게 헌신적이며 진정한 사랑을 추구합니다. 이번 해 연애운이 상승세에 있어 중요한 인연을 만날 가능성이 있습니다.',
          '감정선에서 복잡한 감정의 흐름이 보입니다. 여러 번의 깊은 감정 경험을 통해 더욱 성숙한 사랑을 하게 될 것입니다. 현재 관계에서 진솔한 대화가 관계 발전의 열쇠가 됩니다.',
          '감정선이 부드럽게 곡선을 이루며 감성적이고 낭만적인 기질을 나타냅니다. 사람들의 감정에 민감하게 반응하는 공감 능력이 뛰어납니다. 직관적으로 상대방의 마음을 읽는 능력으로 인간관계가 원만합니다.',
          '감정선이 강하고 깊게 새겨져 있어 한번 맺은 인연을 소중히 여기는 성격임을 알 수 있습니다. 사랑하는 사람을 위해 기꺼이 희생할 수 있는 따뜻한 마음의 소유자로, 주변에 진정한 친구와 연인이 늘 함께할 것입니다.',
        ],
      },
      두뇌선: {
        emoji: '🧠',
        texts: [
          '두뇌선이 길고 뚜렷하게 뻗어 있어 뛰어난 지적 능력과 집중력을 나타냅니다. 논리적 사고와 분석력이 탁월하여 복잡한 문제도 체계적으로 해결하는 능력이 있습니다. 학문이나 전문 분야에서 두각을 나타낼 소질이 있습니다.',
          '두뇌선에서 창의적인 굴곡이 보입니다. 예술적 감수성과 창조적 사고력이 뛰어나며 독창적인 아이디어로 주변을 놀라게 할 재능이 있습니다. 상상력과 현실적인 판단력을 균형 있게 활용하면 큰 성과를 거둘 수 있습니다.',
          '두뇌선이 실용적인 방향으로 뻗어 있어 현실 감각이 뛰어나고 실용적인 사고방식을 가지고 있습니다. 경험에서 배우는 능력이 탁월하며, 새로운 기술이나 지식을 빠르게 습득하는 능력이 있습니다.',
          '두뇌선이 두 갈래로 나뉘어 있어 이성과 감성을 모두 균형 있게 활용하는 능력을 보여줍니다. 분석적 사고와 직관적 판단을 상황에 따라 유연하게 전환할 수 있어, 다양한 분야에서 뛰어난 성과를 낼 수 있습니다.',
        ],
      },
      운명선: {
        emoji: '⭐',
        texts: [
          '운명선이 뚜렷하게 나타나 강한 목적의식과 뚜렷한 삶의 방향성을 가지고 있습니다. 직업적으로 높은 성취를 이룰 가능성이 높으며, 맡은 일에 최선을 다하는 성실함으로 주변의 신뢰를 얻고 있습니다.',
          '운명선에서 상승의 기운이 보입니다. 현재 노력하고 있는 일들이 서서히 결실을 맺기 시작할 것입니다. 변화를 두려워하지 않고 새로운 도전을 받아들이는 용기가 성공의 열쇠입니다.',
          '운명선이 독특한 경로를 보여 남들과 다른 독자적인 삶의 길을 걸어가는 유형입니다. 자신만의 분야에서 전문성을 쌓으면 탁월한 성과를 거둘 수 있습니다. 새로운 분야 진출에 좋은 기운이 감지됩니다.',
          '운명선이 늦게 시작되어 중반부부터 강해지는 형태로, 인생 후반에 큰 성공을 거두는 대기만성형입니다. 지금의 노력과 준비가 훗날 빛나는 성과로 이어질 것이며, 조급해하지 않는 것이 중요합니다.',
        ],
      },
      태양선: {
        emoji: '☀️',
        texts: [
          '태양선이 밝고 선명하게 빛나고 있어 강한 카리스마와 매력을 지니고 있습니다. 주변 사람들에게 긍정적인 영향을 주는 천성적인 리더십이 있으며, 공적인 활동에서 명성을 얻을 기운이 강합니다. 재물운도 상승세에 있어 재정적으로 풍요로운 시기를 맞이할 것입니다.',
          '태양선에서 꾸준한 성장의 기운이 보입니다. 화려한 빛보다 내실 있는 성장을 통해 안정적인 명성을 쌓아가는 타입입니다. 꾸준한 노력과 성실함이 장기적으로 큰 명예를 가져다 줄 것입니다.',
          '태양선이 다방면의 재능을 나타냅니다. 다양한 분야에서 능력을 발휘할 수 있는 팔방미인형으로, 미디어나 대인 관계를 통한 활동에서 좋은 성과를 낼 가능성이 있습니다.',
          '태양선이 강하게 새겨져 있어 타고난 존재감과 인기를 나타냅니다. 어디를 가든 사람들의 시선을 끌고 자연스럽게 중심에 서는 매력이 있습니다. 창작 활동이나 대중을 상대하는 일에서 특히 두각을 나타낼 것입니다.',
        ],
      },
      결혼선: {
        emoji: '💍',
        texts: [
          '결혼선이 뚜렷하고 힘차게 새겨져 있어 강한 인연을 만날 운명을 타고났습니다. 진지한 만남이 예상되며, 한번 사랑하면 깊게 헌신하는 성격으로 안정적이고 행복한 관계를 이어갈 것입니다.',
          '결혼선에서 소울메이트를 만날 기운이 감지됩니다. 지금까지의 경험들이 이상적인 파트너를 알아보는 안목을 키워왔으며, 예상치 못한 장소에서 운명적인 만남이 이루어질 수 있습니다. 마음을 열고 새로운 만남을 받아들이는 것이 중요합니다.',
          '결혼선에서 깊은 감정적 유대를 나눌 상대를 만나게 될 것임을 보여줍니다. 결혼보다 정신적 교감을 중시하는 경향이 있으며, 서로를 성장시키는 파트너십을 이루게 될 것입니다.',
          '결혼선이 두 개의 선을 보여주어 삶에서 중요한 두 번의 인연을 나타냅니다. 진지하고 깊은 관계를 추구하는 성격으로, 배우자에게 든든한 버팀목이 되어주는 파트너가 될 것입니다.',
        ],
      },
    },
    fortune: [
      '이번 달은 새로운 시작과 변화의 기운이 강합니다. 오래 고민해온 결정을 실행에 옮기기에 좋은 시기이며, 주변에서 예상치 못한 도움의 손길이 찾아올 것입니다. 금전적으로는 작은 행운이 기대되며, 건강을 위해 충분한 수면과 규칙적인 식사에 신경 쓰세요.',
      '이번 달은 내면의 성장과 자기 계발에 집중하기 좋은 시기입니다. 새로운 취미나 배움에 도전해보세요. 인간관계에서는 솔직한 소통에 신경 쓰는 것이 좋으며, 중순 이후 좋은 소식이 기대됩니다.',
      '이번 달은 재물운이 특히 강조됩니다. 현명한 소비 습관과 저축 계획이 미래의 풍요를 만들어 줄 것입니다. 새로운 인연이 사업이나 취업에 도움을 줄 수 있으니 사람들과의 만남에 적극적으로 임하세요.',
      '이번 달은 창의력과 영감이 풍부한 시기로, 오랫동안 품어온 아이디어를 실행에 옮기기에 좋습니다. 예상치 못한 곳에서 귀인을 만날 수 있으니 새로운 인연에 마음을 열어두세요. 건강 관리도 소홀히 하지 마세요.',
    ],
    colors: ['보라색', '금색', '청록색', '자주색', '흰색', '연두색', '하늘색', '분홍색', '주황색', '남색'],
    numbers: [3, 7, 9, 13, 21, 27, 8, 6, 11, 33, 5, 17],
    directions: ['동쪽', '서쪽', '남쪽', '북쪽', '남동쪽', '북서쪽', '남서쪽', '북동쪽'],
  };

  // ===== Image Feature Extraction =====
  async function extractFeatures(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const SIZE = 64;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
        URL.revokeObjectURL(url);

        // 6 zones: 2 rows × 3 cols
        const zones = [];
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 3; col++) {
            let sum = 0;
            const x0 = Math.floor(col * SIZE / 3);
            const y0 = Math.floor(row * SIZE / 2);
            const x1 = Math.floor((col + 1) * SIZE / 3);
            const y1 = Math.floor((row + 1) * SIZE / 2);
            const count = (x1 - x0) * (y1 - y0);
            for (let y = y0; y < y1; y++) {
              for (let x = x0; x < x1; x++) {
                const i = (y * SIZE + x) * 4;
                sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              }
            }
            zones.push(sum / count / 255);
          }
        }

        // Deterministic seed from pixel values
        let seed = 0;
        for (let i = 0; i < data.length; i += 16) {
          seed = (seed * 31 + data[i] + data[i + 1] * 2 + data[i + 2]) & 0xffff;
        }

        resolve({ zones, seed });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ zones: [0.6, 0.65, 0.7, 0.6, 0.65, 0.7], seed: 42 });
      };
      img.src = url;
    });
  }

  // ===== Palm Reading Generator =====
  function generateReading({ zones, seed }) {
    function pick(arr, offset) {
      return arr[(seed + offset) % arr.length];
    }

    function toScore(zoneVal, offset) {
      const base = 6 + zoneVal * 3;
      const vary = ((seed + offset) % 3) - 1;
      return Math.min(10, Math.max(6, Math.round(base + vary)));
    }

    // Map each palm line to a zone index and offset for variety
    const lineConfig = [
      { name: '생명선', zoneIdx: 2, offset: 0 },
      { name: '감정선', zoneIdx: 0, offset: 7 },
      { name: '두뇌선', zoneIdx: 1, offset: 14 },
      { name: '운명선', zoneIdx: 5, offset: 21 },
      { name: '태양선', zoneIdx: 3, offset: 28 },
      { name: '결혼선', zoneIdx: 4, offset: 35 },
    ];

    const lines = {};
    for (const { name, zoneIdx, offset } of lineConfig) {
      const { emoji, texts } = PALM_DATA.lines[name];
      lines[name] = {
        name,
        emoji,
        interpretation: pick(texts, offset),
        score: toScore(zones[zoneIdx], offset + 5),
      };
    }

    return {
      overall: pick(PALM_DATA.overall, 0),
      lines,
      fortune: pick(PALM_DATA.fortune, 3),
      luckyItems: {
        color: pick(PALM_DATA.colors, 5),
        number: pick(PALM_DATA.numbers, 8),
        direction: pick(PALM_DATA.directions, 11),
      },
    };
  }

  // ===== Analysis =====
  analyzeBtn.addEventListener('click', async () => {
    if (!currentFile || analyzeBtn.disabled) return;

    analyzeBtn.disabled = true;
    showView('loading');

    try {
      // Run image analysis and enforce minimum loading time in parallel
      const [features] = await Promise.all([
        extractFeatures(currentFile),
        new Promise((r) => setTimeout(r, 2000)),
      ]);

      const data = generateReading(features);
      renderResults(data);
      showView('results');
    } catch {
      showView('upload');
      alert('분석 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }

    analyzeBtn.disabled = false;
  });

  // ===== Results Rendering =====
  function renderResults(data) {
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
