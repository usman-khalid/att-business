/**
 * media-list block
 *
 * A vertical list of items, each consisting of an icon, a heading, a short
 * description, and an optional link, paired with a media panel that shows the
 * picture for the currently-hovered item. Inspired by the "Story Stack"
 * pattern (see business.att.com).
 *
 * Authoring (DA): each row of the block is one item; each row has a single
 * cell containing the icon (via `:icon-name:` syntax), an image, a heading,
 * a description, and an optional CTA link. Example:
 *
 *   | media-list                                                |
 *   |-----------------------------------------------------------|
 *   | :smallbusiness:                                           |
 *   | ![Small business](/path/to/img.jpg)                       |
 *   | ### Small business                                        |
 *   | Check out how your business can dream big and reach its … |
 *   | [Learn more](https://…)                                   |
 *   |-----------------------------------------------------------|
 *   | :firstnet:                                                |
 *   | …                                                         |
 *
 * Behaviour:
 *   - Pointer hover (or keyboard focus) on an item swaps the media panel.
 *   - Each item is wrapped in an <a> when a CTA link is present, so the whole
 *     row is clickable. On touch, the first tap swaps the media (via the
 *     synthesized hover) and the second tap follows the link.
 */

function extractEl(cell, selector) {
  const el = cell.querySelector(selector);
  if (!el) return null;
  const host = el.parentElement;
  el.remove();
  // Clean up the wrapper if it's now empty (typically a stray <p>).
  if (host && host !== cell && !host.textContent.trim() && !host.querySelector('*')) {
    host.remove();
  }
  return el;
}

function buildItem(row, idx) {
  const cell = row.firstElementChild || row;

  // Pull out the special pieces. Order matters: extract the picture before the
  // link, since the link may be inside a <p> that also wraps text we want to
  // keep visible in the body.
  const icon = extractEl(cell, 'span.icon');
  const picture = extractEl(cell, 'picture');

  // The CTA link is whatever the author marked as a button/link paragraph
  // ("Learn more"). We strip its host paragraph entirely so the visible body
  // doesn't duplicate the CTA text — the whole item becomes the link.
  const ctaLink = cell.querySelector('p > a, p > strong > a');
  const ctaHost = ctaLink?.closest('p');
  ctaHost?.remove();

  // Whatever's left (heading + description paragraphs) becomes the body.
  const body = document.createElement('div');
  body.className = 'media-list-body';
  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('media-list-title');
  while (cell.firstChild) body.append(cell.firstChild);

  // Media slot for the desktop panel (only the active slot is visible).
  const mediaSlot = document.createElement('figure');
  mediaSlot.className = 'media-list-media-item';
  if (idx === 0) mediaSlot.classList.add('is-active');
  if (picture) mediaSlot.append(picture);

  // Mobile/tablet: each item shows its own picture inline as a card. We clone
  // here so the desktop panel and the in-card image stay in sync without
  // having to move DOM around on resize.
  const cardMedia = document.createElement('figure');
  cardMedia.className = 'media-list-item-media';
  if (picture) cardMedia.append(picture.cloneNode(true));

  // Icon wrapper (rendered inside a soft circle via CSS).
  const iconWrap = document.createElement('span');
  iconWrap.className = 'media-list-icon';
  iconWrap.setAttribute('aria-hidden', 'true');
  if (icon) iconWrap.append(icon);

  // Arrow indicator on the right edge.
  const arrow = document.createElement('span');
  arrow.className = 'media-list-arrow';
  arrow.setAttribute('aria-hidden', 'true');

  // Inner element — anchor if we have a link, otherwise a plain div.
  const inner = document.createElement(ctaLink ? 'a' : 'div');
  inner.className = 'media-list-item-inner';
  if (ctaLink) {
    inner.href = ctaLink.getAttribute('href') || '#';
    if (ctaLink.target) inner.target = ctaLink.target;
    if (ctaLink.rel) inner.rel = ctaLink.rel;
    const labelText = heading?.textContent?.trim();
    if (labelText) inner.setAttribute('aria-label', labelText);
  } else {
    // Make the div focusable so keyboard users can also trigger the swap.
    inner.tabIndex = 0;
  }
  inner.append(cardMedia, iconWrap, body, arrow);

  const li = document.createElement('li');
  li.className = 'media-list-item';
  if (idx === 0) li.classList.add('is-active');
  li.append(inner);

  return { li, mediaSlot };
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const mediaPanel = document.createElement('div');
  mediaPanel.className = 'media-list-media';

  const list = document.createElement('ul');
  list.className = 'media-list-items';

  const items = rows.map((row, idx) => buildItem(row, idx));
  items.forEach(({ li, mediaSlot }) => {
    mediaPanel.append(mediaSlot);
    list.append(li);
  });

  // Hover/focus to swap the displayed media. We toggle classes rather than
  // re-rendering so CSS can drive a cross-fade transition.
  const setActive = (idx) => {
    items.forEach(({ li, mediaSlot }, i) => {
      const active = i === idx;
      li.classList.toggle('is-active', active);
      mediaSlot.classList.toggle('is-active', active);
    });
  };

  items.forEach(({ li }, i) => {
    const inner = li.firstElementChild;
    inner.addEventListener('mouseenter', () => setActive(i));
    inner.addEventListener('focus', () => setActive(i));
  });

  block.replaceChildren(mediaPanel, list);
}
