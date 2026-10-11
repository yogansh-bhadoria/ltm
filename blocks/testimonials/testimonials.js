export default function decorate(block) {
  const rows = [...block.children];
  const testimonialList = document.createElement('div');

  testimonialList.className = 'testimonial-list';

  rows.forEach((row) => {
    const cells = [...row.children];

    if (!cells.length) return;

    const quoteCell = cells[0];
    const authorCell = cells[1];

    const quoteText = quoteCell.textContent.trim();
    const authorText = authorCell?.textContent.trim();

    if (!quoteText) return;

    const item = document.createElement('article');
    item.className = 'testimonial-item';

    const quote = document.createElement('blockquote');
    quote.className = 'testimonial-quote';

    while (quoteCell.firstChild) {
      quote.append(quoteCell.firstChild);
    }

    item.append(quote);

    if (authorText) {
      const attribution = document.createElement('div');
      attribution.className = 'testimonial-attribution';

      while (authorCell.firstChild) {
        attribution.append(authorCell.firstChild);
      }

      item.append(attribution);
    }

    testimonialList.append(item);
  });

  block.replaceChildren(testimonialList);
}
