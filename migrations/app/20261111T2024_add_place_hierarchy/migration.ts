#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/be6a383c1f98b0c03819fddce1614736301c29225a14dcbef8f026ea0c6de197/contract';
import startContract from '../../snapshots/be6a383c1f98b0c03819fddce1614736301c29225a14dcbef8f026ea0c6de197/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/fc159a72fe4bd77736ae5628abd5225f4a991590534c03b2c02ca6af7cd4d7ba/contract';
import endContract from '../../snapshots/fc159a72fe4bd77736ae5628abd5225f4a991590534c03b2c02ca6af7cd4d7ba/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Airport',
        column: col('parentId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Airport',
        column: col('sortOrder', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Airport',
        foreignKey: {
          name: 'Airport_parentId_fkey',
          columns: ['parentId'],
          references: { schema: 'public', table: 'Airport', columns: ['id'] },
          onDelete: 'setNull',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
