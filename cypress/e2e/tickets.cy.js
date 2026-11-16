import { TicketsPage } from '../pages/TicketsPage';
import { TicketForm } from '../pages/TicketForm';

const page = new TicketsPage();
const form = new TicketForm();

describe('E2E HelpDesk с Page Object Model (ровно 3 сценария)', () => {
  beforeEach(() => {
    // Перед каждым сценарием возвращается независимое исходное состояние.
    cy.request('POST', '/api/__reset');
  });

  it('E-01 создаёт заявку и отображает пользовательскую HTML-разметку как текст', () => {
    const title = '<b>Проверка HTML</b>';
    page.open();

    form.fill({
      title,
      description: 'Проверка безопасного отображения пользовательского текста',
      category: 'software',
      priority: 'medium'
    });
    form.submit();

    form.message().should('contain', 'создана');
    page.items().should('have.length', 5);
    page.items().filter('[data-id="5"]').find('.ticket-title').should('have.text', title);
    page.items().filter('[data-id="5"]').find('b').should('not.exist');
  });

  it('E-02 выполняет поиск и совместную фильтрацию по статусу и категории', () => {
    page.open();
    page.searchFor('VPN');
    page.setStatus('new');
    page.setCategory('network');

    page.items().should('have.length', 1);
    page.items().first().should('contain.text', 'VPN недоступен');
    page.count().should('have.text', '1');
  });

  it('E-03 переводит заявку в работу и завершает её через интерфейс', () => {
    page.open();

    page.items().filter('[data-id="1"]')
      .find('button').should('contain.text', 'В работу').click();
    page.items().filter('[data-id="1"]').should('contain.text', 'В работе');

    page.items().filter('[data-id="1"]')
      .find('button').should('contain.text', 'Завершить').click();
    page.items().filter('[data-id="1"]').should('contain.text', 'Завершена');
    page.items().filter('[data-id="1"]').find('button').should('not.exist');
  });
});
