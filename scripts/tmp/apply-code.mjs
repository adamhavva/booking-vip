import fs from "node:fs";
const env = {};
for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/\\n/g, "\n");
}
const oobCode = process.argv[2];
const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${env.FIREBASE_API_KEY}`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oobCode }),
});
console.log(res.status, JSON.stringify(await res.json()).slice(0, 300));
