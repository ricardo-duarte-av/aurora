#!/bin/bash

echo "==> Step 1: Cleaning..."
yarn ubrn:clean

echo "==> Step 2: Checking out..."
yarn ubrn:checkout

echo "==> Step 3: Fetching full git history for patch application..."
git -C rust_modules/matrix-rust-sdk fetch --unshallow

echo "==> Step 4: Applying patches..."
cd rust_modules/matrix-rust-sdk && git apply ../../patches/0001-Fix-uniffi-and-wasm-build.patch && git apply ../../patches/0001-Fix-wasm-default-features.patch && cd ../..
echo "    ✓ Patches applied successfully"

echo "==> Step 5: Removing bindings/wasm from Cargo.toml..."
sed -i.bak '/bindings\/wasm/d' rust_modules/matrix-rust-sdk/Cargo.toml

echo "==> Step 6: Building web (first pass, expected to fail)..."
yarn ubrn:web:build:release || true

echo "==> Step 7: Adding bindings/wasm back to Cargo.toml..."
sed -i.bak '/uniffi-bindgen/a\
    "bindings/wasm",
' rust_modules/matrix-rust-sdk/Cargo.toml

echo "==> Step 8: Building web (second pass, should succeed)..."
set -e
yarn ubrn:web:build:release

echo "==> Step 9: Fixing index.web.ts import..."
INDEX_FILE="/Users/davidlangley/dev/aurora/src/index.web.ts"
sed -i.bak -E "s/index_bg\\.wasm/index_bg.wasm?url/" "$INDEX_FILE"

echo "==> Step 10: Optimizing wasm binary with wasm-opt..."
WASM_FILE="/Users/davidlangley/dev/aurora/src/generated/wasm-bindgen/index_bg.wasm"
if [ -f "$WASM_FILE" ]; then
    echo "    Optimizing $WASM_FILE (this may take a few minutes)..."
    wasm-opt -Oz "$WASM_FILE" -o "${WASM_FILE}.tmp" && mv "${WASM_FILE}.tmp" "$WASM_FILE"
    echo "    ✓ wasm binary optimized"
else
    echo "    ⚠ wasm file not found at $WASM_FILE, skipping optimization"
fi

echo "==> ✓ All steps completed successfully!"
