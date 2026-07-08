// Supabase Edge Function: track-pickups
// Deploy: supabase functions deploy track-pickups --no-verify-jwt
// Secrets: supabase secrets set INGEST_KEY=... (same value as API_KEY in main.lua)

import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_ITEMS_PER_BATCH = 60;   // distinct items per submission
const MAX_COUNT_PER_ITEM = 20;    // one client can't claim 500x Sad Onion at once
const MAX_ITEM_ID = 1000;         // Repentance collectible IDs are < ~750; headroom for DLC
const MAX_SUBMISSIONS_PER_HOUR = 30;
const MAX_NAME_LENGTH = 60;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Shared-secret check (keeps drive-by spam out; a determined cheater can
  // extract it from the mod, which is why the per-item caps below matter more)
  if (req.headers.get("x-ingest-key") !== Deno.env.get("INGEST_KEY")) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    client_id?: string;
    counts?: Record<string, number>;
    names?: Record<string, string>;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const clientId = body.client_id;
  const counts = body.counts;
  const names = body.names;

  if (
    typeof clientId !== "string" ||
    clientId.length < 8 ||
    clientId.length > 64 ||
    !counts || typeof counts !== "object"
  ) {
    return new Response("Bad payload", { status: 400 });
  }

  // Validate and clamp the counts
  const clean: Record<string, number> = {};
  let distinct = 0;
  for (const [key, value] of Object.entries(counts)) {
    const itemId = Number(key);
    const amount = Number(value);
    if (!Number.isInteger(itemId) || itemId <= 0 || itemId > MAX_ITEM_ID) continue;
    if (!Number.isInteger(amount) || amount <= 0) continue;
    clean[itemId] = Math.min(amount, MAX_COUNT_PER_ITEM);
    if (++distinct >= MAX_ITEMS_PER_BATCH) break;
  }

  if (distinct === 0) {
    return new Response("Nothing to record", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Rate limit per anonymous client
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recent } = await supabase
    .from("pickup_submissions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .gte("created_at", oneHourAgo);

  if ((recent ?? 0) >= MAX_SUBMISSIONS_PER_HOUR) {
    return new Response("Rate limited", { status: 429 });
  }

  const totalItems = Object.values(clean).reduce((a, b) => a + b, 0);

  const { error: logError } = await supabase
    .from("pickup_submissions")
    .insert({ client_id: clientId, total_items: totalItems });
  if (logError) {
    return new Response("Server error", { status: 500 });
  }

  const { error: rpcError } = await supabase.rpc("increment_pickups", {
    p_counts: clean,
  });
  if (rpcError) {
    return new Response("Server error", { status: 500 });
  }

  // Optional: upsert item names (ignore duplicates so first-writer wins)
  if (names && typeof names === "object") {
    const rows: { item_id: number; name: string }[] = [];
    for (const [key, value] of Object.entries(names)) {
      const itemId = Number(key);
      if (!Number.isInteger(itemId) || itemId <= 0 || itemId > MAX_ITEM_ID) continue;
      if (typeof value !== "string" || value.trim().length === 0) continue;
      rows.push({ item_id: itemId, name: value.trim().slice(0, MAX_NAME_LENGTH) });
    }
    if (rows.length > 0) {
      await supabase.from("items").upsert(rows, { ignoreDuplicates: true });
    }
  }

  return new Response(JSON.stringify({ ok: true, recorded: totalItems }), {
    headers: { "Content-Type": "application/json" },
  });
});
