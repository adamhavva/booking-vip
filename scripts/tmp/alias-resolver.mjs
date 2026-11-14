// Resolve the app's "@/..." alias for plain-node test scripts.
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const url = new URL("../../src/" + specifier.slice(2) + ".ts", import.meta.url);
    return nextResolve(url.href, context);
  }
  return nextResolve(specifier, context);
}