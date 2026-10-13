import { getMetadata } from '../../scripts/aem.js';

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';

  const response = await fetch(`${navPath}.plain.html`);
  if (!response.ok) return;  
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const sections = doc.querySelector('.header');

  const nav = document.createElement('nav');
  nav.id = 'nav';

  // 1. Create the 3 guaranteed containers
  const navBrand = document.createElement('p');
  navBrand.className = 'nav-brand';

  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';

  const navCompany = document.createElement('p');
  navCompany.className = 'nav-company';
  navBrand.textContent = sections.children[0].children[1].textContent.trim();

  // 3. Extract Menu (The <ul> bullet list goes exclusively to the center)
  const ul = sections.children[1].children[1];
  navSections.append(ul);

  navCompany.textContent = sections.children[2].children[1].textContent.trim();

  // Assemble the 3 distinct parts
  nav.append(navBrand, navSections, navCompany);
  block.append(nav);
}
