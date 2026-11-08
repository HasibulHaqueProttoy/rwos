import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { metadata } from './layout';
import HomePage from './page';

describe('@rwos/web home page', () => {
  it('renders the heading', () => {
    expect(renderToStaticMarkup(<HomePage />)).toContain('<h1>Rocket Wave customer app</h1>');
  });

  it('sets the page title', () => {
    expect(metadata.title).toBe('Rocket Wave');
  });
});
