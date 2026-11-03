import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig, prisma7Schema } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: prisma7Schema("prisma/schema.prisma"),
    output: "src/prisma",
    db: {
      // CLI-side connection (migrations/verify) uses the session-mode pooler,
      // mirroring the Prisma 6 DIRECT_URL pattern. The app runtime client in
      // src/prisma/db.ts keeps using DATABASE_URL (transaction-mode pooler).
      connection: process.env['DIRECT_URL']!,
    },
  }),
});
