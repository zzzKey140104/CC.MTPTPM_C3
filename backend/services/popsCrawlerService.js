const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const db = require('../config/database');

const POPS_BASE_URL = 'https://pops.vn';

function slugify(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function absoluteUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${POPS_BASE_URL}${url}`;
  return `${POPS_BASE_URL}/${url}`;
}

function isLikelyValidPopsComicUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const normalized = url.trim();
  if (!/^https:\/\/pops\.vn\/comics\//i.test(normalized)) return false;
  if (normalized.includes('[tid]') || normalized.includes('{') || normalized.includes('}')) return false;
  if (/\/404(?:$|[/?#])/i.test(normalized)) return false;
  return true;
}

function decodeEscapedSlashes(text = '') {
  if (!text) return '';
  return text.replace(/\\\//g, '/');
}

function normalizeScriptPayload(text = '') {
  if (!text) return '';
  return decodeEscapedSlashes(text)
    .replace(/\\u002F/gi, '/')
    // Handles payloads like \"purchaseType\":\"CHAPTER\"
    .replace(/\\"/g, '"');
}

function collectChapterLinksFromObject(payload, outputSet) {
  if (!payload) return;
  if (Array.isArray(payload)) {
    payload.forEach((item) => collectChapterLinksFromObject(item, outputSet));
    return;
  }
  if (typeof payload !== 'object') return;

  const purchaseId = typeof payload.purchaseId === 'string' ? payload.purchaseId : null;
  const purchaseGroupId = typeof payload.purchaseGroupId === 'string' ? payload.purchaseGroupId : null;
  if (purchaseId && purchaseGroupId) {
    outputSet.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}/${purchaseId}`);
    outputSet.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}?chapterId=${purchaseId}`);
    outputSet.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}?purchaseId=${purchaseId}`);
  }

  Object.values(payload).forEach((value) => collectChapterLinksFromObject(value, outputSet));
}

function extractChapterLinksFromNextData(rawHtml = '') {
  const links = new Set();
  if (!rawHtml) return links;
  try {
    const nextDataMatch = rawHtml.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i
    );
    if (!nextDataMatch || !nextDataMatch[1]) return links;
    const nextData = JSON.parse(nextDataMatch[1]);
    collectChapterLinksFromObject(nextData, links);
  } catch (error) {
    // Keep crawler resilient: fallback extractors may still work.
  }
  return links;
}

