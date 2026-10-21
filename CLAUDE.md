# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Web monitoring for an **anaerobic smart composter** deployed at multiple schools (campus project, PTIK). Each box has an ESP32 (DS18B20 core temp, DHT22 air temp/humidity, MQ-135 gas, BTS7960 stirring motor) that publishes telemetry over MQTT. The website lets:
- **School users** log in and see/stir only their own school's composters.
- **Superadmin** see every school's devices, manage schools/users, and assign hardware IDs to schools.

Firmware lives with a separate engineer (`/firmware`, not ours). Our scope is `/web`.

- `docs/PLAN.md` — approved design (stack, MQTT contract, data model, roles, tests). Source of truth; follow it, don't redesign.
- `docs/TASKS.md` — ordered vertical slices (DB → Backend → Frontend). Work one task at a time, tick the checkbox when done.
- `docs/gamtek/` — AI-generated hardware drawings (aerobic-looking; the real system is anaerobic).

## Stack

Laravel (React starter kit: Inertia + React + TypeScript + Tailwind + shadcn/ui), MySQL, `php-mqtt/laravel-client`, recharts, Laravel Sail (Docker). **No PHP/Composer/MySQL on the host** — everything PHP runs through Sail. Node/npm exist locally.

MQTT broker: dev = EMQX Serverless (TLS 8883, host in `web/.env`); prod = Mosquitto on a VPS (later).

## Architecture (big picture)

```
ESP32 → composter/{hardware_id}/telemetry → EMQX → mqtt-listener container (artisan mqtt:listen)
      → App\Mqtt\TelemetryHandler::handle(topic, payload) → devices / readings (MySQL)
Browser → Inertia pages (usePoll 10s) ← controllers scoped by user
"Aduk sekarang" → POST /devices/{device}/stir → publish composter/{hardware_id}/cmd (QoS 1)
```

- `hardware_id` = `esp32-` + uppercase MAC without colons, regex `^esp32-[0-9A-F]{12}$`. Unknown valid IDs auto-create an unassigned device (`school_id = null`) for the superadmin to assign.
- Telemetry payload `{"temp_core","temp_air","humidity","gas"}`, all nullable; out-of-range → null; bad JSON/topic → ignore + log, never crash. Timestamps are server receive time.
- Tenancy: `Device::scopeVisibleTo($user)` for lists, `DevicePolicy::view` for single-device routes (show + stir), `can:superadmin` gate on `/admin/*`. Every new device query must go through one of these.
- Status (Offline > 5 min / Peringatan above thresholds / Normal) is computed on read; thresholds are env-tunable in `config/composter.php`.
- Registration is disabled; superadmin creates accounts. First superadmin seeded from `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`.

## Commands

Run from `web/` (`sail` = `./vendor/bin/sail`):

```bash
sail up -d                                   # start app, mysql, mqtt-listener
sail artisan migrate --seed
sail artisan test                            # all Pest tests
sail artisan test --filter=TelemetryIngestTest   # single test file/case
npm run dev                                  # Vite
npm run types                                # tsc
npm run lint                                 # eslint
sail pint                                    # PHP format
sail logs -f mqtt-listener                   # watch ingest
```

Fake an ESP32: publish to `composter/esp32-AABBCCDDEEFF/telemetry` on the EMQX broker as user `dev-test` (MQTTX / MQTT Explorer).

## Workflow rules

- **After every change**: hooks in `.claude/settings.json` auto-format edited files (Pint / Prettier) and, on stop, run tests + `types` + `lint`; fix failures before handing back. If hooks aren't set up yet, run those checks manually.
- Web work happens on `dev_web_fe` (frontend: `resources/js`, UI) or `dev_web_be` (backend: PHP, migrations, MQTT, tests), never directly on `main`. Switch to the matching branch before editing.
- Finish one TASKS.md slice, stop for the user's review, commit only after approval.
- Commit messages: `<type>(<slice>): <summary>` — e.g. `feat(ingest): save telemetry readings`, `test(stir): cover throttle`. Types: feat, fix, test, chore, docs, refactor.
- **Never add Claude as co-author**: no `Co-Authored-By: Claude` line and no "Generated with Claude Code" footer in commits or PRs.
- UI text in **Bahasa Indonesia**; code, comments, and commit messages in English.
- Secrets live only in `web/.env` (gitignored). Never echo MQTT passwords into chat, logs, or committed files.
- Look up Laravel/Inertia/recharts APIs with laravel-boost or context7 rather than memory.
- Use the plugins/skills/MCP servers that fit the problem instead of working unaided: laravel-boost (schema, routes, tinker, logs, docs), context7 (library docs), php-lsp / typescript-lsp (navigation, diagnostics), mqtt (broker testing), frontend-design (UI work), security-guidance (auth/tenancy/stir changes), commit-commands (commits), code-review / simplify (before handing back a slice).

## Out of scope for v1

WhatsApp alerts via n8n (v2), Mosquitto production deploy + per-device ACL (`pattern readwrite composter/%u/#`), reading retention/pruning, 7/30-day charts.
