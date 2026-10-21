# Smart Composter

Web monitoring for an anaerobic smart composter deployed at several schools. Each composter's ESP32 publishes telemetry over MQTT; the website shows each school its own composters and lets it trigger stirring. A superadmin manages schools, users, and device assignment.

```
web/        Laravel + Inertia + React app (this README)
firmware/   ESP32 firmware (maintained by the firmware engineer)
docs/       PLAN.md (design), TASKS.md (progress)
```

## Requirements

- **Docker** with Docker Compose (everything PHP/MySQL runs inside Laravel Sail; no PHP, Composer, or MySQL needed on the host)
- **Node.js + npm** (for `npm` checks on the host)
- **Git**
- An **MQTT broker** account (dev: EMQX Serverless over TLS, port 8883)

## Getting started

```bash
git clone git@github.com:admir4ljoni/Smart-Composter.git
cd Smart-Composter/web

# 1. Install PHP dependencies (uses a throwaway container, since PHP isn't on the host)
docker run --rm -u "$(id -u):$(id -g)" -v "$(pwd):/var/www/html" -w /var/www/html \
    laravelsail/php84-composer:latest composer install --ignore-platform-reqs

# 2. Environment
cp .env.example .env
# fill in MQTT_* values in .env (ask the project owner, never commit them)

# 3. Start containers (app + MySQL)
./vendor/bin/sail up -d

# 4. App key, database, frontend
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm install
./vendor/bin/sail npm run dev
```

Open http://localhost.

Tip: `alias sail='./vendor/bin/sail'` to shorten the commands below.

## Everyday commands (from `web/`)

```bash
sail up -d / sail down              # start / stop containers
sail npm run dev                    # Vite dev server
sail artisan test --compact         # tests
npm run types:check                 # TypeScript
npm run check                       # lint + format check (npm run check:fix to fix)
sail pint                           # format PHP
sail artisan migrate:fresh --seed   # reset database
sail mysql                          # MySQL CLI (host port 3307)
```

## MQTT

Devices publish telemetry to `composter/{hardware_id}/telemetry` and receive stir commands on `composter/{hardware_id}/cmd`. `hardware_id` is `esp32-` + the uppercase MAC without colons, e.g. `esp32-AABBCCDDEEFF`. See [docs/PLAN.md](docs/PLAN.md) for the full payload contract.
