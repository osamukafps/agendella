import { describe, it, expect } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('should create the root component', () => {
    const app = new App();
    expect(app).toBeTruthy();
  });
});
