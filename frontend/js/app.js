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
      '손의 전체적인 기운에서 강한 목적의식과 내면의 열정이 느껴집니다. 한번 마음먹은 일은 끝까지 해내는 집념과 끈기가 있어 어떤 분야에서든 전문성을 쌓아가는 타입입니다. 현재 삶의 중요한 분기점에 서 있으며, 올바른 선택 하나가 앞으로의 10년을 바꿀 수 있는 시기입니다.',
      '손에서 느껴지는 에너지가 매우 독특하고 강렬합니다. 평범한 삶에 만족하지 않고 끊임없이 더 높은 곳을 향해 나아가는 야망가 기질이 있습니다. 도전을 두려워하지 않는 용기와 실패에서도 배우는 지혜로 결국 원하는 것을 이루어낼 것입니다. 주변 사람들에게 영감을 주는 존재가 될 운명을 타고났습니다.',
      '당신의 손금에서 풍부한 내면 세계와 섬세한 감수성이 느껴집니다. 겉으로는 차분해 보이지만 내면에는 뜨거운 열정과 깊은 감정의 바다가 흐르고 있습니다. 예술적, 창의적 재능이 특히 두드러지며 이를 통해 많은 사람들의 마음을 움직이는 일을 하게 될 것입니다. 자신의 감수성을 억누르지 말고 마음껏 표현하세요.',
      '손금 전체에서 복된 기운과 행운의 에너지가 감지됩니다. 어려운 상황에서도 기적처럼 도움이 찾아오는 행운아 기질을 타고났으며, 귀인과의 만남이 삶의 중요한 순간마다 이루어질 것입니다. 긍정적인 마음가짐과 감사하는 마음이 이 행운을 더욱 강화시켜줄 것입니다. 지금의 좋은 에너지를 꾸준히 유지하는 것이 중요합니다.',
      '당신의 손금은 다재다능함과 뛰어난 적응력을 보여줍니다. 어떤 환경에서도 빠르게 적응하고 자신만의 방식으로 성과를 내는 능력이 있으며, 여러 분야에 걸친 폭넓은 재능이 있습니다. 한 가지에 집중하기보다 다양한 경험을 통해 자신만의 독창적인 길을 만들어가는 것이 당신에게 가장 잘 맞는 방식입니다.',
      '손금에서 깊은 인간미와 따뜻한 배려심이 느껴집니다. 주변 사람들의 어려움에 공감하고 기꺼이 도움의 손길을 내밀 수 있는 천성적인 치유자 기질이 있습니다. 이 따뜻함이 당신의 가장 큰 강점으로, 사람들이 당신에게 끌리고 신뢰하게 만드는 원동력이 됩니다. 더 많은 사람들에게 이 사랑을 나눠주세요.',
      '당신의 손금에는 강한 리더십과 추진력의 기운이 가득합니다. 집단 내에서 자연스럽게 리더의 역할을 맡게 되는 카리스마를 지니고 있으며, 비전을 제시하고 사람들을 이끄는 능력이 탁월합니다. 큰 조직이나 팀을 이끌며 역사에 남을 만한 성과를 거둘 가능성이 있습니다. 자신의 리더십에 대한 확신을 더 강하게 가지세요.',
      '손금의 전체적인 흐름이 안정과 번영을 향해 나아가고 있습니다. 급격한 변화보다 꾸준하고 안정적인 성장을 선호하는 성향으로, 탄탄한 기반 위에 자신만의 왕국을 쌓아가고 있습니다. 재물운이 꾸준히 상승하는 흐름이 있으며, 노력에 비례한 정직한 보상이 반드시 돌아올 것입니다.',
      '당신의 손에서 영적인 감수성과 직관의 기운이 강하게 느껴집니다. 눈에 보이지 않는 것들을 느끼고 미래를 예감하는 뛰어난 직관력을 가지고 있습니다. 이 직관을 일상의 결정에 적극적으로 활용하면 실수를 줄이고 올바른 길을 선택하는 데 큰 도움이 됩니다. 명상이나 자기 성찰이 이 능력을 더욱 발전시켜줄 것입니다.',
      '손금에서 강인한 생존 본능과 회복탄력성이 느껴집니다. 어떤 어려움이 찾아와도 결코 포기하지 않고 다시 일어서는 불굴의 의지를 지니고 있습니다. 삶의 굴곡마다 더욱 단단해진 내면의 힘이 지금의 당신을 만들었으며, 앞으로 찾아올 어떤 도전도 이겨낼 준비가 되어 있습니다.',
      '당신의 손금은 풍요롭고 행복한 인생을 예고하고 있습니다. 물질적 풍요와 정신적 만족이 함께 이루어지는 삶을 살게 될 것이며, 사랑하는 사람들과의 따뜻한 관계 속에서 진정한 행복을 찾을 것입니다. 지금 이 순간 당신의 삶에 감사하는 마음을 갖는 것이 더 큰 행복을 불러오는 열쇠입니다.',
      '손금에서 끊임없는 학습과 성장의 에너지가 느껴집니다. 호기심이 많고 새로운 것을 배우는 것을 즐기는 성격으로, 지식의 폭이 넓어질수록 인생의 가능성도 함께 확장됩니다. 평생 학습자로서의 여정이 당신을 시대를 앞서가는 선구자로 만들어줄 것입니다.',
      '당신의 손금 전체에서 강한 운명의 기운이 흐르고 있습니다. 우연처럼 보이는 만남과 사건들이 사실은 치밀하게 짜여진 운명의 실로 연결되어 있으며, 지금 겪고 있는 모든 것이 더 크고 아름다운 그림의 일부입니다. 흐름을 거스르지 말고 자연스럽게 받아들이면 삶이 당신을 올바른 곳으로 이끌어 줄 것입니다.',
    ],
    lines: {
      생명선: {
        emoji: '❤️',
        texts: [
          '생명선이 길고 선명하게 뻗어 있어 강한 생명력과 왕성한 활력을 지니고 있습니다. 건강에 대한 자기관리 능력이 뛰어나며 큰 질병 없이 장수할 가능성이 높습니다. 육체적으로도 정신적으로도 탄탄한 기반을 갖추고 있어 어떤 어려움도 이겨낼 힘이 있습니다.',
          '생명선에서 중요한 전환점이 보입니다. 생활 방식이나 환경의 큰 변화가 예상되나, 이는 오히려 더 나은 삶으로 도약하는 계기가 될 것입니다. 꾸준한 건강 관리와 규칙적인 생활 습관이 특히 중요한 시기입니다.',
          '생명선이 넓게 호를 그리며 활기찬 에너지를 나타냅니다. 외부 활동을 즐기고 사람들과 어울리는 것을 좋아하는 사교적인 기질이 반영됩니다. 체력이 좋아 다양한 활동에서 두각을 나타낼 수 있습니다.',
          '생명선에서 강한 회복력과 치유의 기운이 감지됩니다. 과거의 어려움을 극복하고 더욱 단단해진 내면의 힘이 느껴지며, 앞으로의 삶에서 건강과 활력이 더욱 충만해질 것입니다.',
          '생명선이 깊고 선명하여 넘치는 생명 에너지를 보여줍니다. 자연을 가까이하고 규칙적인 운동을 즐기는 생활이 이 에너지를 더욱 강하게 유지해줄 것입니다. 노년까지 건강하고 활기찬 삶이 이어질 것입니다.',
          '생명선의 시작 부분이 특히 강하게 새겨져 있어 어릴 때부터 강한 의지와 생명력을 지녔음을 알 수 있습니다. 선천적으로 타고난 강건한 체질로 웬만한 환경 변화에도 쉽게 흔들리지 않는 강인함이 있습니다. 이 타고난 체력이 앞으로의 도전을 뒷받침할 든든한 무기입니다.',
          '생명선에 잔 선들이 교차하며 다양한 삶의 경험을 나타냅니다. 풍부한 경험들이 당신을 더욱 성숙하고 지혜로운 사람으로 만들었으며, 앞으로도 다채로운 삶의 여정이 펼쳐질 것입니다. 다양한 경험이 쌓일수록 삶은 더욱 풍요로워집니다.',
          '생명선 위에 특별한 에너지의 별 기운이 감지되어 강한 보호의 힘이 감싸고 있습니다. 위기의 순간에도 불가사의한 힘이 당신을 지켜줄 것이며, 큰 사고나 질병을 피해가는 복이 있습니다. 평소에 몸의 신호에 귀를 기울이는 습관이 이 기운을 강화해줍니다.',
          '생명선이 손목까지 길게 이어져 있어 장수와 풍요로운 삶을 예고합니다. 나이가 들수록 더욱 건강해지고 활력이 넘치는 역동적인 기운을 가지고 있습니다. 노년의 삶이 특히 빛나고 풍요로울 것으로 보입니다.',
          '생명선에서 상향하는 작은 지선들이 보입니다. 이는 끊임없이 발전하고 성장하려는 강한 의지를 나타내며, 도전할 때마다 새로운 에너지가 솟아나는 타입입니다. 스스로의 한계를 넓혀가는 과정에서 삶의 진정한 보람을 느끼는 분입니다.',
          '생명선이 검지 쪽으로 휘어 있어 강한 야망과 성취욕을 나타냅니다. 목표를 향해 쉬지 않고 달려가는 추진력이 있으며, 건강 관리를 병행하면 원하는 모든 것을 이룰 수 있는 에너지가 충분합니다.',
          '생명선 중간 부분에 에너지의 전환이 보입니다. 삶의 방향이 더 나은 방향으로 전환되는 것을 의미하며, 힘든 시기를 지나 새로운 전성기를 맞이하고 있음을 알려줍니다. 지금 느끼는 변화의 바람이 반드시 좋은 방향으로 흘러갈 것입니다.',
          '생명선이 엄지손가락 쪽으로 가까이 붙어 있어 신중하고 지혜로운 삶의 방식을 나타냅니다. 무리하지 않는 현명한 선택으로 건강과 안정을 유지하는 지혜로운 분입니다. 오랜 시간에 걸쳐 쌓아온 내공이 앞으로 더욱 빛을 발할 것입니다.',
          '생명선 끝부분이 선명하고 힘차게 마무리되어 끝까지 활력 있는 삶을 살 것임을 보여줍니다. 노년에도 왕성한 활동력을 유지하며 주변 사람들에게 에너지를 나눠주는 삶을 살 것입니다. 인생의 황혼기가 가장 아름답게 빛날 것입니다.',
          '생명선에서 두 번의 큰 에너지 상승이 보입니다. 삶의 중요한 두 시기에 완전히 새로운 에너지와 활력을 얻게 되는 특별한 기운으로, 주변을 놀라게 할 만한 변신과 성장이 예고되어 있습니다.',
        ],
      },
      감정선: {
        emoji: '💕',
        texts: [
          '감정선이 선명하고 깊게 새겨져 있어 감정이 풍부하고 사랑에 충실한 성격을 보여줍니다. 파트너에게 헌신적이며 진정한 사랑을 추구합니다. 이번 해 연애운이 상승세에 있어 중요한 인연을 만날 가능성이 있습니다.',
          '감정선에서 복잡한 감정의 흐름이 보입니다. 여러 번의 깊은 감정 경험을 통해 더욱 성숙한 사랑을 하게 될 것입니다. 현재 관계에서 진솔한 대화가 관계 발전의 열쇠가 됩니다.',
          '감정선이 부드럽게 곡선을 이루며 감성적이고 낭만적인 기질을 나타냅니다. 사람들의 감정에 민감하게 반응하는 공감 능력이 뛰어납니다. 직관적으로 상대방의 마음을 읽는 능력으로 인간관계가 원만합니다.',
          '감정선이 강하고 깊게 새겨져 있어 한번 맺은 인연을 소중히 여기는 성격임을 알 수 있습니다. 사랑하는 사람을 위해 기꺼이 희생할 수 있는 따뜻한 마음의 소유자로, 주변에 진정한 친구와 연인이 늘 함께할 것입니다.',
          '감정선이 검지 아래쪽까지 길게 뻗어 있어 이상적인 사랑을 추구하는 성향을 나타냅니다. 꿈꾸는 완벽한 사랑을 현실에서 발견하는 것이 더 큰 행복을 가져다 줄 것입니다. 현재 곁에 있는 사람의 소중함을 느껴보세요.',
          '감정선 위에 섬 모양의 흔적이 있어 과거의 감정적 상처를 극복한 흔적이 보입니다. 그 경험들이 오히려 당신의 공감 능력과 사랑의 깊이를 키워주었으며, 이제는 더욱 성숙하고 아름다운 사랑을 할 준비가 되어 있습니다.',
          '감정선이 중지 아래에서 시작하여 현실적이고 균형 잡힌 연애관을 가지고 있음을 보여줍니다. 감정과 이성을 적절히 조화시킬 줄 아는 성숙한 사랑을 하는 분으로, 안정적이고 신뢰할 수 있는 파트너가 될 것입니다.',
          '감정선이 두 갈래로 갈라지는 모양이 보입니다. 사랑과 우정을 동시에 소중히 여기는 성격으로, 연인에게 최고의 친구이기도 한 이상적인 파트너십을 이루게 될 것입니다. 이 능력이 관계의 깊이와 지속성을 높여줍니다.',
          '감정선이 물결치는 듯한 형태를 보여 감정의 파도가 있지만 그것이 삶을 풍요롭게 만드는 원동력이 됩니다. 감정의 깊이만큼 사랑의 기쁨도 크게 느끼는 진정한 로맨티스트입니다.',
          '감정선 끝부분에 상향 지선이 있어 사랑에서 긍정적인 에너지를 얻는 타입입니다. 좋은 인연을 만나면 삶의 모든 분야에서 시너지 효과를 발휘하여 더욱 큰 성공과 행복을 이루게 될 것입니다.',
          '감정선이 짧지만 깊게 새겨져 있어 소수와 깊고 진실한 관계를 맺는 성향입니다. 넓고 얕은 관계보다 소수와의 진정한 유대를 더 중요시하며, 한번 마음을 준 사람에게는 변함없는 신뢰를 보여줍니다.',
          '감정선 위에 작은 별 모양의 징조가 있어 특별한 운명적 만남이 예고됩니다. 지금까지 만난 사람들과는 차원이 다른, 깊은 영적 교감을 나눌 수 있는 소울메이트를 만날 가능성이 높습니다. 마음을 열고 기다려 보세요.',
          '감정선이 선명하고 작은 가지들이 위로 향하고 있어 사랑에서 항상 기쁨과 성장을 경험하는 복된 기운이 있습니다. 사랑할수록 더욱 발전하고 빛나는 아름다운 기운의 소유자입니다.',
          '감정선에서 섬세하고 깊은 내면의 기운이 느껴집니다. 상처받기 쉬운 여린 마음을 가지고 있지만, 진정한 사랑 앞에서는 그 마음의 벽을 과감히 허물 수 있는 용기도 함께 지니고 있습니다. 그 솔직함이 당신의 가장 큰 매력입니다.',
          '감정선이 곧게 뻗어 있어 솔직하고 직접적인 감정 표현을 하는 성격입니다. 상대방에게 자신의 감정을 명확하게 전달하는 능력이 있어, 오해 없이 투명한 관계를 만들어가는 데 탁월한 능력을 보여줍니다.',
        ],
      },
      두뇌선: {
        emoji: '🧠',
        texts: [
          '두뇌선이 길고 뚜렷하게 뻗어 있어 뛰어난 지적 능력과 집중력을 나타냅니다. 논리적 사고와 분석력이 탁월하여 복잡한 문제도 체계적으로 해결하는 능력이 있습니다. 학문이나 전문 분야에서 두각을 나타낼 소질이 있습니다.',
          '두뇌선에서 창의적인 굴곡이 보입니다. 예술적 감수성과 창조적 사고력이 뛰어나며 독창적인 아이디어로 주변을 놀라게 할 재능이 있습니다. 상상력과 현실적인 판단력을 균형 있게 활용하면 큰 성과를 거둘 수 있습니다.',
          '두뇌선이 실용적인 방향으로 뻗어 있어 현실 감각이 뛰어나고 실용적인 사고방식을 가지고 있습니다. 경험에서 배우는 능력이 탁월하며, 새로운 기술이나 지식을 빠르게 습득하는 능력이 있습니다.',
          '두뇌선이 두 갈래로 나뉘어 있어 이성과 감성을 모두 균형 있게 활용하는 능력을 보여줍니다. 분석적 사고와 직관적 판단을 상황에 따라 유연하게 전환할 수 있어 다양한 분야에서 뛰어난 성과를 낼 수 있습니다.',
          '두뇌선이 깊고 선명하여 강한 집중력과 지구력을 나타냅니다. 한 가지 주제나 목표에 몰입하면 놀라운 결과를 만들어내는 능력이 있으며, 전문가로서의 깊이 있는 지식을 쌓아가고 있습니다.',
          '두뇌선이 생명선에서 멀리 떨어진 곳에서 시작하여 독립적이고 자유로운 사고방식을 나타냅니다. 남의 시선이나 평가에 얽매이지 않고 자신만의 논리로 세상을 해석하는 자유로운 지성의 소유자입니다.',
          '두뇌선에서 여러 개의 작은 지선들이 보입니다. 다양한 분야에 대한 관심과 지식이 넓으며, 이 폭넓은 시야가 창의적인 문제 해결의 원동력이 됩니다. 전문성과 다양성의 조화가 당신만의 강점입니다.',
          '두뇌선이 아래로 완만하게 휘어져 있어 직관력과 상상력이 풍부한 사고방식을 나타냅니다. 현실과 이상의 경계를 자유롭게 오가며 창의적인 아이디어를 실현하는 능력이 있습니다. 문학, 음악, 예술 분야에서 특히 뛰어난 재능을 발휘할 수 있습니다.',
          '두뇌선이 길고 힘차게 뻗어 있어 뛰어난 기획력과 전략적 사고를 나타냅니다. 큰 그림을 보면서도 세부 사항을 놓치지 않는 균형 잡힌 사고방식으로, 리더로서 탁월한 판단력을 발휘하게 될 것입니다.',
          '두뇌선에서 강한 기억력과 학습 능력이 느껴집니다. 한번 배운 것은 좀처럼 잊지 않는 놀라운 기억력을 가지고 있으며, 이 능력이 학업이나 전문 분야에서 탁월한 성과를 만들어내고 있습니다.',
          '두뇌선이 생명선과 깊이 연결되어 있어 감성과 지성이 통합된 사고방식을 나타냅니다. 머리로만 생각하지 않고 마음의 소리에도 귀를 기울이는 전인적인 사고방식이 당신의 결정을 더욱 현명하게 만들어줍니다.',
          '두뇌선에서 빠른 직관과 판단력이 느껴집니다. 복잡한 상황에서도 순간적으로 핵심을 파악하고 올바른 결정을 내리는 능력이 있으며, 이 능력이 경쟁적인 환경에서 큰 강점이 됩니다.',
          '두뇌선이 선명하고 끝부분으로 갈수록 더욱 강해져 나이가 들수록 지혜와 통찰력이 깊어지는 것을 나타냅니다. 경험이 쌓일수록 더욱 명석해지는 지적 성숙의 기운이 있습니다.',
          '두뇌선에서 언어 능력과 표현력에 관한 특별한 기운이 보입니다. 자신의 생각을 명확하고 설득력 있게 전달하는 능력이 뛰어나며, 글쓰기, 강연, 협상 등 언어를 활용하는 분야에서 탁월한 성과를 낼 수 있습니다.',
          '두뇌선이 끝에서 두 갈래로 갈라져 있어 다양한 진로와 가능성이 열려 있음을 나타냅니다. 여러 분야에서 성공할 수 있는 잠재력을 지니고 있으며, 다양한 경험을 통해 자신에게 가장 잘 맞는 길을 찾아가게 될 것입니다.',
        ],
      },
      운명선: {
        emoji: '⭐',
        texts: [
          '운명선이 뚜렷하게 나타나 강한 목적의식과 뚜렷한 삶의 방향성을 가지고 있습니다. 직업적으로 높은 성취를 이룰 가능성이 높으며, 맡은 일에 최선을 다하는 성실함으로 주변의 신뢰를 얻고 있습니다.',
          '운명선에서 상승의 기운이 보입니다. 현재 노력하고 있는 일들이 서서히 결실을 맺기 시작할 것입니다. 변화를 두려워하지 않고 새로운 도전을 받아들이는 용기가 성공의 열쇠입니다.',
          '운명선이 독특한 경로를 보여 남들과 다른 독자적인 삶의 길을 걸어가는 유형입니다. 자신만의 분야에서 전문성을 쌓으면 탁월한 성과를 거둘 수 있습니다. 새로운 분야 진출에 좋은 기운이 감지됩니다.',
          '운명선이 늦게 시작되어 중반부부터 강해지는 형태로, 인생 후반에 큰 성공을 거두는 대기만성형입니다. 지금의 노력과 준비가 훗날 빛나는 성과로 이어질 것이며, 조급해하지 않고 꾸준히 나아가는 것이 중요합니다.',
          '운명선이 손목에서부터 힘차게 시작하여 강한 자기 주도성과 개척 정신을 나타냅니다. 스스로 길을 개척하는 선구자 기질이 있으며, 어려운 환경에서도 자신만의 방식으로 성공을 만들어내는 능력이 있습니다.',
          '운명선에 두 번의 큰 전환점이 보입니다. 삶에서 중요한 두 번의 직업적 변화가 있을 것이며, 각각의 변화가 더 높은 단계로 도약하는 계기가 될 것입니다. 변화를 두려움이 아닌 성장의 기회로 받아들이세요.',
          '운명선이 중지를 향해 곧게 뻗어 있어 강한 책임감과 성취 지향적 성격을 나타냅니다. 자신이 맡은 역할에 최선을 다하는 완벽주의 성향이 있으며, 이 성실함이 직장과 사회에서 높은 평가를 받게 해줄 것입니다.',
          '운명선이 생명선 안쪽에서 시작하여 가족이나 주변 사람들의 도움으로 성공의 기반을 다지는 타입입니다. 관계를 소중히 여기는 만큼 주변의 지지와 협력이 큰 성취를 이루는 데 중요한 역할을 할 것입니다.',
          '운명선 중간에 작은 섬이 보입니다. 일시적인 정체기나 어려움이 있을 수 있지만, 이 시기를 통해 더욱 단단해지고 새로운 방향성을 찾게 될 것입니다. 위기가 곧 기회임을 믿고 흔들리지 않는 것이 중요합니다.',
          '운명선이 감정선을 지나서도 계속 이어져 있어 오랫동안 왕성하게 활동하는 삶을 살 것임을 나타냅니다. 은퇴 후에도 새로운 분야에서 활발한 활동을 이어가며 사회에 기여하는 삶이 예고됩니다.',
          '운명선에서 부업이나 복수의 수입원에 관한 기운이 느껴집니다. 한 가지 직업 외에도 재능을 활용한 다양한 활동으로 경제적 풍요를 이루어갈 가능성이 높습니다. 다양한 능력을 적극 활용해보세요.',
          '운명선이 두 개로 나뉘어 있어 두 가지 다른 방향의 커리어를 동시에 발전시킬 수 있는 능력을 나타냅니다. 전혀 다른 두 분야를 접목하여 완전히 새로운 영역을 개척하는 혁신가가 될 가능성이 있습니다.',
          '운명선에서 강한 귀인의 기운이 감지됩니다. 인생의 중요한 순간에 반드시 도움을 주는 멘토나 귀인을 만나게 될 것이며, 이들의 도움이 성공으로 가는 길을 크게 단축시켜줄 것입니다.',
          '운명선이 상승하는 방향으로 끝나 있어 인생의 마지막까지 계속해서 발전하고 성장하는 삶을 살 것임을 나타냅니다. 나이에 상관없이 새로운 목표를 향해 나아가는 열정적인 삶이 펼쳐질 것입니다.',
          '운명선에서 사회적 영향력과 인정에 관한 기운이 느껴집니다. 자신이 하는 일을 통해 더 많은 사람들의 삶에 긍정적인 영향을 미치게 될 것이며, 그 영향력이 점점 더 넓은 범위로 확장되어 갈 것입니다.',
        ],
      },
      태양선: {
        emoji: '☀️',
        texts: [
          '태양선이 밝고 선명하게 빛나고 있어 강한 카리스마와 매력을 지니고 있습니다. 주변 사람들에게 긍정적인 영향을 주는 천성적인 리더십이 있으며, 공적인 활동에서 명성을 얻을 기운이 강합니다. 재물운도 상승세에 있어 재정적으로 풍요로운 시기를 맞이할 것입니다.',
          '태양선에서 꾸준한 성장의 기운이 보입니다. 화려한 빛보다 내실 있는 성장을 통해 안정적인 명성을 쌓아가는 타입입니다. 꾸준한 노력과 성실함이 장기적으로 큰 명예를 가져다 줄 것입니다.',
          '태양선이 다방면의 재능을 나타냅니다. 다양한 분야에서 능력을 발휘할 수 있는 팔방미인형으로, 미디어나 대인 관계를 통한 활동에서 좋은 성과를 낼 가능성이 있습니다.',
          '태양선이 강하게 새겨져 있어 타고난 존재감과 인기를 나타냅니다. 어디를 가든 사람들의 시선을 끌고 자연스럽게 중심에 서는 매력이 있습니다. 창작 활동이나 대중을 상대하는 일에서 특히 두각을 나타낼 것입니다.',
          '태양선이 약지 아래에서 시작하여 강한 미적 감각과 예술적 재능을 나타냅니다. 아름다움을 창조하고 감상하는 능력이 탁월하며, 예술, 디자인, 패션 등의 분야에서 뛰어난 성과를 낼 수 있습니다.',
          '태양선 위에 별 모양의 기운이 있어 특별한 성공과 명예의 기운이 감지됩니다. 인생에서 한 번 이상 크게 빛나는 순간을 맞이하게 될 것이며, 그 성공이 더 많은 기회와 인연을 불러올 것입니다.',
          '태양선이 감정선 위에서만 나타나 성숙한 나이에 더욱 빛을 발하는 만개형의 기운을 나타냅니다. 경험과 지혜가 쌓일수록 더욱 강하게 빛나는 후반전이 화려한 인생이 예고되어 있습니다.',
          '태양선에서 강한 재물운의 기운이 느껴집니다. 노력에 상응하는 정직한 보상이 따르며, 투자나 부업을 통한 추가적인 수입원이 생길 가능성이 있습니다. 금전적인 기반이 점점 더 탄탄해질 것입니다.',
          '태양선이 짧지만 매우 선명하게 새겨져 있어 특정 분야에서 집중적인 성공을 거두는 기운을 나타냅니다. 넓게 알려지기보다 자신의 분야에서 진정한 전문가로 인정받는 깊이 있는 명성을 쌓게 될 것입니다.',
          '태양선에서 사람들을 즐겁게 하고 행복하게 만드는 엔터테이너 기질이 느껴집니다. 자신의 존재만으로도 주변을 밝히는 에너지가 있으며, 이 에너지가 많은 사람들에게 긍정적인 영향을 미칩니다.',
          '태양선이 운명선과 만나는 지점에서 강한 성공의 교차점이 형성됩니다. 일과 명예가 동시에 상승하는 시기가 찾아올 것이며, 직업적 성공이 사회적 인정으로 이어지는 아름다운 흐름이 예고됩니다.',
          '태양선에서 혁신과 창조의 기운이 강하게 느껴집니다. 기존의 틀을 벗어난 새로운 아이디어로 업계에 새바람을 일으킬 가능성이 있으며, 선구자적인 활동으로 역사에 이름을 남길 수도 있습니다.',
          '태양선이 두 개로 나뉘어 있어 두 가지 분야에서 동시에 명성을 얻을 수 있는 특별한 기운을 나타냅니다. 서로 다른 두 분야의 장점을 융합하는 독창적인 능력이 당신만의 차별화된 경쟁력이 될 것입니다.',
          '태양선에서 소통과 영향력에 관한 강한 에너지가 느껴집니다. 자신의 이야기와 경험을 공유함으로써 많은 사람들의 삶에 긍정적인 변화를 이끄는 역할을 하게 될 것이며, 그 영향력이 시간이 지날수록 더욱 커질 것입니다.',
          '태양선의 끝부분에서 밝은 빛이 발산되는 기운이 느껴집니다. 인생의 후반부가 특히 화려하게 빛날 것을 예고하며, 젊은 시절의 노력과 경험들이 결국 눈부신 성과로 빛을 발하게 될 것입니다.',
        ],
      },
      결혼선: {
        emoji: '💍',
        texts: [
          '결혼선이 뚜렷하고 힘차게 새겨져 있어 강한 인연을 만날 운명을 타고났습니다. 진지한 만남이 예상되며, 한번 사랑하면 깊게 헌신하는 성격으로 안정적이고 행복한 관계를 이어갈 것입니다.',
          '결혼선에서 소울메이트를 만날 기운이 감지됩니다. 지금까지의 경험들이 이상적인 파트너를 알아보는 안목을 키워왔으며, 예상치 못한 장소에서 운명적인 만남이 이루어질 수 있습니다. 마음을 열고 새로운 만남을 받아들이는 것이 중요합니다.',
          '결혼선에서 깊은 감정적 유대를 나눌 상대를 만나게 될 것임을 보여줍니다. 결혼보다 정신적 교감을 중시하는 경향이 있으며, 서로를 성장시키는 아름다운 파트너십을 이루게 될 것입니다.',
          '결혼선이 두 개의 선을 보여주어 삶에서 중요한 두 번의 인연을 나타냅니다. 진지하고 깊은 관계를 추구하는 성격으로, 배우자에게 든든한 버팀목이 되어주는 파트너가 될 것입니다.',
          '결혼선이 깊고 선명하여 한번의 강한 인연이 예고됩니다. 인생의 반려자로서 끝까지 함께할 운명적인 만남이 기다리고 있으며, 그 인연은 시간이 지날수록 더욱 깊어지고 단단해질 것입니다.',
          '결혼선에서 상향하는 기운이 보여 사랑을 통해 더욱 성장하고 발전하는 타입임을 나타냅니다. 좋은 파트너를 만남으로써 인생의 모든 면이 더욱 풍요로워지고, 두 사람이 함께 이루어가는 성취가 빛날 것입니다.',
          '결혼선이 감정선 가까이에 위치하여 이르게 찾아오는 강한 인연을 나타냅니다. 젊은 나이에 운명의 상대를 만날 가능성이 있으며, 오랜 시간 함께 삶을 가꾸어가는 아름다운 동반자 관계를 이루게 될 것입니다.',
          '결혼선에서 가족을 소중히 여기는 강한 기운이 느껴집니다. 따뜻한 가정을 이루고 자녀들에게 사랑을 듬뿍 주는 훌륭한 부모가 될 것이며, 가족 간의 유대가 삶의 가장 큰 행복이 될 것입니다.',
          '결혼선이 약하게 시작하다가 점점 강해지는 형태로, 시간이 지날수록 더욱 깊어지는 사랑을 할 운명입니다. 처음에는 평범해 보이는 만남이 시간이 지나면서 특별한 인연으로 발전하는 경우가 많습니다.',
          '결혼선에 작은 가지들이 위로 향하고 있어 결혼 후에도 끊임없이 발전하고 성장하는 부부 관계를 나타냅니다. 서로를 지지하고 격려하면서 함께 꿈을 이루어가는 이상적인 파트너십이 예고됩니다.',
          '결혼선이 끝부분에서 상향하여 결혼 생활이 행복한 방향으로 마무리됨을 나타냅니다. 평생 동반자와 함께 쌓아온 추억과 사랑이 노년에 가장 빛나는 보석이 될 것입니다.',
          '결혼선에서 강한 인연의 에너지가 느껴지며, 예상치 못한 방식으로 운명의 상대를 만나게 될 것임을 알려줍니다. 일이나 여행, 또는 우연한 만남의 자리에서 삶을 바꾸는 특별한 인연이 시작될 수 있습니다.',
          '결혼선이 선명하게 새겨져 있어 관계에서 명확한 경계와 신뢰를 중요시하는 성격임을 나타냅니다. 서로에 대한 존중을 기반으로 한 건강한 관계를 만들어가는 능력이 뛰어납니다.',
          '결혼선에서 두 영혼이 서로를 완성시키는 아름다운 기운이 느껴집니다. 파트너와 함께함으로써 각자가 혼자였을 때보다 훨씬 더 크고 빛나는 존재가 되는 시너지 효과가 예고됩니다.',
          '결혼선이 손의 바깥쪽까지 길게 이어져 있어 오랜 세월을 함께할 반려자와의 아름다운 인생 여정이 예고됩니다. 나이가 들수록 더욱 깊어지는 사랑의 의미를 두 사람이 함께 발견해가게 될 것입니다.',
        ],
      },
    },
    fortune: [
      '이번 달은 새로운 시작과 변화의 기운이 강합니다. 오래 고민해온 결정을 실행에 옮기기에 좋은 시기이며, 주변에서 예상치 못한 도움의 손길이 찾아올 것입니다. 금전적으로는 작은 행운이 기대되며, 건강을 위해 충분한 수면과 규칙적인 식사에 신경 쓰세요.',
      '이번 달은 내면의 성장과 자기 계발에 집중하기 좋은 시기입니다. 새로운 취미나 배움에 도전해보세요. 인간관계에서는 솔직한 소통에 신경 쓰는 것이 좋으며, 중순 이후 좋은 소식이 기대됩니다.',
      '이번 달은 재물운이 특히 강조됩니다. 현명한 소비 습관과 저축 계획이 미래의 풍요를 만들어 줄 것입니다. 새로운 인연이 사업이나 취업에 도움을 줄 수 있으니 사람들과의 만남에 적극적으로 임하세요.',
      '이번 달은 창의력과 영감이 풍부한 시기로, 오랫동안 품어온 아이디어를 실행에 옮기기에 좋습니다. 예상치 못한 곳에서 귀인을 만날 수 있으니 새로운 인연에 마음을 열어두세요. 건강 관리도 소홀히 하지 마세요.',
      '이번 달은 인간관계에서 큰 발전이 기대됩니다. 오랫동안 연락이 뜸했던 귀한 인연과의 재회가 이루어질 수 있으며, 새로운 만남에서도 오래 지속될 소중한 관계가 시작될 가능성이 있습니다. 주변 사람들에게 먼저 따뜻한 마음을 표현해보세요.',
      '이번 달은 커리어와 직업 면에서 중요한 변화의 기운이 감돕니다. 새로운 프로젝트나 업무 기회가 찾아올 것이며, 이를 잘 활용하면 큰 도약의 발판이 될 것입니다. 자신의 능력을 과소평가하지 말고 기회를 적극적으로 잡으세요.',
      '이번 달은 건강과 웰빙에 집중하기 좋은 시기입니다. 규칙적인 운동과 균형 잡힌 식단으로 몸의 기운을 충전하세요. 몸이 건강해지면 마음도 밝아지고, 모든 일이 더욱 원활하게 풀려나갈 것입니다.',
      '이번 달은 학업과 지적 성장에 특히 좋은 기운이 흐릅니다. 새로운 지식을 습득하거나 자격증, 시험에 도전하기에 최적의 시기입니다. 배움에 투자한 시간과 노력이 반드시 빛을 발하는 결실로 돌아올 것입니다.',
      '이번 달은 여행이나 새로운 환경에서의 경험이 삶에 신선한 활력을 불어넣어 줄 것입니다. 일상에서 벗어나 새로운 것을 보고 경험하는 것이 창의적인 아이디어와 영감의 원천이 됩니다. 작은 여행이라도 계획해보세요.',
      '이번 달은 금전적인 기회가 예상치 못한 곳에서 찾아올 수 있습니다. 부수입이나 투자 기회를 잘 살피되, 검증되지 않은 정보에 현혹되지 않도록 주의하세요. 안정적이고 신중한 재무 계획이 장기적인 풍요를 만듭니다.',
      '이번 달은 가족과의 관계에서 따뜻한 에너지가 흐릅니다. 바쁜 일상에서 잠시 벗어나 가족과 함께하는 시간을 만들어보세요. 소중한 사람들과 나누는 시간이 삶의 진정한 의미와 행복의 원천임을 다시 한번 느끼게 될 것입니다.',
      '이번 달은 영적인 성찰과 내면 탐구에 적합한 시기입니다. 명상이나 요가, 독서 등을 통해 자신을 더 깊이 이해하는 시간을 갖는 것이 좋습니다. 내면의 평화를 찾으면 외부의 복잡한 문제들도 자연스럽게 해결되는 것을 경험하게 될 것입니다.',
      '이번 달은 오랫동안 미루어왔던 일을 마무리하기에 좋은 시기입니다. 끝내지 못한 일들을 완성함으로써 새로운 에너지와 공간을 확보하세요. 정리와 마무리가 새로운 시작을 위한 최고의 준비가 됩니다.',
      '이번 달은 사회적 활동과 네트워킹에서 좋은 기운이 흐릅니다. 다양한 모임이나 커뮤니티 활동에 적극적으로 참여하면 예상치 못한 좋은 기회와 인연을 만나게 될 것입니다. 사람들 속에서 당신의 가치를 발견하는 시기입니다.',
      '이번 달은 창업이나 새로운 사업 시작에 좋은 기운이 강합니다. 오랫동안 준비해온 계획이 있다면 지금이 실행에 옮길 최적의 타이밍입니다. 두려움보다 설렘을 선택하고, 첫 발을 내딛는 용기를 발휘해보세요.',
    ],
    colors: ['보라색', '금색', '청록색', '자주색', '흰색', '연두색', '하늘색', '분홍색', '주황색', '남색', '진홍색', '은색', '올리브색', '산호색', '라벤더색'],
    numbers: [3, 7, 9, 13, 21, 27, 8, 6, 11, 33, 5, 17, 4, 22, 15, 28, 1, 12],
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
