import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders URL Shortener app', () => {
  render(<App />);
  const linkElement = screen.getByText(/URL Shortener/i);
  expect(linkElement).toBeInTheDocument();
});