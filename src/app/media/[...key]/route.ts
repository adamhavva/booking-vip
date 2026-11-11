// Serves the images of the R2 bucket through the app itself.
//
// The database stores `/media/<key>` URLs, so every image request lands
// here: the handler reads the object from the bucket with the server's
// credentials and streams it back with a long browser cache lifetime.
//
// Because the URL is same-origin, `next/image` needs no remote host
// allow-listing and the path works on every network — no dependence on the
// reachability of a CDN hostname.

import { getObjectMeta } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await params;
  const key = segments.join("/");
  if (!key) return new Response("Not found", { status: 404 });

  try {
    const object = await getObjectMeta(key);
    if (!object) return new Response("Not found", { status: 404 });

    const contentType = object.contentType ?? "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      // The bucket holds only site images — never serve anything else.
      return new Response("Not found", { status: 404 });
    }

    return new Response(new Uint8Array(object.body), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Length": String(object.body.byteLength),
      },
    });
  } catch (error) {
    console.error("[media] could not read object", key, error);
    return new Response("Upstream error", { status: 502 });
  }
}
