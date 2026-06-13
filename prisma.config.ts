import 'dotenv/config';
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/bookzydb?schema=public",
  },
  migrations: {
    seed: 'ts-node ./prisma/seed.ts',
  },
});
