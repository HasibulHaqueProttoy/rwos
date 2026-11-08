import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@rwos/auth', () => {
  it('is wired into the workspace', () => {
    expect(packageName).toBe('@rwos/auth');
  });
});
