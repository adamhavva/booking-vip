#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/62825c22b3dff7a822a952ffd879a4c9a1ff298c0910cbfb9ed7867bf98c653d/contract';
import startContract from '../../snapshots/62825c22b3dff7a822a952ffd879a4c9a1ff298c0910cbfb9ed7867bf98c653d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ca99eae16c409959f72e5f99aefad4c7d5823be16e16233a6072f0f7c30eca00/contract';
import endContract from '../../snapshots/ca99eae16c409959f72e5f99aefad4c7d5823be16e16233a6072f0f7c30eca00/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Article',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('categoryEn', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('categoryId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('excerptEn', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('excerptId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('imageCredit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('titleEn', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('titleId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tone', 'text', {
            notNull: true,
            default: lit('from-sky-400 to-blue-600'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Banner',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('ctaEn', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ctaHref', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ctaId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('imageCredit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('placement', 'text', {
            notNull: true,
            default: lit('home'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('subtitleEn', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('subtitleId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('titleEn', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('titleId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tone', 'text', {
            notNull: true,
            default: lit('from-blue-600 to-indigo-800'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Destination',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('countryEn', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('countryId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('imageCredit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nameEn', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nameId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('tone', 'text', {
            notNull: true,
            default: lit('from-rose-400 to-red-600'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Promo',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('imageCredit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('lineId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('subtitleEn', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('subtitleId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('titleEn', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('titleId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tone', 'text', {
            notNull: true,
            default: lit('from-blue-500 to-indigo-700'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'SearchField',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('icon', 'text', {
            notNull: true,
            default: lit('pin'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('kind', 'text', {
            notNull: true,
            default: lit('text'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('labelEn', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('labelId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('lineId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('placeholderEn', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('placeholderId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'SeoBlock',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sections', 'jsonb', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/jsonb@1' },
          }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('titleEn', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('titleId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'SeoLink',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('group', 'text', {
            notNull: true,
            default: lit('recommendations'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('href', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('labelEn', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('labelId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('tags', 'jsonb', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/jsonb@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Setting',
        columns: [
          col('key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('value', 'jsonb', { notNull: true, codecRef: { codecId: 'pg/jsonb@1' } }),
        ],
        constraints: [primaryKey(['key'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Airport',
        column: col('imageCredit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Airport',
        column: col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('imageCredit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceLine',
        column: col('badge', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceLine',
        column: col('highlights', 'jsonb', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceLine',
        column: col('imageCredit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceLine',
        column: col('imageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceLine',
        column: col('introEn', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceLine',
        column: col('introId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceLine',
        column: col('sections', 'jsonb', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ServiceLine',
        column: col('tabs', 'jsonb', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/jsonb@1' },
        }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'Article',
        index: 'Article_slug_key',
        columns: ['slug'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Banner',
        index: 'Banner_slug_key',
        columns: ['slug'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Destination',
        index: 'Destination_slug_key',
        columns: ['slug'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Promo',
        index: 'Promo_slug_key',
        columns: ['slug'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'SearchField',
        index: 'SearchField_lineId_key_key',
        columns: ['lineId', 'key'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'SeoBlock',
        index: 'SeoBlock_slug_key',
        columns: ['slug'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'SeoLink',
        index: 'SeoLink_slug_key',
        columns: ['slug'],
        extras: { unique: true },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Promo',
        foreignKey: {
          name: 'Promo_lineId_fkey',
          columns: ['lineId'],
          references: { schema: 'public', table: 'ServiceLine', columns: ['id'] },
          onDelete: 'setNull',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SearchField',
        foreignKey: {
          name: 'SearchField_lineId_fkey',
          columns: ['lineId'],
          references: { schema: 'public', table: 'ServiceLine', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
