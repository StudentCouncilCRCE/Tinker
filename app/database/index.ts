import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { appEnv } from '~/lib/env.server';

export const postgresDB = drizzle(appEnv.POSTGRES_URL);
