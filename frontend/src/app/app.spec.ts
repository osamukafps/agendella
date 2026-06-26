import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('should create the app', () => {
    const app = new App();
    expect(app).toBeTruthy();
  });

  it('should expose the bootstrap title signal', () => {
    const app = new App() as App & { title: () => string };
    expect(app.title()).toBe('Agendella');
  });
});
