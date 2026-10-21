# Tasks

Ordered vertical slices from [PLAN.md](PLAN.md). Each slice goes DB → Backend → Frontend and ends with its tests green, user review, then commit.

## 0. Scaffold
- [x] 0.1 Root `.gitignore` (`.env`, `web/vendor`, `web/node_modules`, …) before anything else is staged
- [x] 0.2 Scaffold `web/` from `laravel/react-starter-kit` via `laravelsail/php84-composer` container, `sail:install --with=mysql`, `sail up -d`
- [x] 0.3 Move MQTT vars from root `.env` into `web/.env` (+ empty keys in `web/.env.example`), delete root `.env`
- [x] 0.4 Install `php-mqtt/laravel-client`, `laravel/boost` (dev), `recharts`; wire laravel-boost MCP to `./vendor/bin/sail artisan boost:mcp`
- [x] 0.5 Claude Code hooks: `.claude/settings.json`, `.claude/hooks/format.sh` (Pint/Prettier on edit), `.claude/hooks/check.sh` (tests + types + lint on stop)
- [ ] 0.6 Verify starter kit tests/types/lint green, `gh repo create` private, first push

## 1. Roles & access
- [ ] 1.1 DB: `schools` table, `school_id` + `is_superadmin` on `users`, factories
- [ ] 1.2 Backend: `School` model + User relations, `superadmin` gate, disable registration, superadmin seeder from `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD`
- [ ] 1.3 Frontend: translate auth pages to Bahasa Indonesia, remove register links, show school name / "Superadmin" in sidebar user menu
- [ ] 1.4 Tests: `/register` → 404, seeder creates superadmin, adjusted starter-kit auth tests

## 2. Telemetry ingest
- [ ] 2.1 DB: `devices` (`hardware_id` unique, `name`, `school_id` nullable, `last_seen_at`) + `readings` (`device_id`+`created_at` index, nullable `temp_core`/`temp_air`/`humidity`/`gas`)
- [ ] 2.2 Backend: `Device`/`Reading` models, `App\Mqtt\TelemetryHandler::handle(topic, payload)` (id regex, JSON + range validation, auto-create unassigned device)
- [ ] 2.3 Backend: `mqtt:listen` command + `mqtt-listener` service in `compose.yaml` (`restart: unless-stopped`)
- [ ] 2.4 Tests: `TelemetryIngestTest` (known/unknown/invalid id, malformed JSON, out-of-range → null, partial payload, wrong topic)
- [ ] 2.5 Manual: publish to EMQX as `dev-test` → row appears in `readings`

## 3. Dashboard (device list + status)
- [ ] 3.1 Backend: `config/composter.php` thresholds (env-tunable), `Device::scopeVisibleTo($user)`, status accessor (Offline / Peringatan / Normal)
- [ ] 3.2 Backend: `/dashboard` controller passing visible devices + latest reading + status
- [ ] 3.3 Frontend: device cards (name, school for superadmin, latest values, status badge, last seen) with `usePoll(10s)`
- [ ] 3.4 Tests: `DeviceStatusTest`, `DeviceAccessTest` (guest redirect, school A sees only A, superadmin sees all, unassigned hidden from schools)

## 4. Device detail
- [ ] 4.1 Backend: `DevicePolicy::view`, `/devices/{device}` with last 24 h readings
- [ ] 4.2 Frontend: detail page with latest values + recharts line charts per metric, polling
- [ ] 4.3 Tests: A viewing B's device → 403, A viewing unassigned → 403, superadmin → 200

## 5. Superadmin: schools
- [ ] 5.1 Backend: `/admin/schools` index/store/update behind `can:superadmin`, validation
- [ ] 5.2 Frontend: schools list + create/rename form, admin nav section (superadmin only)
- [ ] 5.3 Tests: school user → 403, superadmin creates/renames school

## 6. Superadmin: users
- [ ] 6.1 Backend: `/admin/users` index/store (name, email, password, school)
- [ ] 6.2 Frontend: users list + create form with school select
- [ ] 6.3 Tests: school user → 403, superadmin creates user tied to school, created user can log in and sees only own school

## 7. Superadmin: device assignment
- [ ] 7.1 Backend: `/admin/devices` index (unassigned first) + update (`name`, `school_id`)
- [ ] 7.2 Frontend: devices table with name input + school select
- [ ] 7.3 Tests: school user → 403, superadmin assigns device, device then visible to that school

## 8. Stir command
- [ ] 8.1 Backend: `POST /devices/{device}/stir` (policy, `duration_s` 5..120, throttle 1/min/device), publish QoS 1 to `composter/{hardware_id}/cmd`, log user id
- [ ] 8.2 Frontend: "Aduk sekarang" button + duration input on detail page, success/throttled feedback
- [ ] 8.3 Tests: `StirCommandTest` (own device publishes expected JSON, other school 403 no publish, invalid duration 422, second press 429, superadmin allowed)

## 9. Wrap-up
- [ ] 9.1 CI: adapt starter-kit GitHub Actions to `working-directory: web`
- [ ] 9.2 README: setup steps + MQTT contract for the firmware engineer
- [ ] 9.3 End-to-end verification (PLAN.md §11) incl. chrome-devtools smoke test for both roles
