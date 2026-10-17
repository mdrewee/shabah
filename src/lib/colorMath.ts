// colorMath.ts
// Math for calculating color difference using Delta E (CIELAB)

export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

export function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  let r_n = r / 255;
  let g_n = g / 255;
  let b_n = b / 255;

  r_n = r_n > 0.04045 ? Math.pow((r_n + 0.055) / 1.055, 2.4) : r_n / 12.92;
  g_n = g_n > 0.04045 ? Math.pow((g_n + 0.055) / 1.055, 2.4) : g_n / 12.92;
  b_n = b_n > 0.04045 ? Math.pow((b_n + 0.055) / 1.055, 2.4) : b_n / 12.92;

  r_n = r_n * 100;
  g_n = g_n * 100;
  b_n = b_n * 100;

  const x = r_n * 0.4124 + g_n * 0.3576 + b_n * 0.1805;
  const y = r_n * 0.2126 + g_n * 0.7152 + b_n * 0.0722;
  const z = r_n * 0.0193 + g_n * 0.1192 + b_n * 0.9505;

  return [x, y, z];
}

export function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  let x_n = x / refX;
  let y_n = y / refY;
  let z_n = z / refZ;

  x_n = x_n > 0.008856 ? Math.pow(x_n, 1 / 3) : (7.787 * x_n) + (16 / 116);
  y_n = y_n > 0.008856 ? Math.pow(y_n, 1 / 3) : (7.787 * y_n) + (16 / 116);
  z_n = z_n > 0.008856 ? Math.pow(z_n, 1 / 3) : (7.787 * z_n) + (16 / 116);

  const L = (116 * y_n) - 16;
  const a = 500 * (x_n - y_n);
  const b = 200 * (y_n - z_n);

  return [L, a, b];
}

export function getDeltaE(hex1: string, hex2: string): number {
  if (!hex1 || !hex2) return 100; // max difference if missing
  
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);

  const [x1, y1, z1] = rgbToXyz(r1, g1, b1);
  const [x2, y2, z2] = rgbToXyz(r2, g2, b2);

  const [l1, a1, b1_lab] = xyzToLab(x1, y1, z1);
  const [l2, a2, b2_lab] = xyzToLab(x2, y2, z2);

  const deltaL = l1 - l2;
  const deltaA = a1 - a2;
  const deltaB = b1_lab - b2_lab;

  // CIE76 formula
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

export function calculateColorCloseness(userHex: string, targetHex: string): number {
  const deltaE = getDeltaE(userHex, targetHex);
  // Max sensible deltaE is roughly around 100. Let's map it.
  const score = Math.max(0, Math.min(100, Math.round(100 - deltaE)));
  return score;
}

// Convert HSL/HSV to HEX for the sliders
export function hsvToHex(h: number, s: number, v: number): string {
  let r = 0, g = 0, b = 0;
  
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
