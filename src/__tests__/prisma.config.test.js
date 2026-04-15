import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Track constructor calls for assertions
let prismaPgCalls = [];
let prismaClientCalls = [];
let prismaPgInstances = [];
let prismaClientInstances = [];

vi.mock('@prisma/adapter-pg', () => {
  class MockPrismaPg {
    constructor(options) {
      prismaPgCalls.push(options);
      prismaPgInstances.push(this);
      this.options = options;
      this._type = 'MockPrismaPg';
    }
  }
  return { PrismaPg: MockPrismaPg };
});

vi.mock('../generated/prisma/client', () => {
  class MockPrismaClient {
    constructor(options) {
      prismaClientCalls.push(options);
      prismaClientInstances.push(this);
      this.options = options;
      this._type = 'MockPrismaClient';
    }
  }
  return { PrismaClient: MockPrismaClient };
});

vi.mock('dotenv/config', () => ({}));

describe('src/config/prisma.js', () => {
  let originalDatabaseUrl;

  beforeEach(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    prismaPgCalls = [];
    prismaClientCalls = [];
    prismaPgInstances = [];
    prismaClientInstances = [];
    vi.resetModules();
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it('creates PrismaPg adapter with DATABASE_URL connection string', async () => {
    const testUrl = 'postgres://user:pass@localhost:5432/testdb';
    process.env.DATABASE_URL = testUrl;

    await import('../config/prisma.js');

    expect(prismaPgCalls).toHaveLength(1);
    expect(prismaPgCalls[0]).toEqual({ connectionString: testUrl });
  });

  it('creates PrismaClient with the PrismaPg adapter instance', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';

    await import('../config/prisma.js');

    expect(prismaClientCalls).toHaveLength(1);
    expect(prismaClientCalls[0].adapter).toBe(prismaPgInstances[0]);
  });

  it('exports the prisma client instance', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';

    const module = await import('../config/prisma.js');

    expect(module.prisma).toBe(prismaClientInstances[0]);
    expect(module.prisma._type).toBe('MockPrismaClient');
  });

  it('uses DATABASE_URL as a string via template literal interpolation', async () => {
    const testUrl = 'postgres://admin:secret@db.example.com:5432/sportz';
    process.env.DATABASE_URL = testUrl;

    await import('../config/prisma.js');

    const connectionString = prismaPgCalls[0].connectionString;
    expect(connectionString).toBe(testUrl);
    expect(typeof connectionString).toBe('string');
  });

  it('passes the adapter instance (not the class) to PrismaClient', async () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/db';

    await import('../config/prisma.js');

    const { PrismaPg } = await import('@prisma/adapter-pg');
    const adapterArg = prismaClientCalls[0].adapter;

    // The adapter passed to PrismaClient should be an instance of PrismaPg,
    // not the class itself
    expect(adapterArg).toBeInstanceOf(PrismaPg);
    expect(adapterArg).not.toBe(PrismaPg);
  });

  it('creates exactly one adapter and one client instance', async () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/db';

    await import('../config/prisma.js');

    expect(prismaPgCalls).toHaveLength(1);
    expect(prismaClientCalls).toHaveLength(1);
    expect(prismaPgInstances).toHaveLength(1);
    expect(prismaClientInstances).toHaveLength(1);
  });

  it('uses DATABASE_URL from environment when it is a standard postgres URL', async () => {
    const testUrl = 'postgres://postgres:postgres@db:5432/sportz';
    process.env.DATABASE_URL = testUrl;

    await import('../config/prisma.js');

    expect(prismaPgCalls[0].connectionString).toBe(testUrl);
  });
});