import React, { useEffect, useRef } from 'react';

const CHARS = '0123456789AFX#<>{}=+*%'.split('');
const CELL_W = 14;
const CELL_H = 18;
const RADIUS = 130;
const FLASH_DURATION_MS = 220;

interface MatrixCell {
  char: string;
  alpha: number; // 0.55 – 1.0 for asymmetrical depth
  glitchTime: number; // timestamp for subtle momentary flash
}

export const MatrixSpotlightCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animId = 0;
    let glitchIntervalId = 0;
    let resizeTimer = 0;

    // Fixed 2D grid
    let cols = 0;
    let rows = 0;
    let grid: MatrixCell[] = [];

    // Pointer smoothing (lerp) & light intensity
    let targetX = -9999;
    let targetY = -9999;
    let currentX = -9999;
    let currentY = -9999;
    let isPointerActive = false;
    let lightIntensity = 0;
    let lastFrameTime = performance.now();

    const getRandomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];
    const getRandomAlpha = () => 0.55 + Math.random() * 0.45;

    const buildGrid = (w: number, h: number) => {
      cols = Math.ceil(w / CELL_W);
      rows = Math.ceil(h / CELL_H);
      const total = cols * rows;
      grid = new Array(total);
      for (let i = 0; i < total; i++) {
        grid[i] = {
          char: getRandomChar(),
          alpha: getRandomAlpha(),
          glitchTime: -99999,
        };
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid(w, h);
    };

    resize();

    const handleResizeDebounced = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 100);
    };

    window.addEventListener('resize', handleResizeDebounced, { passive: true });

    // Glitch a small subset (2–4%) of cells in-place every 100ms
    if (!prefersReducedMotion) {
      glitchIntervalId = window.setInterval(() => {
        if (grid.length === 0) return;
        const now = performance.now();
        // 2% to 4% of total cells
        const glitchPercentage = 0.02 + Math.random() * 0.02;
        const count = Math.max(6, Math.floor(grid.length * glitchPercentage));

        for (let k = 0; k < count; k++) {
          const randIdx = Math.floor(Math.random() * grid.length);
          const cell = grid[randIdx];
          cell.char = getRandomChar();
          cell.glitchTime = now;
        }
      }, 100);
    }

    // Pointer event listeners (supporting touch & mouse smoothly)
    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      isPointerActive = true;
      if (currentX < -1000) {
        currentX = targetX;
        currentY = targetY;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      isPointerActive = true;
      if (currentX < -1000) {
        currentX = targetX;
        currentY = targetY;
      }
    };

    const handlePointerEnd = () => {
      isPointerActive = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerEnd, { passive: true });
    window.addEventListener('pointercancel', handlePointerEnd, { passive: true });
    window.addEventListener('pointerleave', handlePointerEnd, { passive: true });

    // Animation Render Loop
    const render = (now: number) => {
      const dt = Math.min(now - lastFrameTime, 100); // delta time capped at 100ms
      lastFrameTime = now;

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Light intensity smooth transition (~400ms fade out when pointer leaves)
      if (isPointerActive) {
        lightIntensity = Math.min(1, lightIntensity + dt / 120);
      } else {
        lightIntensity = Math.max(0, lightIntensity - dt / 400);
      }

      // Smooth pointer position (lerp 0.18 per frame)
      if (lightIntensity > 0.002 && currentX >= 0) {
        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;

        const mx = currentX;
        const my = currentY;

        ctx.font = '13px "JetBrains Mono", "Fira Code", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Bounding box: skip cells outside the spotlight radius
        const minCol = Math.max(0, Math.floor((mx - RADIUS) / CELL_W));
        const maxCol = Math.min(cols - 1, Math.ceil((mx + RADIUS) / CELL_W));
        const minRow = Math.max(0, Math.floor((my - RADIUS) / CELL_H));
        const maxRow = Math.min(rows - 1, Math.ceil((my + RADIUS) / CELL_H));

        for (let r = minRow; r <= maxRow; r++) {
          const rowOffset = r * cols;
          for (let c = minCol; c <= maxCol; c++) {
            const cell = grid[rowOffset + c];
            if (!cell) continue;

            const cx = c * CELL_W + CELL_W / 2;
            const cy = r * CELL_H + CELL_H / 2;
            const d = Math.hypot(cx - mx, cy - my);

            if (d >= RADIUS) continue;

            // Distance-based falloff (ease-out)
            const t = Math.max(0, 1 - d / RADIUS);
            const alpha = t * t * cell.alpha;

            // Color: #22C55E rgb(34, 197, 94) at perimeter -> #00FF66 rgb(0, 255, 102) near center
            const baseR = Math.round(34 * (1 - t) + 0 * t);
            const baseG = Math.round(197 * (1 - t) + 255 * t);
            const baseB = Math.round(94 * (1 - t) + 102 * t);

            // Momentary flash effect on glitch
            const timeSinceGlitch = now - cell.glitchTime;
            const flash =
              !prefersReducedMotion && timeSinceGlitch >= 0 && timeSinceGlitch < FLASH_DURATION_MS
                ? 1 - timeSinceGlitch / FLASH_DURATION_MS
                : 0;

            const finalR = Math.min(255, Math.round(baseR + flash * 160));
            const finalG = Math.min(255, Math.round(baseG + flash * 30));
            const finalB = Math.min(255, Math.round(baseB + flash * 160));
            const finalAlpha = Math.min(1, (alpha + flash * 0.35) * lightIntensity);

            if (finalAlpha <= 0.005) continue;

            ctx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${finalAlpha})`;
            ctx.fillText(cell.char, cx, cy);
          }
        }

        // Ambient soft glow layer on top of characters
        const glowGrad = ctx.createRadialGradient(mx, my, 0, mx, my, RADIUS);
        glowGrad.addColorStop(0, `rgba(0, 255, 102, ${0.28 * lightIntensity})`);
        glowGrad.addColorStop(0.5, `rgba(0, 255, 102, ${0.10 * lightIntensity})`);
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(mx, my, RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animId);
      window.clearInterval(glitchIntervalId);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResizeDebounced);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      window.removeEventListener('pointerleave', handlePointerEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10 touch-none"
      aria-hidden="true"
    />
  );
};
