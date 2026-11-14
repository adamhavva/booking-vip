#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/61a63442ed422021f8abb61982e8ecd591a7ed97e53a012d0e9a85966a82267d/contract';
import endContract from '../../snapshots/61a63442ed422021f8abb61982e8ecd591a7ed97e53a012d0e9a85966a82267d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e2f86bd78c5b9f881c6270c8c87d29c8ba2a54f552058696fc7ddf800c38cc0a/contract';
import startContract from '../../snapshots/e2f86bd78c5b9f881c6270c8c87d29c8ba2a54f552058696fc7ddf800c38cc0a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Airport',
        column: col('cityId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Airport',
        column: col('nameId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('descriptionId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('durationLabelId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('includedId', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('notIncludedId', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('requirementsId', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('ribbonId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('titleId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ProductPackage',
        column: col('descriptionId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ProductPackage',
        column: col('labelId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceType',
        column: col('nameId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
