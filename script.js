// Elemen DOM
const imageUpload = document.getElementById('imageUpload');
const sourceImage = document.getElementById('sourceImage');
const editor = document.getElementById('editor');
const cropBox = document.getElementById('cropBox');
const overlay = document.getElementById('overlay');
const downloadBtn = document.getElementById('downloadBtn');
const toolbar = document.getElementById('toolbar');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessValue = document.getElementById('brightnessValue');
const brightnessDisplay = document.getElementById('brightnessDisplay');

// Preview & Loading
const loading = document.getElementById('loading');
const previewContainer = document.getElementById('previewContainer');
const previewResult = document.getElementById('previewResult');
const downloadFinal = document.getElementById('downloadFinal');
const finalResultSection = document.getElementById('finalResultSection');
const finalResult = document.getElementById('finalResult');

// Variabel global
let imgWidth = 0;
let imgHeight = 0;
let scale = 1;
let brightness = 0;
let currentMode = 'manual'; // default
let lastGeneratedDataURL = null;

// Fungsi: Atur ukuran crop box sesuai rasio pas foto
function setCropBoxToRatio(ratio) {
  const containerWidth = imgWidth;
  const containerHeight = imgHeight;

  let newWidth, newHeight;

  if (ratio === '3x4') {
    newHeight = Math.min(containerHeight * 0.6, 320);
    newWidth = (3 / 4) * newHeight;
  } else if (ratio === '4x6') {
    newHeight = Math.min(containerHeight * 0.6, 320);
    newWidth = (4 / 6) * newHeight;
  }

  if (newWidth > containerWidth * 0.9) {
    newWidth = containerWidth * 0.9;
    newHeight = ratio === '3x4' ? (4 / 3) * newWidth : (6 / 4) * newWidth;
  }

  if (newWidth < 60) newWidth = 60;
  if (newHeight < 80) newHeight = 80;

  cropBox.style.width = newWidth + 'px';
  cropBox.style.height = newHeight + 'px';

  positionCropBoxCenter();
}

// Posisikan crop box di tengah
function positionCropBoxCenter() {
  const left = (imgWidth - parseFloat(cropBox.style.width)) / 2;
  const top = (imgHeight - parseFloat(cropBox.style.height)) / 2;
  cropBox.style.left = Math.max(0, left) + 'px';
  cropBox.style.top = Math.max(0, top) + 'px';
}

// Handle upload gambar
imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  sourceImage.src = url;
  sourceImage.onload = () => {
    imgWidth = sourceImage.naturalWidth;
    imgHeight = sourceImage.naturalHeight;
    editor.style.display = 'block'; // Pastikan ditampilkan
    document.getElementById('mainContainer').style.display = 'flex';

    // Reset efek
    scale = 1;
    brightness = 0;
    brightnessValue.value = 0;
    brightnessDisplay.textContent = 0;
    sourceImage.style.filter = '';
    applyTransform();

    updateModeUI();

    downloadBtn.disabled = false;
    previewContainer.style.display = 'none';
    finalResultSection.style.display = 'none';
    lastGeneratedDataURL = null;
  };
});

// Ganti ukuran pas foto
document.querySelectorAll('input[name="size"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (currentMode === 'manual') {
      setCropBoxToRatio(e.target.value);
    }
  });
});

// Ganti mode (manual/auto)
document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    currentMode = e.target.value;
    updateModeUI();
  });
});

function updateModeUI() {
  if (currentMode === 'manual') {
    cropBox.style.display = 'block';
    overlay.style.display = 'block';
    const selectedSize = document.querySelector('input[name="size"]:checked').value;
    setCropBoxToRatio(selectedSize);
  } else {
    cropBox.style.display = 'none';
    overlay.style.display = 'none';
  }
}

// Drag crop box
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

cropBox.addEventListener('mousedown', (e) => {
  if (e.target.classList.contains('handle')) return;
  if (currentMode !== 'manual') return;
  isDragging = true;
  const rect = cropBox.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging || currentMode !== 'manual') return;

  const editorRect = editor.getBoundingClientRect();
  let left = e.clientX - editorRect.left - dragOffsetX;
  let top = e.clientY - editorRect.top - dragOffsetY;

  const cropW = cropBox.offsetWidth;
  const cropH = cropBox.offsetHeight;

  left = Math.max(0, Math.min(left, imgWidth - cropW));
  top = Math.max(0, Math.min(top, imgHeight - cropH));

  cropBox.style.left = left + 'px';
  cropBox.style.top = top + 'px';
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// Resize handles
const handles = document.querySelectorAll('.handle');
handles.forEach(handle => {
  handle.addEventListener('mousedown', (e) => {
    if (currentMode !== 'manual') return;
    e.stopPropagation();
    const dir = handle.className.split(' ')[1];
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = parseFloat(cropBox.style.left);
    const startTop = parseFloat(cropBox.style.top);
    const startWidth = cropBox.offsetWidth;
    const startHeight = cropBox.offsetHeight;

    const onMouseMove = (e) => {
      let dx = e.clientX - startX;
      let dy = e.clientY - startY;

      let newLeft = startLeft;
      let newTop = startTop;
      let newWidth = startWidth;
      let newHeight = startHeight;

      switch (dir) {
        case 'top-left':
          newLeft += dx;
          newTop += dy;
          newWidth -= dx;
          newHeight -= dy;
          break;
        case 'top-right':
          newTop += dy;
          newWidth += dx;
          newHeight -= dy;
          break;
        case 'bottom-left':
          newLeft += dx;
          newWidth -= dx;
          newHeight += dy;
          break;
        case 'bottom-right':
          newWidth += dx;
          newHeight += dy;
          break;
        case 'top-center':
          newTop += dy;
          newHeight -= dy;
          break;
        case 'bottom-center':
          newHeight += dy;
          break;
        case 'left-center':
          newLeft += dx;
          newWidth -= dx;
          break;
        case 'right-center':
          newWidth += dx;
          break;
      }

      if (newWidth < 60) newWidth = 60;
      if (newHeight < 80) newHeight = 80;

      newLeft = Math.max(0, Math.min(newLeft, imgWidth - newWidth));
      newTop = Math.max(0, Math.min(newTop, imgHeight - newHeight));

      cropBox.style.left = newLeft + 'px';
      cropBox.style.top = newTop + 'px';
      cropBox.style.width = newWidth + 'px';
      cropBox.style.height = newHeight + 'px';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', onMouseMove);
    }, { once: true });
  });
});

