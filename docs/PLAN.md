# Smart Composter — Web Monitoring Plan

## Context
Anaerobic smart composter boxes (ESP32 + DS18B20, DHT22, MQ-135, BTS7960 motor) are deployed at several schools. Each ESP32 publishes sensor data over MQTT, tagged by its hardware ID. We need a website where:
- each **school** logs in and sees/controls only its own composters,
- a **superadmin** sees all schools and assigns which hardware ID belongs to which school,
- the firmware engineer only needs to know the topic/payload contract.

Repo state today: git initialized, one commit (`docs/gamtek/*.jpeg`), untracked root `.env` holding EMQX credentials, **no `.gitignore` yet** (must be added before any `git add .`).

Decisions made with the user: monitor **+ stir button** in v1; **dashboard badges** for alerts in v1 (WhatsApp via n8n is v2); UI in **Bahasa Indonesia** (code/comments in English); hooks = **format on edit + checks on stop**.

---

## 1. Tech stack

| Layer | Choice |
|---|---|
| Backend | Laravel (latest stable, PHP 8.4) from `laravel/react-starter-kit` |
| Frontend | React + TypeScript via Inertia, Tailwind, shadcn/ui (all from starter kit), `recharts` |
| Live refresh | Inertia `usePoll(10s)` — no WebSockets/Reverb |
| DB | MySQL 8 (Sail container); SQLite in-memory for tests |
| MQTT broker | Dev: EMQX Serverless `wed7fed0.ala.asia-southeast1.emqxsl.com:8883` (TLS). Prod: Mosquitto on Indonesian VPS |
| MQTT client | `php-mqtt/laravel-client` |
| Dev env | Laravel Sail (Docker Compose) — no local PHP/Composer/MySQL |
| Tests | Pest (starter kit) + `tsc` + ESLint |
| VCS | Git + GitHub (private repo via `gh`), starter kit's GitHub Actions adapted to `web/` |
| Claude Code plugins | laravel-boost (wired to Sail), php-lsp, typescript-lsp, context7, security-guidance, commit-commands, frontend-design |

## 2. Repo layout
```
/                     .gitignore (.env, web/vendor, web/node_modules …), README.md
/docs/gamtek/         existing drawings
/web/                 Laravel app (Sail)
/firmware/            owned by firmware engineer (not this plan)
/.claude/settings.json + /.claude/hooks/{format.sh,check.sh}
```

## 3. System flow
```
ESP32 ──publish──▶ composter/{hardware_id}/telemetry ──▶ EMQX
                                                         │
             mqtt-listener container (php artisan mqtt:listen)
             validate id + payload → find/create Device → save Reading
                                                         │
School user / Superadmin ──▶ Laravel + Inertia React ◀── MySQL
             "Aduk" button ──▶ POST /devices/{id}/stir ──▶ publish composter/{hardware_id}/cmd ──▶ ESP32
```

