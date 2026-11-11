#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2c03717c25233ca2add59a151b9f0d334d2a432e5e68c2931cf3919d644fd9c8/contract';
import endContract from '../../snapshots/2c03717c25233ca2add59a151b9f0d334d2a432e5e68c2931cf3919d644fd9c8/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fd6754d14b7bff5b4b7e5730dc6666ee638b9af2518494a680c35d23a4cfc673/contract';
import startContract from '../../snapshots/fd6754d14b7bff5b4b7e5730dc6666ee638b9af2518494a680c35d23a4cfc673/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Media',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('alt', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('credit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('height', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ownerId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ownerType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('width', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Media',
        index: 'Media_key_idx',
        columns: ['key'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Media',
        index: 'Media_ownerType_ownerId_idx',
        columns: ['ownerType', 'ownerId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
