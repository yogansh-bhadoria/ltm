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

  const navCompany = document.createElement('div');
  navCompany.className = 'nav-tools';

  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown';
  dropdown.style.display = 'none';

  navBrand.textContent = sections.children[0].children[1].textContent.trim();

  // 3. Extract Menu (The <ul> bullet list goes exclusively to the center)
  const ul = sections.children[1].children[1];
  navSections.append(ul);

  if (sections.children[2] && sections.children[2].children[1]) {
    Array.from(sections.children[2].children[1].children).forEach((child) => {
      navCompany.append(child);
    });
  }

  // Assemble the distinct parts into nav (dropdown stays inside nav for proper alignment)
  nav.append(navBrand, navSections, navCompany, dropdown);
  navSections.addEventListener('mouseover', (e) => {
    dropdown.innerHTML = '';
    const megaMenus = doc.querySelectorAll('.mega-menu');
    megaMenus.forEach((menu) => {
      if (menu.children[0].children[1].textContent.trim() === e.target.textContent.trim()) {
        Array.from(menu.children).forEach((row, index) => {
          if (index === 0) return;

          const cells = row.children.length > 0 ? Array.from(row.children) : [row];
          cells.forEach((cell) => {
            dropdown.append(cell.cloneNode(true));
          });
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
