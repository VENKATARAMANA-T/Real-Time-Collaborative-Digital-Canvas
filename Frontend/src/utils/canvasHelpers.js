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
    const fontSize = el.fontSize || 24;
    const lineHeight = fontSize * 1.2;
    const maxWidth = Math.abs(el.w);

    // We need a context to measure text. If we don't have one, we estimate.
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${el.bold ? 'bold ' : ''}${el.italic ? 'italic ' : ''}${fontSize}px ${el.font || 'sans-serif'}`;

    const paragraphs = (el.text || '').split('\n');
    let totalLines = 0;

    paragraphs.forEach(paragraph => {
      const words = paragraph.split(' ');
      let currentLine = '';
      let pLines = 0;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth <= maxWidth || currentLine === '') {
          currentLine = testLine;
          if (ctx.measureText(currentLine).width > maxWidth && maxWidth > 0) {
            let charLine = '';
            for (let j = 0; j < currentLine.length; j++) {
              if (ctx.measureText(charLine + currentLine[j]).width > maxWidth) {
                pLines++;
                charLine = currentLine[j];
              } else {
                charLine += currentLine[j];
              }
            }
            currentLine = charLine;
          }
        } else {
          pLines++;
          currentLine = word;
          if (ctx.measureText(currentLine).width > maxWidth && maxWidth > 0) {
            let charLine = '';
            for (let j = 0; j < currentLine.length; j++) {
              if (ctx.measureText(charLine + currentLine[j]).width > maxWidth) {
                pLines++;
                charLine = currentLine[j];
              } else {
                charLine += currentLine[j];
              }
            }
            currentLine = charLine;
          }
        }
      }
      totalLines += pLines + 1;
    });

    const actualHeight = Math.max(Math.abs(el.h), totalLines * lineHeight);
    return { x: el.x, y: el.y, w: Math.abs(el.w), h: actualHeight };
  }
  if (el.type === 'path') {
    if (!el.points || el.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    let minX = el.points[0].x;
    let minY = el.points[0].y;
    let maxX = el.points[0].x;
    let maxY = el.points[0].y;
    el.points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  if (el.rotation) {
    const cx = el.x + el.w / 2;
    const cy = el.y + el.h / 2;
    const points = [
      { x: el.x, y: el.y },
      { x: el.x + el.w, y: el.y },
      { x: el.x + el.w, y: el.y + el.h },
      { x: el.x, y: el.y + el.h }
    ].map(p => {
      const cos = Math.cos(el.rotation);
      const sin = Math.sin(el.rotation);
      const dx = p.x - cx;
      const dy = p.y - cy;
      return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos
      };
    });
    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxX = Math.max(...points.map(p => p.x));
    const maxY = Math.max(...points.map(p => p.y));
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  const x = Math.min(el.x, el.x + el.w);
  const y = Math.min(el.y, el.y + el.h);
  const w = Math.abs(el.w);
  const h = Math.abs(el.h);
  return { x, y, w, h };
};

export const isPointInElement = (x, y, el) => {
  const bounds = getElementBounds(el);
  const buffer = 10;
  return x >= bounds.x - buffer && x <= bounds.x + bounds.w + buffer &&
    y >= bounds.y - buffer && y <= bounds.y + bounds.h + buffer;
};
export const recognizeShape = (points) => {
  if (!points || points.length < 5) return [];

  const b = {
    minX: Math.min(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)),
    maxX: Math.max(...points.map(p => p.x)),
    maxY: Math.max(...points.map(p => p.y))
  };

  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const cx = b.minX + w / 2;
  const cy = b.minY + h / 2;
  const diag = Math.sqrt(w * w + h * h);

  // 1. Detect Corners/Edges by analyzing sudden direction changes
  const corners = [];
  const minCornerDist = diag * 0.15; // Increased slightly for better separation
  const windowSize = 4; // Larger window for smoother direction analysis

  for (let i = windowSize; i < points.length - windowSize; i++) {
    const pPrev = points[i - windowSize];
    const pCurr = points[i];
    const pNext = points[i + windowSize];

    const v1 = { x: pCurr.x - pPrev.x, y: pCurr.y - pPrev.y };
    const v2 = { x: pNext.x - pCurr.x, y: pNext.y - pCurr.y };

    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (mag1 > 0.8 && mag2 > 0.8) {
      const dot = (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

      // High curvature or sharp turn detected
      if (angle > 0.65) { // Stricter angle for "true" corners
        if (corners.length === 0 || Math.sqrt((pCurr.x - corners[corners.length - 1].x) ** 2 + (pCurr.y - corners[corners.length - 1].y) ** 2) > minCornerDist) {
          corners.push(pCurr);
        }
      }
    }
  }

  const numCorners = corners.length;
  // Closed shape check
  const start = points[0];
  const end = points[points.length - 1];
  const isClosed = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2) < diag * 0.2;

  // For polygons, we expect N corners if closed, or N-1 if open but tracing the same path
  const effectiveCorners = numCorners + (isClosed ? 1 : 0);

  // 2. Smoothness/Circularity check
  const radius = (w + h) / 4;
  let deviance = 0;
  points.forEach(p => {
    const d = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
    deviance += Math.abs(d - radius);
  });
  const avgDeviance = deviance / points.length;
  const isSmooth = avgDeviance < radius * 0.2 && numCorners < 2;

  const candidates = [];

  const types = [
    { type: 'line', corners: 0 },
    { type: 'rect', corners: 4 },
    { type: 'circle', corners: 0, smooth: true },
    { type: 'triangle', corners: 3 },
    { type: 'star', corners: 10 },
    { type: 'arrow', corners: 7 },
    { type: 'rhombus', corners: 4 },
    { type: 'pentagon', corners: 5 },
    { type: 'hexagon', corners: 6 },
    { type: 'callout', corners: 4 },
    { type: 'ellipse', corners: 0, smooth: true }
  ];

  types.forEach(variant => {
    let score = 100;

    if (variant.type === 'line') {
      const dist = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
      if (dist < 20) score = 100;
      else {
        let totalDist = 0;
        points.forEach(p => {
          const area = Math.abs((end.y - start.y) * p.x - (end.x - start.x) * p.y + end.x * start.y - end.y * start.x);
          totalDist += area / dist;
        });
        score = (totalDist / points.length) / (diag * 0.05);
      }
    } else if (variant.smooth) {
      if (numCorners > 1) score = 100; // Circles shouldn't have many corners
      else {
        score = avgDeviance / (radius * 0.2);
        if (variant.type === 'circle') score += (Math.abs(w - h) / Math.max(w, h)) * 3;
      }
    } else {
      // STRICT EDGE MATCHING
      const cornerDiff = Math.abs(effectiveCorners - variant.corners);

      // Heavy penalty for wrong corner count
      if (cornerDiff === 1) score = 1.5;
      else if (cornerDiff === 0) score = 0.4;
      else score = 20; // Effectively filter out

      if (isSmooth) score += 5; // Polygons shouldn't be smooth circle-like
    }

    if (score < 2.5) {
      const shape = { type: variant.type, x: b.minX, y: b.minY, w, h };
      if (variant.type === 'line' || variant.type === 'arrow') {
        shape.x = start.x; shape.y = start.y;
        shape.w = end.x - start.x; shape.h = end.y - start.y;
      }
      candidates.push({ ...shape, score });
    }
  });

  return candidates.sort((a, b) => a.score - b.score).slice(0, 5);
};

export const drawElement = (ctx, el, isSelected = false, isEditing = false) => {
  if (!ctx) return;
  ctx.save();
  if (el.rotation) {
    const cx = el.x + el.w / 2;
    const cy = el.y + el.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(el.rotation);
    ctx.translate(-cx, -cy);
  }

  ctx.strokeStyle = el.color;
  ctx.fillStyle = el.color;
  ctx.lineWidth = el.strokeWidth;
  ctx.globalAlpha = el.opacity;
  ctx.beginPath();

  if (el.type === 'raster-fill') {
    if (el.image) {
      ctx.drawImage(el.image, el.x, el.y, el.w, el.h);
    }
  } else if (el.type === 'rect') {
    ctx.strokeRect(el.x, el.y, el.w, el.h);
    if (el.fill) { ctx.fillStyle = el.color; ctx.fillRect(el.x, el.y, el.w, el.h); }
  }
  else if (el.type === 'circle' || el.type === 'ellipse') {
    const radiusX = Math.abs(el.w) / 2;
    const radiusY = Math.abs(el.h) / 2;
    const centerX = el.x + el.w / 2;
    const centerY = el.y + el.h / 2;
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    if (el.fill) { ctx.fillStyle = el.color; ctx.fill(); }
    ctx.stroke();
  }
  else if (el.type === 'line') {
    ctx.moveTo(el.x, el.y);
    ctx.lineTo(el.x + el.w, el.y + el.h);
    ctx.stroke();
  }
  else if (el.type === 'triangle') {
    ctx.moveTo(el.x + el.w / 2, el.y);
    ctx.lineTo(el.x, el.y + el.h);
    ctx.lineTo(el.x + el.w, el.y + el.h);
    ctx.closePath();
    if (el.fill) { ctx.fillStyle = el.color; ctx.fill(); }
    ctx.stroke();
  }
  else if (el.type === 'pentagon') drawRegularPolygon(ctx, el.x, el.y, el.w, el.h, 5, el.fill);
  else if (el.type === 'hexagon') drawRegularPolygon(ctx, el.x, el.y, el.w, el.h, 6, el.fill);
  else if (el.type === 'callout') drawCalloutShape(ctx, el.x, el.y, el.w, el.h, el.fill);
  else if (el.type === 'rhombus') {
    ctx.moveTo(el.x + el.w / 2, el.y);
    ctx.lineTo(el.x + el.w, el.y + el.h / 2);
    ctx.lineTo(el.x + el.w / 2, el.y + el.h);
    ctx.lineTo(el.x, el.y + el.h / 2);
    ctx.closePath();
    if (el.fill) { ctx.fillStyle = el.color; ctx.fill(); }
    ctx.stroke();
  } else if (el.type === 'star') drawStarShape(ctx, el.x, el.y, el.w, el.h, el.fill);
  else if (el.type === 'arrow') drawArrowShape(ctx, el.x, el.y, el.w, el.h, el.fill);
  else if (el.type === 'path') {
    if (el.points && el.points.length > 0) {
      ctx.save();
      if (el.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // Opaque stroke for destination-out
      } else {
        ctx.strokeStyle = el.color;
      }
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(el.points[0].x, el.points[0].y);
      for (let i = 1; i < el.points.length - 2; i++) {
        const xc = (el.points[i].x + el.points[i + 1].x) / 2;
        const yc = (el.points[i].y + el.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, xc, yc);
      }
      if (el.points.length > 2) {
        ctx.quadraticCurveTo(
          el.points[el.points.length - 2].x,
          el.points[el.points.length - 2].y,
          el.points[el.points.length - 1].x,
          el.points[el.points.length - 1].y
        );
      } else if (el.points.length === 2) {
        ctx.lineTo(el.points[1].x, el.points[1].y);
      }

      if (el.fill) {
        ctx.fillStyle = el.color;
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();
    }
  } else if (el.type === 'text') {
    if (!isEditing) {
      const fontSize = el.fontSize || 24;
      const lineHeight = fontSize * 1.2;
      const fontStr = `${el.bold ? 'bold ' : ''}${el.italic ? 'italic ' : ''}${fontSize}px ${el.font || 'sans-serif'}`;
      ctx.font = fontStr;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      const maxWidth = Math.abs(el.w);
      const paragraphs = (el.text || '').split('\n');
      const lines = [];

      paragraphs.forEach(paragraph => {
        const words = paragraph.split(' ');
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine ? currentLine + ' ' + word : word;
          const testWidth = ctx.measureText(testLine).width;

          if (testWidth <= maxWidth || currentLine === '') {
            currentLine = testLine;

            // If the single word is still too wide, we must break it character by character
            if (ctx.measureText(currentLine).width > maxWidth && maxWidth > 0) {
              let charLine = '';
              for (let j = 0; j < currentLine.length; j++) {
                const char = currentLine[j];
                if (ctx.measureText(charLine + char).width > maxWidth) {
                  lines.push(charLine);
                  charLine = char;
                } else {
                  charLine += char;
                }
              }
              currentLine = charLine;
            }
          } else {
            lines.push(currentLine);
            currentLine = word;

            // Re-check if the new word is too wide
            if (ctx.measureText(currentLine).width > maxWidth && maxWidth > 0) {
              let charLine = '';
              for (let j = 0; j < currentLine.length; j++) {
                const char = currentLine[j];
                if (ctx.measureText(charLine + char).width > maxWidth) {
                  lines.push(charLine);
                  charLine = char;
                } else {
                  charLine += char;
                }
              }
              currentLine = charLine;
            }
          }
        }
        lines.push(currentLine);
      });

      if (el.background) {
        ctx.save();
        ctx.fillStyle = el.backgroundColor || 'rgba(255,255,255,0.8)';
        ctx.fillRect(el.x, el.y, el.w, el.h);
        ctx.restore();
      }

      ctx.fillStyle = el.color;
      lines.forEach((line, i) => {
        const lineY = el.y + (i * lineHeight);
        let lineX = el.x;
        const m = ctx.measureText(line);
        if (el.align === 'center') lineX = el.x + (el.w - m.width) / 2;
        else if (el.align === 'right') lineX = el.x + (el.w - m.width);

        ctx.fillText(line, lineX, lineY);
        if (el.underline || el.strikethrough) {
          if (el.underline) {
            ctx.beginPath();
            ctx.moveTo(lineX, lineY + fontSize + 2);
            ctx.lineTo(lineX + m.width, lineY + fontSize + 2);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          if (el.strikethrough) {
            ctx.beginPath();
            ctx.moveTo(lineX, lineY + fontSize / 2);
            ctx.lineTo(lineX + m.width, lineY + fontSize / 2);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });
    }
  }

  if (isSelected && !isEditing) {
    const bounds = getElementBounds(el);
    ctx.restore();
    ctx.save();

    // Draw selection box around the ACTUAL orientation if not path
    if (el.type !== 'path') {
      const cx = el.x + el.w / 2;
      const cy = el.y + el.h / 2;
      if (el.rotation) {
        ctx.translate(cx, cy);
        ctx.rotate(el.rotation);
        ctx.translate(-cx, -cy);
      }

      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(el.x - 4, el.y - 4, el.w + 8, el.h + 8);

      ctx.setLineDash([]);
      ctx.fillStyle = 'white';
      // Resize handle
      ctx.fillRect(el.x + el.w + 2, el.y + el.h + 2, 8, 8);
      ctx.strokeRect(el.x + el.w + 2, el.y + el.h + 2, 8, 8);

      // Rotation handle
      ctx.beginPath();
      ctx.moveTo(el.x + el.w / 2, el.y - 4);
      ctx.lineTo(el.x + el.w / 2, el.y - 24);
      ctx.stroke();
      ctx.fillRect(el.x + el.w / 2 - 4, el.y - 28, 8, 8);
      ctx.strokeRect(el.x + el.w / 2 - 4, el.y - 28, 8, 8);
    } else {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8);
    }
  }
  ctx.restore();
};

export const floodFill = (ctx, x, y, fillColor) => {
  const dpr = window.devicePixelRatio || 1;
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // Get image data at DPR scale
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const ix = Math.floor(x * dpr);
  const iy = Math.floor(y * dpr);

  if (ix < 0 || ix >= width || iy < 0 || iy >= height) return null;

  const startPos = (iy * width + ix) * 4;
  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  // Convert hex to RGBA
  const temp = document.createElement('div');
  temp.style.color = fillColor;
  document.body.appendChild(temp);
  const rgbString = window.getComputedStyle(temp).color;
  const [r, g, b] = rgbString.match(/\d+/g).map(Number);
  const a = 255; // Default full opacity
  document.body.removeChild(temp);

  if (startR === r && startG === g && startB === b && startA === a) return null;

  const stack = [[ix, iy]];
  const targetColor = (r << 24) | (g << 16) | (b << 8) | a;

  // Create a new mask canvas
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  const maskData = maskCtx.createImageData(width, height);
  const mask = maskData.data;

  const match = (p) => {
    return data[p] === startR && data[p + 1] === startG && data[p + 2] === startB && data[p + 3] === startA;
  };

  const setMask = (p) => {
    mask[p] = r;
    mask[p + 1] = g;
    mask[p + 2] = b;
    mask[p + 3] = a;
    // Mark as visited in source to avoid cycles
    data[p + 3] = 0;
  };

  while (stack.length > 0) {
    var [currX, currY] = stack.pop();
    let p = (currY * width + currX) * 4;

    // Fill upwards
    while (currY >= 0 && match(p)) {
      p -= width * 4;
      currY--;
    }
    p += width * 4;
    currY++;

    let reachLeft = false;
    let reachRight = false;

    while (currY < height && match(p)) {
      setMask(p);

      if (currX > 0) {
        if (match(p - 4)) {
          if (!reachLeft) {
            stack.push([currX - 1, currY]);
            reachLeft = true;
          }
        } else {
          reachLeft = false;
        }
      }

      if (currX < width - 1) {
        if (match(p + 4)) {
          if (!reachRight) {
            stack.push([currX + 1, currY]);
            reachRight = true;
          }
        } else {
          reachRight = false;
        }
      }

      p += width * 4;
      currY++;
    }
  }

  maskCtx.putImageData(maskData, 0, 0);

  // Return as an image that can be drawn
  const finalImage = new Image();
  finalImage.src = maskCanvas.toDataURL();

  return {
    type: 'raster-fill',
    x: 0,
    y: 0,
    w: width / dpr,
    h: height / dpr,
    image: finalImage,
    dataUrl: finalImage.src,
    layerId: null // To be set by caller
  };
};
