'use strict';

const {
  normalizeTitle,
  validateTicketInput,
  canChangeStatus,
  filterAndSort
} = require('../../src/core');

const validTicket = {
  title: 'Сбой принтера',
  description: 'Принтер не печатает документы',
  category: 'hardware',
  priority: 'medium'
};

describe('Unit-тесты HelpDesk', () => {
  test('U-01 нормализует тему и проверяет валидацию описания, категории и приоритета', () => {
    expect(normalizeTitle('  Сбой  \t\n принтера   ')).toBe('Сбой принтера');
    expect(validateTicketInput({ ...validTicket, description: `  ${'A'.repeat(10)}  ` }))
      .not.toHaveProperty('description');
    expect(validateTicketInput({ ...validTicket, description: 'A'.repeat(9) }))
      .toHaveProperty('description');
    expect(validateTicketInput({ ...validTicket, description: 'A'.repeat(501) }))
      .toHaveProperty('description');
    const invalid = validateTicketInput({ ...validTicket, category: 'printer', priority: 'urgent' });
    expect(invalid).toHaveProperty('category');
    expect(invalid).toHaveProperty('priority');
  });

  test.each([
    ['ABCD', false],
    ['ABCDE', true],
    ['A'.repeat(80), true]
  ])('U-02 проверяет нижнюю и верхнюю границы длины темы: %s', (title, valid) => {
    const errors = validateTicketInput({ ...validTicket, title });
    expect(errors.title === undefined).toBe(valid);
  });

  test('U-03 запрещает пропуск этапа и обратные переходы статусов', () => {
    expect(canChangeStatus('new', 'in_progress')).toBe(true);
    expect(canChangeStatus('in_progress', 'resolved')).toBe(true);
    expect(canChangeStatus('new', 'resolved')).toBe(false);
    expect(canChangeStatus('resolved', 'new')).toBe(false);
  });

  test('U-04 сортирует сначала по приоритету, затем по дате внутри приоритета', () => {
    const tickets = [
      { id: 1, priority: 'high', createdAt: '2026-10-01T09:00:00.000Z' },
      { id: 2, priority: 'low', createdAt: '2026-10-05T09:00:00.000Z' },
      { id: 3, priority: 'high', createdAt: '2026-10-03T09:00:00.000Z' },
      { id: 4, priority: 'medium', createdAt: '2026-10-04T09:00:00.000Z' }
    ];
    expect(filterAndSort(tickets).map((ticket) => ticket.id)).toEqual([3, 1, 4, 2]);
  });

});
