'use strict';
const { createApp } = require('../../src/app');

let server;
let base;

const seedTickets = [
  { id: 1, title: 'VPN недоступен', description: 'Не удается подключиться к учебной сети', category: 'network', priority: 'high', status: 'new', createdAt: '2026-10-01T09:00:00.000Z' },
  { id: 2, title: 'Ошибка в офисном пакете', description: 'При сохранении файла появляется ошибка', category: 'software', priority: 'medium', status: 'in_progress', createdAt: '2026-10-02T12:00:00.000Z' },
  { id: 3, title: 'Мышь не работает', description: 'Не реагирует кнопка мыши в кабинете', category: 'hardware', priority: 'low', status: 'new', createdAt: '2026-10-03T11:00:00.000Z' },
  { id: 4, title: 'Wi-Fi на этаже', description: 'Нет доступа к сети на третьем этаже', category: 'network', priority: 'high', status: 'resolved', createdAt: '2026-10-04T15:00:00.000Z' }
];

async function getTickets(query = '') {
  return fetch(`${base}/api/tickets${query}`);
}

async function postTicket(payload) {
  return fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

async function patchStatus(id, status) {
  return fetch(`${base}/api/tickets/${id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status })
  });
}

beforeEach(async () => {
  server = createApp({ seed: seedTickets });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Integration-тесты API HelpDesk', () => {
  test('I-01 POST создаёт заявку, нормализует данные, а GET возвращает её', async () => {
    const response = await postTicket({
      title: '  Сбой   принтера  ',
      description: '  Принтер в аудитории не отвечает  ',
      category: 'hardware',
      priority: 'high'
    });
    const created = await response.json();

    expect(response.status).toBe(201);
    expect(created.ticket).toEqual(expect.objectContaining({
      id: 5,
      title: 'Сбой принтера',
      description: 'Принтер в аудитории не отвечает',
      status: 'new'
    }));

    const readResponse = await getTickets('?search=Сбой%20принтера');
    const readBody = await readResponse.json();
    expect(readResponse.status).toBe(200);
    expect(readBody.total).toBe(1);
    expect(readBody.items[0]).toMatchObject(created.ticket);
  });

  test('I-02 некорректная заявка возвращает 400 и не меняет количество записей', async () => {
    const before = await (await getTickets()).json();
    const response = await postTicket({
      title: 'Крат',
      description: 'Описание корректной длины',
      category: 'hardware',
      priority: 'medium'
    });
    const body = await response.json();
    const after = await (await getTickets()).json();

    expect(response.status).toBe(400);
    expect(body.errors).toHaveProperty('title');
    expect(after.total).toBe(before.total);
  });

  test('I-03 GET применяет поиск, статус и категорию одновременно по AND', async () => {
    const response = await getTickets('?search=%20VPN%20&status=new&category=network');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe(1);
  });

  test('I-04 PATCH отклоняет переход new → resolved и сохраняет исходный статус', async () => {
    const response = await patchStatus(1, 'resolved');
    const body = await response.json();
    const current = await (await getTickets('?status=new')).json();

    expect(response.status).toBe(409);
    expect(body).toHaveProperty('error');
    expect(current.items.find((ticket) => ticket.id === 1).status).toBe('new');
  });

  test('I-05 GET возвращает заявки по приоритету и дате внутри приоритета', async () => {
    const response = await getTickets();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('items');
    expect(body.total).toBe(4);
    expect(body.items.map((ticket) => ticket.id)).toEqual([4, 1, 2, 3]);
  });
});
