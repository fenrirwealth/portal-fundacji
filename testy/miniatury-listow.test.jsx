import React from 'react';
import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MiniaturaListu from '../app/admin/ui/MiniaturaListu';
import { adresyZdjeciaListu } from '../lib/zdjecie-listu-admin.mjs';
it('miniatura lokalnego listu korzysta z chronionego podglądu administratora', () => {
  render(<MiniaturaListu id="abc" numer={7} imie="Test" zdjecieUrl="https://portal.fundacjalepszydomlepszejutro.pl/api/listy/abc/zdjecie" />);
  expect(screen.getByRole('link').getAttribute('href')).toBe('/api/admin/listy/abc/zdjecie');
  expect(screen.getByRole('img').getAttribute('src')).toContain('miniatura=1');
});
it('brak lub niedostępne zdjęcie ma czytelny zastępnik', () => {
  render(<MiniaturaListu id="abc" numer={7} imie="Test" zdjecieUrl="https://example.invalid/list.png" />);
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByText('Brak zdjęcia')).toBeTruthy();
});
it('nie tworzy odnośnika dla niebezpiecznego protokołu', () => {
  expect(adresyZdjeciaListu('abc','javascript:alert(1)')).toBe(null);
  expect(adresyZdjeciaListu('abc',null)).toBe(null);
});
