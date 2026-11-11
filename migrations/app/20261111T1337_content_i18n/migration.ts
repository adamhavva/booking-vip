#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/ca99eae16c409959f72e5f99aefad4c7d5823be16e16233a6072f0f7c30eca00/contract';
import startContract from '../../snapshots/ca99eae16c409959f72e5f99aefad4c7d5823be16e16233a6072f0f7c30eca00/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/fd6754d14b7bff5b4b7e5730dc6666ee638b9af2518494a680c35d23a4cfc673/contract';
import endContract from '../../snapshots/fd6754d14b7bff5b4b7e5730dc6666ee638b9af2518494a680c35d23a4cfc673/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'SeoBlock',
        column: col('sectionsId', 'jsonb', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'SeoLink',
        column: col('service', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceLine',
        column: col('highlightsId', 'jsonb', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceLine',
        column: col('sectionsId', 'jsonb', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceLine',
        column: col('tabsId', 'jsonb', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
