import { describe, expect, it } from 'vitest';
import { InvalidEnvError, parseDatabaseEnv, parseServerEnv } from './env';

const validEnv = {
  NODE_ENV: 'development',
  APP_URL: 'http://localhost:3000',
  ADMIN_URL: 'http://localhost:3001',
  DATABASE_URL: 'postgres://rwos:local@localhost:5433/rwos',
  REDIS_URL: 'redis://localhost:6379',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'rwos-local',
  S3_ACCESS_KEY_ID: 'local-key',
  S3_SECRET_ACCESS_KEY: 'local-secret-value',
  S3_FORCE_PATH_STYLE: 'true',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  SMTP_FROM: 'no-reply@rocketwave.local',
};

describe('parseServerEnv', () => {
  it('parses a complete environment and converts types', () => {
    const env = parseServerEnv(validEnv);
    expect(env.SMTP_PORT).toBe(1025);
    expect(env.S3_FORCE_PATH_STYLE).toBe(true);
  });

  it('defaults NODE_ENV to development', () => {
    const { NODE_ENV: _omit, ...rest } = validEnv;
    expect(parseServerEnv(rest).NODE_ENV).toBe('development');
  });

  it('rejects a database URL that is not Postgres', () => {
    expect(() => parseServerEnv({ ...validEnv, DATABASE_URL: 'mysql://localhost/rwos' })).toThrow(
      InvalidEnvError,
    );
  });

  it('lists every missing variable by name', () => {
    const { REDIS_URL: _a, SMTP_FROM: _b, ...rest } = validEnv;
    try {
      parseServerEnv(rest);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidEnvError);
      expect((error as InvalidEnvError).variableNames).toEqual(['REDIS_URL', 'SMTP_FROM']);
    }
  });

  it('never puts values in the error message', () => {
    const badEnv = { ...validEnv, S3_SECRET_ACCESS_KEY: '', SMTP_PORT: 'not-a-port' };
    expect(() => parseServerEnv(badEnv)).toThrow(/SMTP_PORT/);
    try {
      parseServerEnv(badEnv);
    } catch (error) {
      expect((error as Error).message).not.toContain('not-a-port');
      expect((error as Error).message).not.toContain('local-secret-value');
    }
  });
});

describe('parseDatabaseEnv', () => {
  it('needs only DATABASE_URL', () => {
    const env = parseDatabaseEnv({ DATABASE_URL: validEnv.DATABASE_URL });
    expect(env).toEqual({ NODE_ENV: 'development', DATABASE_URL: validEnv.DATABASE_URL });
  });

  it('rejects a missing DATABASE_URL by name', () => {
    expect(() => parseDatabaseEnv({})).toThrow(/DATABASE_URL/);
  });
});
