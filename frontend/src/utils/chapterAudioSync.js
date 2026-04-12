/**
 * Đồng bộ thời gian phát với trang ảnh: dùng trọng số OCR từng trang (page_sync) nếu có,
 * không thì chia đều như trước.
 */

export function parsePageSync(raw) {
  if (raw == null) return null;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || !Array.isArray(obj.weights) || obj.weights.length === 0) return null;
    return obj;
  } catch {
    return null;
  }
}

export function normalizedWeights(weights, imageCount) {
  let w = Array.isArray(weights) ? weights.slice(0, imageCount) : [];
  while (w.length < imageCount) w.push(1);
  if (w.length > imageCount) w = w.slice(0, imageCount);
  return w.map((x) => Math.max(1, Math.floor(Number(x)) || 1));
}

/** Thời điểm bắt đầu đoạn audio gắn với ảnh `imageIndex` (0-based). */
export function segmentStartTime(imageIndex, duration, imageCount, pageSync) {
  if (!Number.isFinite(duration) || duration <= 0 || imageCount <= 0) return 0;
  const idx = Math.min(Math.max(0, imageIndex), imageCount - 1);
  if (idx === 0) return 0;
  const w = pageSync?.weights
    ? normalizedWeights(pageSync.weights, imageCount)
    : Array(imageCount).fill(1);
  const sum = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < idx; i++) {
    acc += w[i] / sum;
  }
  return acc * duration;
}

/** Thời điểm trong đoạn ảnh `imageIndex`, lệch nhẹ vào đầu đoạn (cuộn → seek). */
export function timeInSegmentForScroll(imageIndex, duration, imageCount, pageSync, fractionInSegment = 0.12) {
  const start = segmentStartTime(imageIndex, duration, imageCount, pageSync);
  const end =
    imageIndex < imageCount - 1
      ? segmentStartTime(imageIndex + 1, duration, imageCount, pageSync)
      : duration;
  const span = Math.max(0, end - start);
  return Math.min(start + Math.max(0.04, span * fractionInSegment), Math.max(0, duration - 0.02));
}

/**
 * Từ currentTime (s) → chỉ số ảnh đang phát.
 */
export function timeToImageIndex(currentTime, duration, imageCount, pageSync) {
  if (!Number.isFinite(duration) || duration <= 0 || imageCount <= 0) return 0;
  const t = Math.min(Math.max(0, currentTime / duration), 1 - 1e-6);
  const w = pageSync?.weights
    ? normalizedWeights(pageSync.weights, imageCount)
    : Array(imageCount).fill(1);
  const sum = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < imageCount; i++) {
    const next = acc + w[i] / sum;
    if (t < next || i === imageCount - 1) return i;
    acc = next;
  }
  return imageCount - 1;
}
