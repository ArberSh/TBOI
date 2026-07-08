--[[
    Isaac Arcade Stats
    Tracks which collectibles the player picks up and (optionally) uploads
    anonymous counts to isaacarcade.com.

    - Always: counts are stored locally in the mod's save data.
    - Only if the game is launched with --luadebug: counts are POSTed to
      the Isaac Arcade backend via curl (bundled with Windows 10+/macOS/Linux).
]]

local mod = RegisterMod("Isaac Arcade Stats", 1)
local json = require("json")

-- ========================== CONFIG ==========================
local ENDPOINT_URL = "https://zczeouminjzkrcxyrgwk.supabase.co/functions/v1/track-pickups"
local API_KEY      = "01daf0c1582e1df73ff214679f1dcfc4ee982a2ca5b079ccf71e23baa5317a72" -- NOT your service role key!
local UPLOAD_EVERY_N_PICKUPS = 15             -- also uploads on run end / game exit
-- ============================================================

local store = {
    clientId = nil,   -- random anonymous id, generated once
    counts   = {},    -- lifetime counts   ["itemId"] = n
    pending  = {},    -- not-yet-uploaded  ["itemId"] = n
}

local queuedFlag = {}       -- per-player "already counted current queued item"
local pendingTotal = 0
local hasNetworkBridge = (io ~= nil and os ~= nil) -- true only with --luadebug
local isWindows = package.config:sub(1, 1) == "\\"

-- ------------------------- helpers -------------------------

local function log(msg)
    Isaac.DebugString("[IsaacArcadeStats] " .. tostring(msg))
end

local function generateClientId()
    local t = {}
    for _ = 1, 4 do
        t[#t + 1] = string.format("%08x", Random())
    end
    return table.concat(t, "-")
end

local function saveStore()
    mod:SaveData(json.encode(store))
end

local function loadStore()
    if mod:HasData() then
        local ok, decoded = pcall(json.decode, mod:LoadData())
        if ok and type(decoded) == "table" then
            store.clientId = decoded.clientId
            store.counts   = decoded.counts  or {}
            store.pending  = decoded.pending or {}
        end
    end
    if not store.clientId then
        store.clientId = generateClientId()
        saveStore()
    end
    pendingTotal = 0
    for _, n in pairs(store.pending) do
        pendingTotal = pendingTotal + n
    end
end

-- ------------------------- upload --------------------------

local function tryUpload()
    if pendingTotal == 0 then return end
    if not hasNetworkBridge then
        log("No --luadebug: keeping " .. pendingTotal .. " pickups local only.")
        return
    end

    local payload = json.encode({
    client_id = store.clientId,
    counts    = store.pending,
    names     = (Options.Language == "en") and (store.names or {}) or nil,
})

    local tmpDir = os.getenv("TEMP") or os.getenv("TMPDIR") or "/tmp"
    local sep = isWindows and "\\" or "/"
    local path = tmpDir .. sep .. "isaacarcade_payload.json"

    local f = io.open(path, "w")
    if not f then
        log("Could not write payload file, will retry later.")
        return
    end
    f:write(payload)
    f:close()

    local curlCmd = string.format(
        'curl -s -m 10 -X POST "%s" -H "Content-Type: application/json" -H "x-ingest-key: %s" -d @"%s"',
        ENDPOINT_URL, API_KEY, path
    )

    -- Fire and forget in the background so the game never stutters.
    if isWindows then
        os.execute('start "" /B ' .. curlCmd)
    else
        os.execute(curlCmd .. ' >/dev/null 2>&1 &')
    end

    log("Uploaded " .. pendingTotal .. " pending pickups.")
    store.pending = {}
    pendingTotal = 0
    saveStore()
end

-- --------------------- pickup detection --------------------

-- Any collectible the player actually collects gets "queued" above their
-- head first (pedestals, shops, machines, chests...). We count each queued
-- collectible exactly once per queue cycle.
function mod:onPlayerEffectUpdate(player)
    local key = GetPtrHash(player)
    local queued = player.QueuedItem

    if queued ~= nil and queued.Item ~= nil and queued.Item:IsCollectible() then
        if not queuedFlag[key] then
            queuedFlag[key] = true
            local id = tostring(queued.Item.ID)
store.counts[id]  = (store.counts[id]  or 0) + 1
store.pending[id] = (store.pending[id] or 0) + 1
store.names = store.names or {}
store.names[id] = queued.Item.Name
pendingTotal = pendingTotal + 1
            log("Picked up item " .. id)

            if pendingTotal >= UPLOAD_EVERY_N_PICKUPS then
                tryUpload()
            end
        end
    else
        queuedFlag[key] = false
    end
end
mod:AddCallback(ModCallbacks.MC_POST_PEFFECT_UPDATE, mod.onPlayerEffectUpdate)

-- ------------------------ lifecycle ------------------------

function mod:onGameStarted(isContinued)
    loadStore()
    if not isContinued then
        queuedFlag = {}
    end
end
mod:AddCallback(ModCallbacks.MC_POST_GAME_STARTED, mod.onGameStarted)

function mod:onGameEnd()
    tryUpload()
    saveStore()
end
mod:AddCallback(ModCallbacks.MC_POST_GAME_END, mod.onGameEnd)

function mod:onPreGameExit(shouldSave)
    tryUpload()
    saveStore()
end
mod:AddCallback(ModCallbacks.MC_PRE_GAME_EXIT, mod.onPreGameExit)

-- Save periodically (every new floor) so a crash loses almost nothing.
function mod:onNewLevel()
    saveStore()
end
mod:AddCallback(ModCallbacks.MC_POST_NEW_LEVEL, mod.onNewLevel)

log("Loaded. Network bridge: " .. tostring(hasNetworkBridge))
