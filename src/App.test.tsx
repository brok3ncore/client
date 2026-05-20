import { act, render, screen } from '@testing-library/react';
import App from './App';

test('shows captcha gate for music school CRM', async () => {
  window.sessionStorage.clear();

  await act(async () => {
    render(<App />);
  });

  expect(screen.getByText(/Музыкальная школа/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Пройти учебную капчу/i })).toBeInTheDocument();

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
});
