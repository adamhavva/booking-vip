// Server-side helpers for Cloudflare R2 (S3-compatible object storage).
//
// Files live in the `vip-book` bucket; the database stores a stable public
// URL for every object (`R2_PUBLIC_BASE_URL` + key). Never store signed or
// expiring URLs — those belong to the `Media.url` column as plain strings.
//
// Environment:
//   CLOUDFLARE_S3_ENDPOINT  S3 endpoint, e.g. https://<account>.r2.cloudflarestorage.com
//   CLOUDFLARE_ACCESS_KEY_ID / CLOUDFLARE_ACCESS_SECRET  S3 credentials
//   R2_BUCKET               bucket name (default "vip-book")
//   R2_PUBLIC_BASE_URL      public base, e.g. https://pub-<hash>.r2.dev or a
//                           custom domain — the prefix stored in the database

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export const R2_BUCKET = process.env["R2_BUCKET"] ?? "vip-book";

/** The public URL prefix stored in the database, or null while unset. */
export function publicBaseUrl(): string | null {
  const base = process.env["R2_PUBLIC_BASE_URL"];
  if (!base) return null;
  return base.replace(/\/+$/, "");
}

/** Stable public URL of an object key (placeholder `/media/<key>` until the
 * public base URL is configured). */
export function mediaUrl(key: string): string {
  const base = publicBaseUrl();
  return base ? `${base}/${key}` : `/media/${key}`;
}

let client: S3Client | null = null;

/** Shared S3 client — R2 uses path-style addressing and the "auto" region. */
export function r2(): S3Client {
  if (client) return client;
  const endpoint =
    process.env["CLOUDFLARE_S3_ENDPOINT"] ?? process.env["CLOUDFLARE_S3_API"];
  if (!endpoint || !process.env["CLOUDFLARE_ACCESS_KEY_ID"] || !process.env["CLOUDFLARE_ACCESS_SECRET"]) {
    throw new Error(
      "Missing R2 configuration — set CLOUDFLARE_S3_ENDPOINT, CLOUDFLARE_ACCESS_KEY_ID and CLOUDFLARE_ACCESS_SECRET."
    );
  }
  client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env["CLOUDFLARE_ACCESS_KEY_ID"],
      secretAccessKey: process.env["CLOUDFLARE_ACCESS_SECRET"],
    },
    forcePathStyle: true,
  });
  return client;
}

/** True when the object already exists in the bucket. */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await r2().send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;
    if (status === 404) return false;
    throw err;
  }
}

/** Upload a file; `contentType` should be e.g. "image/jpeg". */
export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  await r2().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

/** Delete one object. */
export async function deleteObject(key: string): Promise<void> {
  await r2().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

/** Read an object body with its stored content type. */
export async function getObjectMeta(
  key: string
): Promise<{ body: Buffer; contentType: string | null } | null> {
  try {
    const res = await r2().send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
    );
    return {
      body: Buffer.from(await res.Body!.transformToByteArray()),
      contentType: res.ContentType ?? null,
    };
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw err;
  }
}

/** Read an object body (used by the admin preview and maintenance jobs). */
export async function getObject(key: string): Promise<Buffer> {
  return (await getObjectMeta(key))!.body;
}