function extractChapterCandidatesFromScript(decodedScriptText) {
  const chapterLinks = new Set();
  if (!decodedScriptText) return chapterLinks;

  // 0) Direct pair extraction (most stable across payload shapes)
  const pairRegexForward =
    /\\?"purchaseId\\?"\s*:\s*\\?"([a-f0-9]{24})\\?"\s*,\s*\\?"purchaseGroupId\\?"\s*:\s*\\?"([a-f0-9]{24})\\?"/gi;
  let pairForwardMatch = pairRegexForward.exec(decodedScriptText);
  while (pairForwardMatch) {
    const purchaseId = pairForwardMatch[1];
    const purchaseGroupId = pairForwardMatch[2];
    chapterLinks.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}/${purchaseId}`);
    chapterLinks.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}?chapterId=${purchaseId}`);
    chapterLinks.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}?purchaseId=${purchaseId}`);
    pairForwardMatch = pairRegexForward.exec(decodedScriptText);
  }

  const pairRegexBackward =
    /\\?"purchaseGroupId\\?"\s*:\s*\\?"([a-f0-9]{24})\\?"\s*,\s*\\?"purchaseId\\?"\s*:\s*\\?"([a-f0-9]{24})\\?"/gi;
  let pairBackwardMatch = pairRegexBackward.exec(decodedScriptText);
  while (pairBackwardMatch) {
    const purchaseGroupId = pairBackwardMatch[1];
    const purchaseId = pairBackwardMatch[2];
    chapterLinks.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}/${purchaseId}`);
    chapterLinks.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}?chapterId=${purchaseId}`);
    chapterLinks.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}?purchaseId=${purchaseId}`);
    pairBackwardMatch = pairRegexBackward.exec(decodedScriptText);
  }

  // 1) Direct URL-like matches
  const directUrlMatches =
    decodedScriptText.match(/https?:\/\/pops\.vn\/[^\s"'<>\\]+|\/comics\/[^\s"'<>\\]+/g) || [];
  directUrlMatches.forEach((u) => chapterLinks.add(absoluteUrl(u)));

  // 2) Robust extraction around "purchaseType":"CHAPTER"
  // Avoid regex-by-object parsing because POPS embeds nested JSON objects.
  const chapterTypeRegex = /\\?"purchaseType\\?"\s*:\s*\\?"CHAPTER\\?"/gi;
  let chapterTypeMatch = chapterTypeRegex.exec(decodedScriptText);
  while (chapterTypeMatch) {
    const idx = chapterTypeMatch.index;
    const windowStart = Math.max(0, idx - 1600);
    const windowEnd = Math.min(decodedScriptText.length, idx + 1600);
    const windowText = decodedScriptText.slice(windowStart, windowEnd);

    const purchaseId = (windowText.match(/\\?"purchaseId\\?"\s*:\s*\\?"([a-f0-9]{24})\\?"/i) || [])[1];
    const purchaseGroupId = (windowText.match(/\\?"purchaseGroupId\\?"\s*:\s*\\?"([a-f0-9]{24})\\?"/i) || [])[1];
    if (purchaseId && purchaseGroupId) {
      chapterLinks.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}/${purchaseId}`);
      chapterLinks.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}?chapterId=${purchaseId}`);
      chapterLinks.add(`${POPS_BASE_URL}/comics/${purchaseGroupId}?purchaseId=${purchaseId}`);
    }

    chapterTypeMatch = chapterTypeRegex.exec(decodedScriptText);
  }

  return chapterLinks;
}

async function fetchHtml(url) {
  const requestConfig = {
    timeout: 30000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml'
    }
  };

  try {
    const response = await axios.get(url, requestConfig);
    return response.data;
  } catch (error) {
    const isTlsLeafCertError =
      error?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
      error?.cause?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';

    if (!isTlsLeafCertError) {
      throw error;
    }

    try {
      // Fallback for Windows/Node CA chain issues.
      console.warn('TLS cert verify failed, retrying with insecure TLS agent for URL:', url);
      const insecureAgent = new https.Agent({ rejectUnauthorized: false });
      const retryResponse = await axios.get(url, {
        ...requestConfig,
        httpsAgent: insecureAgent
      });
      return retryResponse.data;
    } catch (retryError) {
      throw retryError;
    }
  }
}

