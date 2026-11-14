#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/a994be472f24e8e39383f65e3653ef9f569fff573e5397f56bd09e6e8aa29f78/contract';
import startContract from '../../snapshots/a994be472f24e8e39383f65e3653ef9f569fff573e5397f56bd09e6e8aa29f78/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e2f86bd78c5b9f881c6270c8c87d29c8ba2a54f552058696fc7ddf800c38cc0a/contract';
import endContract from '../../snapshots/e2f86bd78c5b9f881c6270c8c87d29c8ba2a54f552058696fc7ddf800c38cc0a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Airport',
        column: col('level', 'text', {
          notNull: true,
          default: lit('city'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('specs', 'jsonb', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ProductPackage',
        column: col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ProductPackage',
        column: col('fromUsdCents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ProductPackage',
        column: col('info', 'jsonb', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'Airport',
        index: 'Airport_level_idx',
        columns: ['level'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Airport',
        index: 'Airport_parentId_idx',
        columns: ['parentId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
