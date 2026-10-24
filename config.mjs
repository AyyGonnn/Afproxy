import { getStore } from "@netlify/blobs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });

export default async (req) => {
  const store = getStore("afterlife");

  // Pengunjung mengambil pengaturan terbaru
  if (req.method === "GET") {
    const data = await store.get("config", { type: "json" });
    return json(data || {});
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "method" }, 405);
  }

  const body = await req.json().catch(() => ({}));

  // Username dan password diambil dari Environment Variables di Netlify
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASSWORD;
  const loginOk =
    !!adminUser && !!adminPass &&
    body.user === adminUser &&
    body.pass === adminPass;

  if (body.action === "login") {
    return json({ ok: loginOk });
  }

  if (body.action === "save") {
    if (!loginOk) return json({ ok: false, error: "unauthorized" }, 401);
    if (!body.config || typeof body.config !== "object") {
      return json({ ok: false, error: "invalid" }, 400);
    }
    await store.setJSON("config", body.config);
    return json({ ok: true });
  }

  return json({ ok: false, error: "unknown" }, 400);
};

export const config = { path: "/api/config" };
