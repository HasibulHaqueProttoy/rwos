import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@rwos/db', () => {
  it('is wired into the workspace', () => {
    expect(packageName).toBe('@rwos/db');
  });
});
