// Minimal PostgREST client for Supabase. Runs only inside Cloudflare Pages
// Functions (server side) using the Supabase *service role* key, which is
// never sent to the browser — only these Functions ever see it.
export function supabaseRequest(env, { table, method = "GET", query = "", body = null, headers = {} }) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}${query}`;
  return fetch(url, {
    method,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "GET" ? undefined : "return=representation",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function supabaseJson(env, opts) {
  const res = await supabaseRequest(env, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error (${res.status}): ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
