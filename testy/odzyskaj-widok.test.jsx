import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import ErrorPage from '../app/error';
import GlobalError from '../app/global-error';

afterEach(cleanup);
it('błąd strony ma widoczną informację i bezpieczną drogę powrotu bez ponawiania rezerwacji', () => {
  render(<ErrorPage />);
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Odśwież stronę' }).getAttribute('type')).toBe('button');
  expect(screen.getByRole('link', { name: 'Przejdź do listów' }).getAttribute('href')).toBe('/listy');
  expect(screen.getByText(/sprawdź stan listu przed ponowną rezerwacją/)).toBeTruthy();
});
it('awaria głównego układu też zawiera czytelny ekran odzyskania strony', () => {
  const element = GlobalError();
  expect(element.type).toBe('html');
  expect(element.props.lang).toBe('pl');
  expect(element.props.children.type).toBe('body');
});
