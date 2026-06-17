// Wraps the global `qrcode` library (loaded via CDN in index.html) and
// renders a scannable QR as inline SVG. Falls back to a placeholder if the
// library is unavailable.

export function renderQRCode(text, size = 200) {
  if (typeof window.qrcode !== "function") {
    return placeholder(size, "QR unavailable");
  }
  try {
    const typeNumber = 0; // auto
    const errorCorrectionLevel = "M";
    const qr = window.qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(text);
    qr.make();
    const cells = qr.getModuleCount();
    const cell = Math.floor(size / cells);
    const margin = Math.floor((size - cell * cells) / 2);
    let rects = "";
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        if (qr.isDark(r, c)) {
          rects += `<rect x="${margin + c * cell}" y="${margin + r * cell}" width="${cell}" height="${cell}" fill="#0c1e15"/>`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#ffffff"/>${rects}
    </svg>`;
  } catch (err) {
    console.error(err);
    return placeholder(size, "QR error");
  }
}

function placeholder(size, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#eef2ef"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="14" fill="#566">${label}</text>
  </svg>`;
}
