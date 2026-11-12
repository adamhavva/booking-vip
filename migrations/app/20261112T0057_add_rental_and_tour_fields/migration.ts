#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/8706403bb7234171e8ac51922048d445136daedfc7e9c0ce9838cf7c521efbb8/contract';
import startContract from '../../snapshots/8706403bb7234171e8ac51922048d445136daedfc7e9c0ce9838cf7c521efbb8/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a994be472f24e8e39383f65e3653ef9f569fff573e5397f56bd09e6e8aa29f78/contract';
import endContract from '../../snapshots/a994be472f24e8e39383f65e3653ef9f569fff573e5397f56bd09e6e8aa29f78/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('driverOption', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Booking',
        column: col('pickupPolicy', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'BookingItem',
        column: col('quantity', 'int4', {
          notNull: true,
          default: lit(1),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Contact',
        column: col('title', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('destinationId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('driverOption', 'text', {
          notNull: true,
          default: lit('with_driver'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('itinerary', 'jsonb', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('pickupPolicy', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('seats', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('transmission', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('vendor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.setDefault({
        schema: 'public',
        table: 'BookingItem',
        column: col('adultCount', 'int4', { default: lit(0), codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.setDefault({
        schema: 'public',
        table: 'BookingItem',
        column: col('childCount', 'int4', { default: lit(0), codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.setDefault({
        schema: 'public',
        table: 'BookingItem',
        column: col('infantCount', 'int4', { default: lit(0), codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Product',
        foreignKey: {
          name: 'Product_destinationId_fkey',
          columns: ['destinationId'],
          references: { schema: 'public', table: 'Airport', columns: ['id'] },
          onDelete: 'setNull',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
