#!/usr/bin/env bash
# PreToolUse hook: block access to secret files
# Reads JSON from stdin with tool_name and tool_input fields

input=$(cat)
tool_name=$(echo "$input" | grep -o '"tool_name":"[^"]*"' | head -1 | cut -d'"' -f4)

# Only check file-accessing tools
case "$tool_name" in
  Read|Edit|Write) ;;
  *) exit 0 ;;
esac

# Extract file path from input
file_path=$(echo "$input" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4)

# Check against blocked patterns
case "$file_path" in
  *.env|*.env.*|*/.env|*/.env.*)
    echo "BLOCKED: Access to environment file: $file_path"
    exit 2 ;;
  *.pem)
    echo "BLOCKED: Access to PEM file: $file_path"
    exit 2 ;;
  *credentials*|*secrets*)
    echo "BLOCKED: Access to credentials/secrets file: $file_path"
    exit 2 ;;
esac

exit 0
