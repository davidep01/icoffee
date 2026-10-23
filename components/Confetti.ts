/**
 * Coriandoli e chicchi di caffè per celebrare chi offre. Disegnati su un canvas
 * temporaneo, niente librerie; saltati con "riduci movimento".
 */
export function fireConfetti(colors: string[]) {
  if (typeof window === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:70";
  canvas.setAttribute("aria-hidden", "true");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = innerWidth;
  const h = innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  document.body.appendChild(canvas);
  const g = canvas.getContext("2d");
  if (!g) return canvas.remove();
  g.scale(dpr, dpr);

  const parts = Array.from({ length: 150 }, (_, i) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
    const speed = 9 + Math.random() * 12;
    return {
      x: w / 2 + (Math.random() - 0.5) * 60,
      y: h * 0.34,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.35,
      size: 6 + Math.random() * 6,
      bean: i % 4 === 0,
      color: colors[i % colors.length],
      wobble: Math.random() * Math.PI * 2,
    };
  });

  const t0 = performance.now();
  const life = 2800;
  const frame = (now: number) => {
    const t = now - t0;
    g.clearRect(0, 0, w, h);
    g.globalAlpha = Math.max(0, 1 - Math.max(0, t - life * 0.55) / (life * 0.45));
    for (const p of parts) {
      p.vy += 0.38;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx + Math.sin(p.wobble + t / 180) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      if (p.bean) {
        g.fillStyle = "#4a2a14";
        g.beginPath();
        g.ellipse(0, 0, p.size * 0.6, p.size * 0.85, 0, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "#c8945f";
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(0, -p.size * 0.6);
        g.quadraticCurveTo(p.size * 0.25, 0, 0, p.size * 0.6);
        g.stroke();
      } else {
        g.fillStyle = p.color;
        g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2 + Math.abs(Math.sin(p.rot)) * p.size * 0.4);
      }
      g.restore();
    }
    if (t < life) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
