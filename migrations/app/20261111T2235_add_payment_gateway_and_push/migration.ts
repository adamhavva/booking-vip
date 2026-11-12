#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/8706403bb7234171e8ac51922048d445136daedfc7e9c0ce9838cf7c521efbb8/contract';
import endContract from '../../snapshots/8706403bb7234171e8ac51922048d445136daedfc7e9c0ce9838cf7c521efbb8/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c126069b4daa98e6cc4ba6c3a8a249672ea57d8742f08fff0512ea631e0ef2bb/contract';
import startContract from '../../snapshots/c126069b4daa98e6cc4ba6c3a8a249672ea57d8742f08fff0512ea631e0ef2bb/contract.json' with { type: 'json' };
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
        table: 'PaymentWebhookEvent',
        columns: [
          col('eventType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('outcome', 'text', {
            notNull: true,
            default: lit('processed'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('payload', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('provider', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('providerEventId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('receivedAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'PushSubscription',
        columns: [
          col('auth', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('endpoint', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('p256dh', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('userAgent', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Payment',
        column: col('checkoutUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Payment',
        column: col('expiresAt', 'timestamp(3)', {
          codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Payment',
        column: col('paidAt', 'timestamp(3)', {
          codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Payment',
        column: col('provider', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Payment',
        column: col('providerAmountCents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Payment',
        column: col('providerCurrency', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Payment',
        column: col('providerRef', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Payment',
        column: col('rawPayload', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'PaymentMethod',
        column: col('provider', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'PaymentMethod',
        column: col('providerCurrency', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'PaymentMethod',
        column: col('providerMethodCode', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'Payment',
        index: 'Payment_providerRef_idx',
        columns: ['providerRef'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PaymentWebhookEvent',
        index: 'PaymentWebhookEvent_provider_providerEventId_key',
        columns: ['provider', 'providerEventId'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'PushSubscription',
        index: 'PushSubscription_endpoint_key',
        columns: ['endpoint'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'PushSubscription',
        index: 'PushSubscription_userId_idx',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PushSubscription',
        foreignKey: {
          name: 'PushSubscription_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
