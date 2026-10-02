const required = ['DATABASE_URL'] as const;

export function getEnv() {
  for (const key of required) {
    if (!process.env[key]) throw new Error(`${key} is not configured`);
  }
  try {
    const url = new URL(process.env.DATABASE_URL!);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('unsupported database');
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
  }
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_API_KEY) {
    throw new Error('ADMIN_API_KEY is required in production');
  }
  return { databaseUrl: process.env.DATABASE_URL!, adminApiKey: process.env.ADMIN_API_KEY };
}