### MQTT contract (hand to firmware engineer)
| Item | Value |
|---|---|
| `hardware_id` | `esp32-` + MAC without colons, uppercase: `^esp32-[0-9A-F]{12}$` (also the device's MQTT username) |
| Telemetry | `composter/{hardware_id}/telemetry`, QoS 0, every 30–60 s |
| Payload | `{"temp_core":45.2,"temp_air":31.0,"humidity":88.0,"gas":412}` — any field may be omitted/null if a sensor fails |
| Command | `composter/{hardware_id}/cmd`, QoS 1, payload `{"action":"stir","duration_s":30}` |
| Firmware must | cap motor run time itself, stop on stall (BTS7960 IS pins), ignore unknown actions |
| TLS | port 8883, CA = DigiCert Global Root G2 (EMQX) |
| Timestamps | server receive time (ESP32 needs no RTC) |

### Ingest rules (`mqtt:listen`)
- Topic not matching `composter/{valid id}/telemetry` → ignore + log.
- Invalid JSON / non-numeric → ignore + log, never crash.
- Out-of-range values (temp −20..100, humidity 0..100, gas ≥0) → stored as null.
- Unknown valid id → create Device with `school_id = null` ("Belum ditetapkan"), then save reading.
- Process dies on disconnect → container `restart: unless-stopped` brings it back. `ponytail: rely on Docker restart, add in-process reconnect if gaps become a problem`.

## 4. Data model (migrations)
- `schools`: id, name, timestamps
- `users` (+ columns): `school_id` nullable FK, `is_superadmin` bool default false
- `devices`: id, `hardware_id` unique, `name` nullable, `school_id` nullable FK, `last_seen_at` nullable, timestamps
- `readings`: id, `device_id` FK (indexed with `created_at`), `temp_core`, `temp_air`, `humidity`, `gas` (all nullable decimals), `created_at`

Skipped: reading retention/pruning (≈2 GB/yr at 20 devices — add `MassPrunable` later), separate commands audit table (stir presses go to Laravel log with user id).

## 5. Roles & authorization
- **Superadmin** (`is_superadmin = true`, `school_id = null`): sees all devices; manages schools, users, device assignment.
- **School user** (`school_id` set): sees and stirs only own school's devices. Multiple users per school allowed by schema.
- Public registration **disabled**; superadmin creates accounts. First superadmin seeded from `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD` env (no hardcoded password).
- `Gate::define('superadmin')` + `can:superadmin` middleware on `/admin/*`.
- `DevicePolicy::view` = superadmin OR `device.school_id === user.school_id` (used by show + stir). Unassigned devices visible only to superadmin.
- `Device::scopeVisibleTo($user)` for lists.
- Stir: `throttle` 1/min per device, `duration_s` validated 5..120.

## 6. Status / alerts (v1 badges)
Computed on read, no table:
- **Offline**: `last_seen_at` older than 5 min.
- **Peringatan**: latest reading crosses a threshold in `config/composter.php` (env-tunable calibration knobs, e.g. `temp_core_max`, `gas_max`).
- **Normal** otherwise.
v2 (not now): on status change, POST to an n8n webhook → WhatsApp.

## 7. Pages (Bahasa Indonesia)
| Route | Who | Content |
|---|---|---|
| `/dashboard` | all | device cards: name, school (superadmin), latest values, badge, last seen; polls 10 s |
| `/devices/{device}` | policy | 24 h line charts per metric, latest values, "Aduk sekarang" button |
| `/admin/schools` | superadmin | list/create/rename schools |
| `/admin/users` | superadmin | list/create users, set school |
| `/admin/devices` | superadmin | list all devices (unassigned first), set name + school |
Skipped: 7-day/30-day charts (need downsampling; add when asked), profile extras beyond starter kit.

## 8. Build steps (stop for user review after each, commit after approval)
1. **Repo hygiene**: root `.gitignore`; scaffold `web/` via `composer create-project laravel/react-starter-kit` in a `laravelsail/php84-composer` container; `sail:install --with=mysql`; move MQTT vars into `web/.env`, delete root `.env`; add `laravel/boost` + wire plugin MCP to `./vendor/bin/sail artisan boost:mcp`; `php-mqtt/laravel-client`; `recharts`; `gh repo create` private + push.
2. **Hooks**: `.claude/settings.json` + `format.sh` + `check.sh` (section 9).
3. **Schema + seeder + models** (School, Device, Reading, User relations, scope, policy, gate). Disable registration.
4. **Ingest**: `App\Mqtt\TelemetryHandler` (pure `handle(topic, payload)`) + `mqtt:listen` command + `mqtt-listener` service in `compose.yaml`.
5. **Dashboard + device detail** pages with polling and charts.
6. **Superadmin pages**.
7. **Stir button** + publish.
8. **CI**: adapt starter kit workflows to `working-directory: web`.
9. **Docs**: README (setup, MQTT contract for firmware).
Later (separate plan): production VPS + Mosquitto with `pattern readwrite composter/%u/#` ACL, n8n WhatsApp.

## 9. Claude Code hooks (`.claude/settings.json`, project-level, committed)
- **PostToolUse**, matcher `Edit|Write|MultiEdit` → `.claude/hooks/format.sh`: reads `tool_input.file_path` via `jq`;
  - `web/**/*.php` → `docker compose exec -T laravel.test ./vendor/bin/pint <path>` (skip silently if Sail is down);
  - `web/resources/**/*.{ts,tsx}` → local `npx prettier --write <path>`;
  - anything else → no-op. Always exit 0 (formatting never blocks).
- **Stop** → `.claude/hooks/check.sh`:
  - exit 0 if nothing changed under `web/` (`git status --porcelain web`);
  - exit 0 with a warning if Sail isn't running;
  - run `sail artisan test`, `npm run types`, `npm run lint`;
  - on failure: print output to stderr, **exit 2** (Claude must fix before handing back) — unless input `stop_hook_active` is true, then report without blocking (prevents infinite loops).

## 10. Tests (Pest, `web/tests/Feature/`)
- **TelemetryIngestTest**: known device → reading saved + `last_seen_at` updated; unknown valid id → unassigned device created; invalid id → nothing saved; malformed JSON → nothing saved, no exception; out-of-range value → null; partial payload → missing fields null; wrong topic suffix ignored.
- **DeviceAccessTest**: guest → redirect login; school A dashboard lists only A devices (Inertia props assert); A viewing B's device → 403; A viewing unassigned → 403; superadmin sees all.
- **SuperadminTest**: school user on `/admin/*` → 403; superadmin creates school, creates user tied to school, assigns device; `/register` → 404.
- **StirCommandTest** (MQTT facade mocked): own device → publishes to `composter/{hardware_id}/cmd` with expected JSON, QoS 1; other school → 403, no publish; invalid duration → 422; second press within a minute → 429; superadmin allowed.
- **DeviceStatusTest**: offline after 5 min; warning above threshold; normal otherwise; no readings → offline.
- Starter kit's auth tests kept (adjusted for disabled registration).
- Frontend: no unit tests — `tsc` + ESLint cover it.

## 11. Verification (end-to-end)
1. `sail up -d`; `sail artisan test` green; `npm run types && npm run lint` clean.
2. Publish with MQTTX/MQTT Explorer as `dev-test` to `composter/esp32-AABBCCDDEEFF/telemetry` → device appears under superadmin `/admin/devices` as unassigned.
3. Assign to a school → log in as that school's user → card shows values, refreshes within 10 s of a new publish.
4. Log in as another school's user → device not listed; direct URL → 403.
5. Stop publishing 5 min → badge "Offline". Publish `temp_core` over threshold → "Peringatan".
6. Press "Aduk sekarang" while subscribed to `composter/#` → `{"action":"stir","duration_s":30}` arrives on `/cmd`; second press → throttled.
7. UI smoke via chrome-devtools MCP for both roles.
