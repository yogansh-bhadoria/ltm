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

  // 1. Brand Logo (Pure text styled link)
  const navBrand = document.createElement('div');
  navBrand.className = 'nav-brand';
  const brandLink = document.createElement('a');
  brandLink.href = '/';
  brandLink.textContent = sections.children[0].children[1].textContent.trim() || 'LTM';
  navBrand.append(brandLink);

  // 2. Center Menu
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  const ul = sections.children[1].children[1];
  navSections.append(ul);

  // 3. Right Tools (Company text + Contact button)
  const navTools = document.createElement('div');
  navTools.className = 'nav-tools';
  if (sections.children[2] && sections.children[2].children[1]) {
    navTools.innerHTML = sections.children[2].children[1].innerHTML;
  }
  if (!navTools.querySelector('a')) {
    const contactBtn = document.createElement('a');
    contactBtn.href = '/contact';
    contactBtn.textContent = 'Contact';
    navTools.append(contactBtn);
  }

  // 4. Dropdown Container
  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown';
  dropdown.style.display = 'none';

  // Assemble into nav
  nav.append(navBrand, navSections, navTools, dropdown);

  navSections.addEventListener('mouseover', (e) => {
    dropdown.innerHTML = '';
    const megaMenus = doc.querySelectorAll('.mega-menu');
    megaMenus.forEach((menu) => {
      if (menu.children[0].children[1].textContent.trim() === e.target.textContent.trim()) {
        Array.from(menu.children).forEach((row, index) => {
          if (index === 0) return;

          dropdown.append(row.cloneNode(true));
        });
        dropdown.style.display = dropdown.children.length > 0 ? 'flex' : 'none';
      }
    });
  });

  nav.addEventListener('mouseleave', () => {
    dropdown.style.display = 'none';
  });

  block.append(nav);
}
