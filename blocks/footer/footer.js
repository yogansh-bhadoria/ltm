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
  const linksBlock = fragment.querySelector('.links');
  const lists = linksBlock.querySelectorAll('ul');
  const heading = fragment.querySelector('.default-content-wrapper');
  heading.classList.add('footer-heading');
  linksBlock.classList.add('footer-links');
  lists.forEach((list) => {
    list.classList.add('footer-link-column');
  });

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
