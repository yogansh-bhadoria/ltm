import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  const heading = fragment.querySelector('.default-content-wrapper');
  if (heading) {
    heading.classList.add('footer-heading');
  }

  const linksBlock = fragment.querySelector('.links');
  if (linksBlock) {
    linksBlock.classList.add('footer-links');
    const lists = linksBlock.querySelectorAll('ul');
    const grid = document.createElement('div');
    grid.className = 'footer-links-grid';

    lists.forEach((list) => {
      list.classList.add('footer-link-column');
      grid.append(list);
    });

    linksBlock.textContent = '';
    linksBlock.append(grid);
  }

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) {
    footer.append(fragment.firstElementChild);
  }

  block.append(footer);
}
