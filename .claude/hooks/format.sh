#!/usr/bin/env bash
# PostToolUse: format the edited file. Never blocks.
file=$(jq -r '.tool_input.file_path // empty')
root="$CLAUDE_PROJECT_DIR/web"
[[ "$file" == "$root"/* ]] || exit 0
rel="${file#"$root"/}"
cd "$root" || exit 0

case "$rel" in
    vendor/* | node_modules/*) ;;
    *.php)
        docker compose exec -T laravel.test ./vendor/bin/pint "$rel" >/dev/null 2>&1
        ;;
    resources/*.ts | resources/*.tsx)
        npx vp fmt "$rel" >/dev/null 2>&1
        ;;
esac
exit 0
