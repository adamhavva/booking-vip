#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/058770ede8b61f917f79f326c21e520beed1918a178443773d4ad9dbe006291f/contract';
import startContract from '../../snapshots/058770ede8b61f917f79f326c21e520beed1918a178443773d4ad9dbe006291f/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c126069b4daa98e6cc4ba6c3a8a249672ea57d8742f08fff0512ea631e0ef2bb/contract';
import endContract from '../../snapshots/c126069b4daa98e6cc4ba6c3a8a249672ea57d8742f08fff0512ea631e0ef2bb/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('dropoffLabel', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('dropoffLat', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('dropoffLng', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('pickupLabel', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('pickupLat', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('pickupLng', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
