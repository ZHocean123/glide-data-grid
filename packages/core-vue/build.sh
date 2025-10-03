#!/bin/bash
set -em

rm -rf dist

vue-tsc --project tsconfig.build.json --declaration --emitDeclarationOnly

vite build --config vite.config.ts

echo -e "\033[0;36m🎉 Core Vue build complete 🎉\033[0m"
