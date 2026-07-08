# Isaac Arcade Stats — setup guide

## 1. Backend (do this first)

1. In your existing Supabase project, run `supabase/schema.sql` in the SQL editor.
2. Deploy the edge function:
   ```bash
   supabase functions deploy track-pickups --no-verify-jwt
   supabase secrets set INGEST_KEY=some-long-random-string
   ```
3. Test it without the game:
   ```bash
   curl -X POST "https://YOUR-PROJECT-REF.supabase.co/functions/v1/track-pickups" \
     -H "Content-Type: application/json" \
     -H "x-ingest-key: some-long-random-string" \
     -d '{"client_id":"test-client-123","counts":{"1":2,"114":1}}'
   ```
   Then check `select * from item_pickups;` — you should see Sad Onion (1) and Mom's Knife (114).

## 2. Mod installation (local testing)

1. Copy the `isaacarcade stats` folder to:
   `C:\Program Files (x86)\Steam\steamapps\common\The Binding of Isaac Rebirth\mods\`
2. Edit `main.lua` — set `ENDPOINT_URL` and `API_KEY` to your real values.
3. In Steam: right-click Isaac → Properties → Launch Options → add `--luadebug`
4. Launch the game, enable the mod in the Mods menu, start a run, pick up items.
5. Check the log at `Documents\My Games\Binding of Isaac Repentance+\log.txt`
   for lines starting with `[IsaacArcadeStats]`.
6. Pick up 15+ items or quit the run — then check `item_pickups` in Supabase.

## 3. Behavior summary

| Situation | What happens |
|---|---|
| Mod installed, no `--luadebug` | Counts saved locally only, nothing uploaded |
| Mod installed + `--luadebug` | Counts batched and uploaded via curl every 15 pickups and at run end |
| Game crashes | At most the current floor's pickups are lost (saves every new level) |

## 4. Workshop publishing notes

- Disclose the data collection clearly in the Workshop description
  (anonymous item counts only, upload requires opting in with `--luadebug`).
- Explain the `--luadebug` step with screenshots — most players won't know it.
- Note: `--luadebug` disables achievements-related integrity for some players'
  comfort levels? It does NOT disable achievements, but it does give all mods
  file system access, so tell users to only use it with mods they trust.

## 5. Known limitations

- Tainted Isaac / Moving Box can re-queue an item the player already owns,
  which counts it again. Acceptable noise at scale.
- Upload is fire-and-forget: if curl fails (offline), that batch is lost.
- The ingest key ships inside the mod, so it is not a real secret — the
  per-item caps and rate limits in the edge function are the actual defense.
