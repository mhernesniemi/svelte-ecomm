#!/bin/bash
# Run svelte-check without breaking the Vite dev server.
#
# svelte-check internally runs svelte-kit sync, which rewrites 150+ files
# in .svelte-kit/generated/. Vite watches that directory and triggers a
# full HMR cascade that crashes the browser. This wrapper snapshots the
# directory before the check and restores it after, so Vite never notices.

GENERATED_DIR=".svelte-kit/generated"
BACKUP_DIR=$(mktemp -d)

# Snapshot the generated dir (preserving timestamps)
if [ -d "$GENERATED_DIR" ]; then
  cp -a "$GENERATED_DIR" "$BACKUP_DIR/generated"
fi

# Run svelte-check, passing through all arguments
./node_modules/.bin/svelte-check "$@"
EXIT_CODE=$?

# Restore the generated dir so Vite's watcher doesn't trigger
if [ -d "$BACKUP_DIR/generated" ]; then
  rm -rf "$GENERATED_DIR"
  mv "$BACKUP_DIR/generated" "$GENERATED_DIR"
fi

rm -rf "$BACKUP_DIR"
exit $EXIT_CODE
