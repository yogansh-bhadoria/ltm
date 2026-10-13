import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Check if this block is set to query mode: | Cards (query) |
  const isQuery = block.classList.contains('query');

  if (isQuery) {
    // 1. Fetch query-index.json
    const response = await fetch('/query-index.json');
    if (!response.ok) return;

    const json = await response.json();
    const allPages = json.data || [];

    // 2. Filter out index page itself and take up to 10 pages
    const pagesToShow = allPages
      .filter((page) => page.path !== window.location.pathname)
      .slice(0, 10);

    // 3. Generate the Cards HTML structure
    const ul = document.createElement('ul');

    pagesToShow.forEach((page) => {
      const li = document.createElement('li');

      // Card Image (use page.image if present, otherwise clean dark placeholder)
      const imageDiv = document.createElement('div');
      imageDiv.className = 'cards-card-image';

      if (page.image && page.image.trim() !== '') {
        const picture = createOptimizedPicture(page.image, page.title || '', false, [{ width: '750' }]);
        imageDiv.append(picture);
      } else {
        // Placeholder image when no image is available
        const placeholderImg = document.createElement('img');
        placeholderImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="750" height="420" viewBox="0 0 750 420"%3E%3Crect width="100%25" height="100%25" fill="%23222"%2F%3E%3C/svg%3E';
        placeholderImg.alt = page.title || '';
        imageDiv.append(placeholderImg);
      }

      // "Case Study" badge in top-right of image
      const tagText = page.category || page.type || (page.image ? 'Case Study' : '');
      if (tagText) {
        const tag = document.createElement('span');
        tag.className = 'cards-card-tag';
        tag.textContent = tagText;
        imageDiv.append(tag);
      }

      // Card Content (Title, Description, Link)
      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'cards-card-body';
      bodyDiv.innerHTML = `
        <h3><a href="${page.path}">${page.title || ''}</a></h3>
        <p>${page.description || ''}</p>
      `;

      li.append(imageDiv, bodyDiv);
      ul.append(li);
    });

    // Replace whatever was inside the block table with our cards list
    block.textContent = '';
    block.append(ul);
    return;
  }

  // --- STANDARD BOILERPLATE BEHAVIOR (For manual cards) ---
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
