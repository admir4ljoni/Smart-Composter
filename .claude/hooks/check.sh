#!/usr/bin/env bash
# Stop: run tests + types + lint when web/ changed. Exit 2 blocks Claude until fixed.
input=$(cat)
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -n "$(git status --porcelain web)" ] || exit 0
cd web || exit 0

if [ -z "$(docker compose ps -q --status running laravel.test 2>/dev/null)" ]; then
    echo "check.sh: Sail is not running, skipped tests/types/lint" >&2
    exit 0
fi

out=$({
    ./vendor/bin/sail artisan test --compact &&
        npm run --silent types:check &&
        npm run --silent check
} 2>&1) && exit 0

echo "$out" >&2
[ "$(echo "$input" | jq -r '.stop_hook_active')" = "true" ] && exit 0
exit 2
