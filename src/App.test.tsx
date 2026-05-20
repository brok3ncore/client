import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

test('renders music school captcha gate', async () => {
  render(<App />);
  expect(screen.getByText(/CRM для музыкальной школы/i)).toBeInTheDocument();
  expect(await screen.findByText(/Демо-режим/i)).toBeInTheDocument();
});

test('supports core CRM flow: student, subscription and completed lesson', async () => {
  render(<App />);

  await userEvent.click(screen.getByRole('button', { name: /Войти в демо-панель/i }));
  expect(await screen.findByText(/Панель управления музыкальной школой/i)).toBeInTheDocument();
  expect(await screen.findByText(/Демо-хранение/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Ученики' }));
  await userEvent.type(screen.getByLabelText('ФИО'), 'Никита Соколов');
  await userEvent.type(screen.getByLabelText('Возраст'), '11');
  await userEvent.selectOptions(screen.getByLabelText('Инструмент'), 'Скрипка');
  await userEvent.type(screen.getByLabelText('Телефон'), '+7 900 111-22-33');
  await userEvent.type(screen.getByLabelText('Родитель / контакт'), 'Ольга Соколова');
  await userEvent.click(screen.getByRole('button', { name: /Добавить ученика/i }));
  expect(screen.getByText('Никита Соколов')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Абонементы' }));
  await userEvent.selectOptions(screen.getByLabelText('Ученик'), screen.getByRole('option', { name: 'Никита Соколов' }));
  await userEvent.selectOptions(screen.getByLabelText('Тариф'), screen.getByRole('option', { name: /Классика/i }));
  await userEvent.click(screen.getByRole('button', { name: /Выдать абонемент/i }));
  expect(screen.getAllByText('Никита Соколов').length).toBeGreaterThan(0);

  await userEvent.click(screen.getByRole('button', { name: 'Занятия' }));
  await userEvent.selectOptions(screen.getByLabelText('Ученик'), screen.getByRole('option', { name: 'Никита Соколов' }));
  await userEvent.type(screen.getByLabelText('Дата'), '2026-06-01');
  await userEvent.type(screen.getByLabelText('Время'), '15:30');
  await userEvent.type(screen.getByLabelText('Преподаватель'), 'Мария Андреевна');
  await userEvent.type(screen.getByLabelText('Тема'), 'Первый разбор пьесы');
  await userEvent.click(screen.getByRole('button', { name: /Добавить занятие/i }));
  expect(screen.getByText(/Первый разбор пьесы/i)).toBeInTheDocument();
  await userEvent.click(screen.getAllByRole('button', { name: /Проведено/i })[0]);
  expect(screen.getAllByText('Проведено').length).toBeGreaterThan(0);
});