// Zoom
document.getElementById('zoomIn').addEventListener('click', () => {
  if (currentMode !== 'manual') return;
  scale = Math.min(scale * 1.2, 3);
  applyTransform();
});

document.getElementById('zoomOut').addEventListener('click', () => {
  if (currentMode !== 'manual') return;
  scale = Math.max(scale / 1.2, 0.5);
  applyTransform();
});

function applyTransform() {
  if (currentMode !== 'manual') return;
  sourceImage.style.transform = `scale(${scale})`;
  sourceImage.style.transformOrigin = 'top left';
}

// Brightness
brightnessValue.addEventListener('input', (e) => {
  brightness = parseInt(e.target.value);
  brightnessDisplay.textContent = brightness;
  sourceImage.style.filter = `brightness(${1 + brightness / 100})`;
});

// Toggle slider kecerahan
document.getElementById('brightnessBtn').addEventListener('click', () => {
  if (currentMode !== 'manual') return;
  brightnessSlider.style.display = brightnessSlider.style.display === 'none' ? 'flex' : 'none';
});

// Reset
document.getElementById('resetBtn').addEventListener('click', () => {
  scale = 1;
  brightness = 0;
  brightnessValue.value = 0;
  brightnessDisplay.textContent = 0;
  sourceImage.style.filter = '';
  sourceImage.style.transform = 'scale(1)';
  if (currentMode === 'manual') {
    const selectedSize = document.querySelector('input[name="size"]:checked').value;
    setCropBoxToRatio(selectedSize);
  }
});

// Unduh hasil — GENERATE PREVIEW DULU!
downloadBtn.addEventListener('click', () => {
  showLoading(true);

  setTimeout(() => {
    const size = document.querySelector('input[name="size"]:checked').value;
    const [wCm, hCm] = size.split('x').map(Number);

    const DPI = 118;
    const canvas = document.createElement('canvas');
    canvas.width = wCm * DPI;
    canvas.height = hCm * DPI;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentMode === 'manual') {
      const cropLeft = parseFloat(cropBox.style.left);
      const cropTop = parseFloat(cropBox.style.top);
      const cropWidth = cropBox.offsetWidth;
      const cropHeight = cropBox.offsetHeight;

      const displayWidth = sourceImage.offsetWidth;
      const scaleX = imgWidth / displayWidth;
      const scaleY = imgHeight / sourceImage.offsetHeight;

      const actualLeft = cropLeft * scaleX;
      const actualTop = cropTop * scaleY;
      const actualWidth = cropWidth * scaleX;
      const actualHeight = cropHeight * scaleY;

      ctx.drawImage(
        sourceImage,
        actualLeft, actualTop, actualWidth, actualHeight,
        0, 0, canvas.width, canvas.height
      );
    } else {
      const aspect = wCm / hCm;
      const imgAspect = imgWidth / imgHeight;

      let cropWidth, cropHeight, cropX, cropY;

      if (imgAspect > aspect) {
        cropHeight = imgHeight;
        cropWidth = imgHeight * aspect;
        cropX = (imgWidth - cropWidth) / 2;
        cropY = 0;
      } else {
        cropWidth = imgWidth;
        cropHeight = imgWidth / aspect;
        cropX = 0;
        cropY = (imgHeight - cropHeight) / 2;
      }

      ctx.drawImage(
        sourceImage,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, canvas.width, canvas.height
      );
    }

    // Simpan hasil sebagai data URL
    lastGeneratedDataURL = canvas.toDataURL('image/jpeg', 0.95);

    // Tampilkan preview
    previewResult.src = lastGeneratedDataURL;
    previewContainer.style.display = 'block';
    showLoading(false);

    // Aktifkan tombol unduh final
    downloadFinal.disabled = false;

  }, 300);
});

// Unduh hasil akhir dari preview
downloadFinal.addEventListener('click', () => {
  if (!lastGeneratedDataURL) return;

  const link = document.createElement('a');
  const size = document.querySelector('input[name="size"]:checked').value;
  link.download = `pas-foto-${size}.jpg`;
  link.href = lastGeneratedDataURL;
  link.click();
});

// Fungsi helper: Tampilkan/Hilangkan loading
function showLoading(show) {
  loading.style.display = show ? 'flex' : 'none';
  downloadBtn.disabled = show;
}