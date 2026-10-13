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
  const navBrand = document.createElement('p');
  navBrand.className = 'nav-brand';

  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';

  const navCompany = document.createElement('p');
  navCompany.className = 'nav-company';

  const sections = fragment.querySelector('.header.block');
  navBrand.textContent = sections.children[0].children[1].textContent;

  // 3. Extract Menu (The <ul> bullet list goes exclusively to the center)
  const ul = sections.children[1].children[1];
  navSections.append(ul);

  navCompany.textContent = sections.children[2].children[1].textContent;

  // Assemble the 3 distinct parts
  nav.append(navBrand, navSections, navCompany);
  block.append(nav);
}
