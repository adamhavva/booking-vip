#!/usr/bin/env -S node
import type {
  Contract as End,
  Contract as Start,
} from '../../snapshots/e2f86bd78c5b9f881c6270c8c87d29c8ba2a54f552058696fc7ddf800c38cc0a/contract';
import endContract from '../../snapshots/e2f86bd78c5b9f881c6270c8c87d29c8ba2a54f552058696fc7ddf800c38cc0a/contract.json' with { type: 'json' };
import startContract from '../../snapshots/e2f86bd78c5b9f881c6270c8c87d29c8ba2a54f552058696fc7ddf800c38cc0a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, rawSql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      // Data-only backfill: every existing place keeps its kind as its level
      // (city → city, airport stays a leaf under its city, area / destination
      // too). Idempotent — rows already carrying the right level are skipped.
      rawSql({
        id: 'data.public.Airport.level.backfill',
        label: 'Backfill "level" from "kind" on "Airport"',
        operationClass: 'data',
        target: {
          id: 'postgres',
          details: {
            schema: 'public',
            objectType: 'column',
            name: 'level',
            table: 'Airport',
          },
        },
        precheck: [],
        execute: [
          {
            description: 'set level = kind for existing places',
            sql: 'UPDATE "public"."Airport" SET "level" = "kind" WHERE "level" <> "kind"',
          },
        ],
        postcheck: [],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
