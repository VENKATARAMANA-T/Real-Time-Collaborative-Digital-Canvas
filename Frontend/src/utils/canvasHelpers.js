export const drawRegularPolygon = (ctx, x, y, w, h, sides, fill) => {
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  const radius = Math.min(Math.abs(w), Math.abs(h)) / 2;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const px = centerX + radius * Math.cos(angle);
    const py = centerY + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (fill) ctx.fill();
  ctx.stroke();
};

export const drawStarShape = (ctx, x, y, w, h, fill) => {
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  const outerRadius = Math.min(Math.abs(w), Math.abs(h)) / 2;
  const innerRadius = outerRadius / 2.2;
  const spikes = 5;
  let rot = Math.PI / 2 * 3;
  let cx = centerX;
  let cy = centerY;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    let xPos = cx + Math.cos(rot) * outerRadius;
    let yPos = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(xPos, yPos);
    rot += step;
    xPos = cx + Math.cos(rot) * innerRadius;
    yPos = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(xPos, yPos);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  if (fill) ctx.fill();
  ctx.stroke();
};

export const drawArrowShape = (ctx, x, y, w, h, fill) => {
  const p1x = x; const p1y = y + h * 0.25;
  const p2x = x + w * 0.6; const p2y = y + h * 0.25;
  const p3x = x + w * 0.6; const p3y = y;
  const p4x = x + w; const p4y = y + h * 0.5;
  const p5x = x + w * 0.6; const p5y = y + h;
  const p6x = x + w * 0.6; const p6y = y + h * 0.75;
  const p7x = x; const p7y = y + h * 0.75;

  ctx.beginPath();
  ctx.moveTo(p1x, p1y); ctx.lineTo(p2x, p2y); ctx.lineTo(p3x, p3y);
  ctx.lineTo(p4x, p4y); ctx.lineTo(p5x, p5y); ctx.lineTo(p6x, p6y);
  ctx.lineTo(p7x, p7y);
  ctx.closePath();
  if (fill) ctx.fill();
  ctx.stroke();
};

export const drawCalloutShape = (ctx, x, y, w, h, fill) => {
  const bx = w < 0 ? x + w : x;
  const by = h < 0 ? y + h : y;
  const bw = Math.abs(w);
  const bh = Math.abs(h);
  const r = Math.min(20, Math.min(bw, bh) / 4);
  const tailW = Math.min(20, bw / 4);
  const tailH = Math.min(20, bh / 4);

  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.lineTo(bx + bw - r, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
  ctx.lineTo(bx + bw, by + bh - tailH - r);
  ctx.quadraticCurveTo(bx + bw, by + bh - tailH, bx + bw - r, by + bh - tailH);
  ctx.lineTo(bx + bw / 2 + tailW, by + bh - tailH);
  ctx.lineTo(bx + bw / 2, by + bh);
  ctx.lineTo(bx + bw / 2 - tailW / 2, by + bh - tailH);
  ctx.lineTo(bx + r, by + bh - tailH);
  ctx.quadraticCurveTo(bx, by + bh - tailH, bx, by + bh - tailH - r);
  ctx.lineTo(bx, by + r);
  ctx.quadraticCurveTo(bx, by, bx + r, by);
  ctx.closePath();
  if (fill) ctx.fill();
  ctx.stroke();
};

export const getElementBounds = (el) => {
  if (el.type === 'text') {
    return { x: el.x, y: el.y, w: el.w, h: el.h };
  }
  const x = Math.min(el.x, el.x + el.w);
  const y = Math.min(el.y, el.y + el.h);
  const w = Math.abs(el.w);
  const h = Math.abs(el.h);
  return { x, y, w, h };
};

export const isPointInElement = (x, y, el) => {
  const bounds = getElementBounds(el);
  const buffer = 5;
  return x >= bounds.x - buffer && x <= bounds.x + bounds.w + buffer &&
    y >= bounds.y - buffer && y <= bounds.y + bounds.h + buffer;
};
