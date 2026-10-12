import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';

  // 1. Create the 3 guaranteed containers
  const navBrand = document.createElement('div');
  navBrand.className = 'nav-brand';

  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';

  const navTools = document.createElement('div');
  navTools.className = 'nav-tools';

  // 2. Extract Brand (First image/picture or first paragraph)
  const firstPicture = fragment.querySelector('picture');
  const firstP = fragment.querySelector('p');
  if (firstPicture) {
    navBrand.append(firstPicture.closest('p') || firstPicture);
  } else if (firstP) {
    navBrand.append(firstP);
  }

  // 3. Extract Menu (The <ul> bullet list goes exclusively to the center)
  const ul = fragment.querySelector('ul');
  if (ul) {
    navSections.append(ul);
  }

  // 4. Extract Tools (Company info and buttons go strictly to the right)
  const allParagraphs = fragment.querySelectorAll('p');
  allParagraphs.forEach((p) => {
    if (!navBrand.contains(p) && !navSections.contains(p)) {
      navTools.append(p);
    }
  });

  // Assemble the 3 distinct parts
  nav.append(navBrand, navSections, navTools);
  block.append(nav);
}
