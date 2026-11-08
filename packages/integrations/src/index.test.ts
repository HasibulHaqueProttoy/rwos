import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('@rwos/integrations', () => {
  it('is wired into the workspace', () => {
    expect(packageName).toBe('@rwos/integrations');
  });
});
