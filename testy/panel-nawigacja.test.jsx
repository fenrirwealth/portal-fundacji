import React from 'react';
import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('next/navigation', () => ({ usePathname: () => '/listy' }));
vi.mock('next/link', () => ({ default: ({children,...props}) => <a {...props}>{children}</a> }));
vi.mock('../app/akcje-sesji', () => ({ wyloguj: async()=>{} }));
import Naglowek from '../app/ui/Naglowek';
it('administrator widzi bezpośrednie wejście do zarządzania listami', () => {
  render(<Naglowek email="admin@example.invalid" administrator />);
  expect(screen.getByRole('link',{name:'Panel zarządzania'}).getAttribute('href')).toBe('/admin#zarzadzanie-listami');
});
it('darczyńca dostaje swoje listy bez odnośnika do administracji', () => {
  render(<Naglowek email="darczynca@example.invalid" />);
  expect(screen.queryByRole('link',{name:'Panel zarządzania'})).toBe(null);
  expect(screen.getByRole('link',{name:'Moje listy'})).toBeTruthy();
});