function extractComicMeta($, rawHtml = '') {
  const title =
    $('.pt-2.text-2xl.font-bold.desktop\\:text-3xl.desktop\\:pt-0.desktopLg\\:text-4xl').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    '';

  const coverImage =
    absoluteUrl($('.index_desktop_image__27E7e img').first().attr('src')) ||
    absoluteUrl($('meta[property="og:image"]').attr('content'));

  const description =
    $('.pb-5.undefined.desktop\\:text-lg.desktopLg\\:text-xl').first().text().trim() ||
    $('meta[name="description"]').attr('content') ||
    '';

  const metaText = $('.banner-comic__meta').first().text().replace(/\s+/g, ' ').trim();
  const metaByLabel = {};
  $('.banner-comic__meta .metadata_item__bET16').each((_, el) => {
    const rawLabel = $(el).find('.metadata_label__DARMb').first().text().replace(':', '').trim();
    if (!rawLabel) return;
    const values = [];
    $(el)
      .find('.metadata_info__LnFyC a, .metadata_info__LnFyC .metadata_infoItem__5rfU0, .metadata_info__LnFyC span')
      .each((__, itemEl) => {
        const value = $(itemEl).text().replace(/\s+/g, ' ').trim();
        if (value && !values.includes(value) && !/chương mới nhất/i.test(value)) {
          values.push(value);
        }
      });
    if (!values.length) {
      const fallback = $(el).find('.metadata_info__LnFyC').text().replace(/\s+/g, ' ').trim();
      if (fallback) values.push(fallback);
    }
    metaByLabel[rawLabel.toLowerCase()] = values;
  });

  const genres = metaByLabel['thể loại'] || [];

  const chapterLinks = new Set();
  const comicDetailCanonicalUrl = absoluteUrl($('meta[property="og:url"]').attr('content') || '');
  const comicIdFromCanonical = (comicDetailCanonicalUrl.match(/\/comics\/([a-f0-9]{24})(?:$|[/?#])/i) || [])[1];
  // 1) Normal anchors
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const chapterUrl = absoluteUrl(href);
    if (/chapter|chuong|\/comics\//i.test(chapterUrl)) {
      chapterLinks.add(chapterUrl);
    }
  });

  // 2) Clickable cards often keep URL in data-* or inline handlers
  $('[data-href], [data-url], [onclick]').each((_, el) => {
    const candidate = $(el).attr('data-href') || $(el).attr('data-url') || $(el).attr('onclick') || '';
    const match = candidate.match(/(https?:\/\/[^\s'"]+|\/comics\/[^\s'"]+)/i);
    if (!match) return;
    const chapterUrl = absoluteUrl(match[1]);
    if (/\/comics\//i.test(chapterUrl)) {
      chapterLinks.add(chapterUrl);
    }
  });

  // 3) JSON scripts (__NEXT_DATA__ / bootstrap data)
  const scriptText = $('script')
    .map((_, el) => $(el).html() || '')
    .get()
    .join('\n');
  const decodedScriptText = normalizeScriptPayload(scriptText);
  const chapterCandidatesFromScript = extractChapterCandidatesFromScript(decodedScriptText);
  chapterCandidatesFromScript.forEach((u) => {
    if (/\/comics\//i.test(u)) chapterLinks.add(u);
  });

  // 4) Some POPS payloads are embedded outside script tags in initial HTML snapshot.
  const normalizedRawHtml = normalizeScriptPayload(rawHtml || $.html() || '');
  const chapterCandidatesFromHtml = extractChapterCandidatesFromScript(normalizedRawHtml);
  chapterCandidatesFromHtml.forEach((u) => {
    if (/\/comics\//i.test(u)) chapterLinks.add(u);
  });

  // 5) Strong fallback: parse __NEXT_DATA__ JSON and collect purchaseId/purchaseGroupId pairs.
  const chapterCandidatesFromNextData = extractChapterLinksFromNextData(rawHtml || '');
  chapterCandidatesFromNextData.forEach((u) => chapterLinks.add(u));

  const dedupedChapterLinks = Array.from(chapterLinks).filter((link) => {
    if (!isLikelyValidPopsComicUrl(link)) return false;
    if (comicDetailCanonicalUrl && link === comicDetailCanonicalUrl) return false;
    // Keep chapter-intent URLs first (query chapter/purchase id or explicit 2-segment path).
    if (/chapterid=|purchaseid=/i.test(link)) return true;
    if (/\/comics\/[a-f0-9]{24}\/[a-f0-9]{24}(?:$|[/?#])/i.test(link)) return true;
    if (comicIdFromCanonical && new RegExp(`/comics/${comicIdFromCanonical}/`, 'i').test(link)) return true;
    // Filter plain comic detail URLs: /comics/<id> or /comics/<slug>-<id>
    if (/\/comics\/[a-f0-9]{24}(?:$|[/?#])/i.test(link)) return false;
    if (/\/comics\/[^/?#]+-[a-f0-9]{24}(?:$|[/?#])/i.test(link)) return false;
    return /\/comics\/.+\/.+/i.test(link);
  });

  return {
    title: title.trim(),
    coverImage: coverImage || null,
    description: description.trim(),
    metaText,
    metaByLabel,
    author: (metaByLabel['tác giả'] || []).join(', '),
    artist: (metaByLabel['hoạ sĩ'] || []).join(', '),
    rating: (metaByLabel['xếp hạng'] || [])[0] || null,
    contentBy: (metaByLabel['nội dung bởi'] || [])[0] || null,
    genres,
    chapterLinks: dedupedChapterLinks
  };
}

function parseChapterNumber(url, title) {
  const byTitle = `${title || ''}`.match(/(?:chapter|chap|chuong)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (byTitle && byTitle[1]) return Number(byTitle[1]);
  const byUrl = `${url || ''}`.match(/(?:chapter|chap|chuong)[-_/]?([0-9]+(?:\.[0-9]+)?)/i);
  if (byUrl && byUrl[1]) return Number(byUrl[1]);
  return null;
}

function canonicalizeChapterUrl(url) {
  const normalized = absoluteUrl(url);
  if (!normalized) return '';

  const fullMatch = normalized.match(/\/comics\/([a-f0-9]{24})\/([a-f0-9]{24})(?:$|[/?#])/i);
  if (fullMatch) {
    // Query format is more stable across POPS routes than direct /group/chapter path.
    return `${POPS_BASE_URL}/comics/${fullMatch[1]}?chapterId=${fullMatch[2]}`;
  }

  const groupMatch = normalized.match(/\/comics\/([a-f0-9]{24})(?:$|[/?#])/i);
  const queryChapterId = (normalized.match(/[?&]chapterid=([a-f0-9]{24})(?:&|$)/i) || [])[1];
  const queryPurchaseId = (normalized.match(/[?&]purchaseid=([a-f0-9]{24})(?:&|$)/i) || [])[1];
  const chapterId = queryChapterId || queryPurchaseId;
  if (groupMatch && chapterId) {
    return `${POPS_BASE_URL}/comics/${groupMatch[1]}?chapterId=${chapterId}`;
  }

  return normalized;
}

function extractNextDataJson(rawHtml = '') {
  if (!rawHtml) return null;
  const match = rawHtml.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!match || !match[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    return null;
  }
}

function findChapterMetaByPurchaseId(payload, purchaseId) {
  if (!payload || !purchaseId) return null;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = findChapterMetaByPurchaseId(item, purchaseId);
      if (found) return found;
    }
    return null;
  }
  if (typeof payload !== 'object') return null;

  if (payload.purchaseId === purchaseId) {
    let cid = '';
    if (typeof payload.cid === 'string' && payload.cid.includes(purchaseId)) cid = payload.cid;
    else if (typeof payload.slug === 'string' && payload.slug.includes(purchaseId)) cid = payload.slug;
    else {
      for (const value of Object.values(payload)) {
        if (typeof value === 'string' && value.includes(purchaseId) && /[a-z0-9-]+-[a-f0-9]{24}$/i.test(value)) {
          cid = value;
          break;
        }
      }
    }
    return {
      purchaseId: payload.purchaseId,
      name: typeof payload.name === 'string' ? payload.name : '',
      cid
    };
  }

  for (const value of Object.values(payload)) {
    const found = findChapterMetaByPurchaseId(value, purchaseId);
    if (found) return found;
  }
  return null;
}

function buildChapterDetailUrlFromNextData(rawHtml = '', chapterId = '') {
  if (!chapterId) return '';
  const nextData = extractNextDataJson(rawHtml);
  if (!nextData) return '';

  const tid = nextData?.query?.tid;
  if (!tid || typeof tid !== 'string') return '';

  const chapterMeta = findChapterMetaByPurchaseId(nextData, chapterId);
  if (chapterMeta?.cid) {
    return `${POPS_BASE_URL}/comics/${tid}/${chapterMeta.cid}`;
  }
  const chapterName = chapterMeta?.name || '';
  const chapterSlug = slugify(chapterName);
  const cid = chapterSlug ? `${chapterSlug}-${chapterId}` : chapterId;
  return `${POPS_BASE_URL}/comics/${tid}/${cid}`;
}

function extractChapterImagesFromHtml(html = '') {
  const $ = cheerio.load(html);
  const images = [];
  const imageSet = new Set();

  const pushImage = (rawUrl) => {
    const normalized = absoluteUrl(rawUrl || '');
    if (!normalized) return;
    if (!/cms_comic|pops-comic-vn\.akamaized\.net/i.test(normalized)) return;
    if (!/\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(normalized)) return;
    if (/logo|icon|avatar|thumbnail|placeholder/i.test(normalized)) return;
    if (imageSet.has(normalized)) return;
    imageSet.add(normalized);
    images.push({
      pageNumber: images.length + 1,
      imageUrl: normalized
    });
  };

  $('.comics-chapter_imgWrap__l_eYq picture source, .comics-chapter_imgWrap__l_eYq img').each((_, el) => {
    const srcSet = $(el).attr('srcset') || '';
    if (srcSet) {
      const first = srcSet.split(',')[0]?.trim().split(/\s+/)[0];
      pushImage(first);
    }
    pushImage($(el).attr('src'));
    pushImage($(el).attr('data-src'));
  });

  if (images.length === 0) {
    const decodedHtml = decodeEscapedSlashes(html);
    const embeddedImageUrls =
      decodedHtml.match(/https?:\/\/[^"'\s<>\\]*pops-comic-vn\.akamaized\.net[^"'\s<>\\]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>\\]*)?/gi) ||
      [];
    embeddedImageUrls.forEach((imgUrl) => pushImage(imgUrl));
  }

  const chapterTitle = $('h1').first().text().trim() || $('title').text().trim();
  return { images, chapterTitle };
}

async function extractChapterImagesWithBrowser(urlCandidates = []) {
  let playwright;
  try {
    playwright = require('playwright');
  } catch (error) {
    return { images: [], chapterTitle: '' };
  }

  const validCandidates = urlCandidates.filter(Boolean);
  if (!validCandidates.length) return { images: [], chapterTitle: '' };

  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    for (const candidate of validCandidates) {
      try {
        await page.goto(candidate, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(1200);

        // Trigger lazy-load images.
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let y = 0;
            const step = 1200;
            const maxSteps = 30;
            let steps = 0;
            const timer = setInterval(() => {
              window.scrollBy(0, step);
              y += step;
              steps += 1;
              if (steps >= maxSteps || y >= document.body.scrollHeight + 2000) {
                clearInterval(timer);
                resolve();
              }
            }, 120);
          });
        });
        await page.waitForTimeout(800);

        const result = await page.evaluate(() => {
          const out = [];
          const seen = new Set();
          const pushImage = (raw) => {
            if (!raw) return;
            const url = String(raw).trim().split(/\s+/)[0];
            if (!/^https?:\/\//i.test(url)) return;
            if (!/cms_comic|pops-comic-vn\.akamaized\.net/i.test(url)) return;
            if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) return;
            if (seen.has(url)) return;
            seen.add(url);
            out.push({
              pageNumber: out.length + 1,
              imageUrl: url
            });
          };

          document
            .querySelectorAll('.comics-chapter_imgWrap__l_eYq source, .comics-chapter_imgWrap__l_eYq img, img, source')
            .forEach((el) => {
              pushImage(el.getAttribute('src'));
              pushImage(el.getAttribute('data-src'));
              const srcset = el.getAttribute('srcset');
              if (srcset) {
                srcset.split(',').forEach((part) => pushImage(part));
              }
            });

          const chapterTitle =
            document.querySelector('h1')?.textContent?.trim() || document.title || '';

          return { images: out, chapterTitle };
        });

        if (result.images.length > 0) {
          await context.close();
          return result;
        }
      } catch (error) {
        // Try next candidate.
      }
    }

    await context.close();
    return { images: [], chapterTitle: '' };
  } finally {
    await browser.close();
  }
}

async function crawlChaptersByClickingComicPage(comicUrl, maxChapters = 3) {
  let playwright;
  try {
    playwright = require('playwright');
  } catch (error) {
    return [];
  }

  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    await page.goto(comicUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    // Ensure chapter cards are visible and loaded.
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let i = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, 1000);
          i += 1;
          if (i >= 8) {
            clearInterval(timer);
            resolve();
          }
        }, 120);
      });
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    const cardSelector = 'div.card-line_root__FjE3_';
    await page.waitForSelector(cardSelector, { timeout: 15000 });
    const cardCount = await page.locator(cardSelector).count();
    const limit = Math.min(Math.max(1, maxChapters), cardCount);
    const chapters = [];

    for (let i = 0; i < limit; i += 1) {
      // Refresh locator each loop to avoid stale handles after navigation.
      const card = page.locator(cardSelector).nth(i);
      const chapterTitle =
        (await card.locator('h4.card-line_title__aTque').first().textContent().catch(() => ''))?.trim() ||
        `Chapter ${i + 1}`;

      await card.click({ timeout: 20000 });
      await page.waitForTimeout(1800);

      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let step = 0;
          const timer = setInterval(() => {
            window.scrollBy(0, 1400);
            step += 1;
            if (step >= 30) {
              clearInterval(timer);
              resolve();
            }
          }, 120);
        });
      });
      await page.waitForTimeout(900);

      const chapterData = await page.evaluate(() => {
        const urls = new Set();
        const addUrl = (raw) => {
          if (!raw) return;
          const value = String(raw).trim();
          if (!value) return;
          if (!/^https?:\/\//i.test(value)) return;
          if (!/cms_comic|pops-comic-vn\.akamaized\.net/i.test(value)) return;
          if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(value)) return;
          urls.add(value.split(/\s+/)[0]);
        };

        document.querySelectorAll('img,source').forEach((el) => {
          addUrl(el.getAttribute('src'));
          addUrl(el.getAttribute('data-src'));
          const srcSet = el.getAttribute('srcset');
          if (srcSet) {
            srcSet.split(',').forEach((part) => addUrl(part));
          }
        });

        const chapterUrl = window.location.href;
        const chapterHeading = document.querySelector('h1')?.textContent?.trim() || '';
        const images = Array.from(urls).map((imageUrl, idx) => ({
          pageNumber: idx + 1,
          imageUrl
        }));

        return { chapterUrl, chapterHeading, images };
      });

      if (chapterData.images.length > 0) {
        chapters.push({
          chapterUrl: chapterData.chapterUrl,
          chapterTitle: chapterData.chapterHeading || chapterTitle,
          chapterNumber: parseChapterNumber(chapterData.chapterUrl, chapterData.chapterHeading || chapterTitle),
          pages: chapterData.images
        });
      }

      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
      await page.waitForTimeout(1200);
    }

    await context.close();
    return chapters;
  } finally {
    await browser.close();
  }
}

async function crawlChapter(chapterUrl) {
  const html = await fetchHtml(chapterUrl);
  if (/redirecting to \/400|<title>\s*400/i.test(html)) {
    const err = new Error('Chapter route returns /400');
    err.response = { status: 400 };
    throw err;
  }
  let { images, chapterTitle } = extractChapterImagesFromHtml(html);

  if (images.length === 0) {
    const chapterIdFromUrl = (chapterUrl.match(/[?&]chapterid=([a-f0-9]{24})(?:&|$)/i) || [])[1];
    const browserCandidates = [chapterUrl];
    if (chapterIdFromUrl) {
      const chapterDetailUrl = buildChapterDetailUrlFromNextData(html, chapterIdFromUrl);
      if (chapterDetailUrl) {
        browserCandidates.push(chapterDetailUrl);
        try {
          const detailHtml = await fetchHtml(chapterDetailUrl);
          if (/redirecting to \/400|<title>\s*400/i.test(detailHtml)) {
            throw new Error('Detail chapter route returns /400');
          }
          const detailParsed = extractChapterImagesFromHtml(detailHtml);
          if (detailParsed.images.length > 0) {
            images = detailParsed.images;
            chapterTitle = detailParsed.chapterTitle || chapterTitle;
          }
        } catch (detailError) {
          // Ignore and keep empty pages fallback behavior in caller.
        }
      }
    }

    if (images.length === 0) {
      const browserResult = await extractChapterImagesWithBrowser(browserCandidates);
      if (browserResult.images.length > 0) {
        images = browserResult.images;
        chapterTitle = browserResult.chapterTitle || chapterTitle;
      }
    }
  }

  const chapterNumber = parseChapterNumber(chapterUrl, chapterTitle);

  return {
    chapterUrl,
    chapterTitle,
    chapterNumber,
    pages: images
  };
}

async function saveComicAndChapters({ comicUrl, comicData, chapters }) {
  const conn = await db.promise.getConnection();
  await conn.beginTransaction();
  try {
    const [existComicRows] = await conn.query('SELECT id FROM comics WHERE source_url = ? LIMIT 1', [comicUrl]);
    const slug = slugify(comicData.title) || `comic-${Date.now()}`;
    const title = comicData.title || 'Unknown title';
    let comicId;

    if (existComicRows.length > 0) {
      comicId = existComicRows[0].id;
      await conn.query(
        `UPDATE comics
         SET title = ?, slug = ?, author = ?, description = ?, cover_image = ?,
             source_site = 'pops', source_url = ?, raw_meta = ?, crawl_status = 'synced',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          title,
          slug,
          comicData.author || comicData.metaText || null,
          comicData.description || null,
          comicData.coverImage || null,
          comicUrl,
          JSON.stringify(comicData),
          comicId
        ]
      );
    } else {
      const [insertComicResult] = await conn.query(
        `INSERT INTO comics
          (title, slug, author, description, cover_image, status, access_status, source_site, source_url, raw_meta, crawl_status)
         VALUES (?, ?, ?, ?, ?, 'ongoing', 'open', 'pops', ?, ?, 'synced')`,
        [
          title,
          slug,
          comicData.author || comicData.metaText || null,
          comicData.description || null,
          comicData.coverImage || null,
          comicUrl,
          JSON.stringify(comicData)
        ]
      );
      comicId = insertComicResult.insertId;
    }

    let upsertedChapterCount = 0;
    let upsertedPageCount = 0;
    for (const chapter of chapters) {
      const chapterNumber = chapter.chapterNumber ?? upsertedChapterCount + 1;
      const [existChapterRows] = await conn.query(
        'SELECT id FROM chapters WHERE source_url = ? LIMIT 1',
        [chapter.chapterUrl]
      );
      let chapterId;
      const imagesJson = JSON.stringify(chapter.pages.map((p) => p.imageUrl));

      if (existChapterRows.length > 0) {
        chapterId = existChapterRows[0].id;
        await conn.query(
          `UPDATE chapters
           SET comic_id = ?, chapter_number = ?, title = ?, images = ?, source_url = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [comicId, chapterNumber, chapter.chapterTitle || null, imagesJson, chapter.chapterUrl, chapterId]
        );
      } else {
        const [insertChapterResult] = await conn.query(
          `INSERT INTO chapters (comic_id, chapter_number, title, images, status, source_url)
           VALUES (?, ?, ?, ?, 'open', ?)`,
          [comicId, chapterNumber, chapter.chapterTitle || null, imagesJson, chapter.chapterUrl]
        );
        chapterId = insertChapterResult.insertId;
      }

      await conn.query('DELETE FROM chapter_pages WHERE chapter_id = ?', [chapterId]);
      if (Array.isArray(chapter.pages) && chapter.pages.length > 0) {
        for (const page of chapter.pages) {
          await conn.query(
            'INSERT INTO chapter_pages (chapter_id, page_number, image_url, source_url) VALUES (?, ?, ?, ?)',
            [chapterId, page.pageNumber, page.imageUrl, chapter.chapterUrl]
          );
        }
      }
      upsertedChapterCount += 1;
      upsertedPageCount += chapter.pages?.length || 0;
    }

    await conn.query(
      'UPDATE comics SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE comic_id = ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [comicId, comicId]
    );

    await conn.commit();
    return { comicId, upsertedChapterCount, upsertedPageCount };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function crawlComicAndSave(comicUrl, options = {}) {
  const safeComicUrl = absoluteUrl(comicUrl);
  const maxChapters = Number(options.maxChapters || 10);

  const [sourceRows] = await db.promise.query(`SELECT id FROM crawl_sources WHERE name = 'pops' LIMIT 1`);
  const sourceId = sourceRows[0]?.id || null;
  const [jobResult] = await db.promise.query(
    `INSERT INTO crawl_jobs (source_id, target_url, status, started_at)
     VALUES (?, ?, 'running', CURRENT_TIMESTAMP)`,
    [sourceId, safeComicUrl]
  );
  const jobId = jobResult.insertId;

  try {
    const comicHtml = await fetchHtml(safeComicUrl);
    const $ = cheerio.load(comicHtml);
    const comicData = extractComicMeta($, comicHtml);

    if (!comicData.title) {
      throw new Error('Không lấy được tên truyện từ trang nguồn');
    }

    // Loại trang comic detail chính ra khỏi list chapter nếu có.
    const chapterUrls = [];
    const seenChapterUrls = new Set();
    for (const rawUrl of comicData.chapterLinks) {
      const canonical = canonicalizeChapterUrl(rawUrl);
      if (!canonical || canonical === safeComicUrl || seenChapterUrls.has(canonical)) continue;
      seenChapterUrls.add(canonical);
      chapterUrls.push(canonical);
      // Gather a wider candidate pool because many chapters can be locked/invalid.
      if (chapterUrls.length >= Math.max(10, maxChapters * 8)) break;
    }

    if (chapterUrls.length === 0) {
      console.warn('[POPS_DEBUG] chapter url extraction failed', {
        sourceUrl: safeComicUrl,
        chapterLinkCount: comicData.chapterLinks.length,
        sampleLinks: comicData.chapterLinks.slice(0, 5)
      });
      throw new Error('Không tìm thấy link chương từ trang truyện. Cần thêm selector/nguồn dữ liệu chapter.');
    }
    const crawledChapters = [];
    let attemptedChapterCount = 0;
    for (const chapterUrl of chapterUrls) {
      attemptedChapterCount += 1;
      try {
        const chapterData = await crawlChapter(chapterUrl);
        if (chapterData.pages.length > 0) {
          crawledChapters.push(chapterData);
          if (crawledChapters.length >= Math.max(1, maxChapters)) break;
        }
      } catch (chapterError) {
        // Skip dead/invalid chapter links instead of failing whole crawl job.
        const is404 = chapterError?.response?.status === 404;
        if (!is404) {
          console.warn(`Skip chapter due to error: ${chapterUrl}`, chapterError?.message || chapterError);
        }
      }
      if (attemptedChapterCount >= Math.max(6, maxChapters * 4) && crawledChapters.length === 0) {
        // Avoid very long loops when source returns mostly inaccessible chapter routes.
        break;
      }
    }

    let fallbackWithoutImages = false;
    if (crawledChapters.length === 0) {
      // Partial fallback: keep chapter list even when POPS does not expose page images in HTML.
      const browserClickedChapters = await crawlChaptersByClickingComicPage(safeComicUrl, Math.max(1, maxChapters));
      if (browserClickedChapters.length > 0) {
        crawledChapters.push(...browserClickedChapters);
      } else {
        fallbackWithoutImages = true;
        const placeholderChapters = chapterUrls.slice(0, Math.max(1, maxChapters)).map((chapterUrl, idx) => ({
          chapterUrl,
          chapterTitle: `Chapter ${idx + 1}`,
          chapterNumber: parseChapterNumber(chapterUrl, '') ?? idx + 1,
          pages: []
        }));
        crawledChapters.push(...placeholderChapters);
      }
    }

    const saveResult = await saveComicAndChapters({
      comicUrl: safeComicUrl,
      comicData,
      chapters: crawledChapters
    });

    await db.promise.query(
      `UPDATE crawl_jobs
       SET status = 'success', message = ?, finished_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        fallbackWithoutImages
          ? `Crawled ${saveResult.upsertedChapterCount} chapters (không lấy được ảnh trang từ nguồn POPS)`
          : `Crawled ${saveResult.upsertedChapterCount} chapters`,
        jobId
      ]
    );

    return {
      jobId,
      ...saveResult,
      crawledChapterCount: crawledChapters.length,
      crawledSourceChapterUrls: chapterUrls.length,
      fallbackWithoutImages
    };
  } catch (error) {
    await db.promise.query(
      `UPDATE crawl_jobs
       SET status = 'failed', message = ?, finished_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [error.message, jobId]
    );
    throw error;
  }
}

module.exports = {
  crawlComicAndSave
};
