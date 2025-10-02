#!/bin/bash
set -em

rm -rf dist

# Build ESM bundle with type declarations
TS_NODE_COMPILER_OPTIONS="" tsc -p tsconfig.esm.json

# Build CJS bundle without re-emitting declarations
TS_NODE_COMPILER_OPTIONS="" tsc -p tsconfig.cjs.json

echo -e "\033[0;36m🎉 Shared Build Complete 🎉\033[0m"
