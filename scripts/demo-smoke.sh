#!/usr/bin/env zsh
set -euo pipefail

cp .stripe-ez.demo.json .stripe-ez.json

echo "Running guided flow startup against demo config..."
npm run dev -- --help

echo "\nRunning status against demo config (no live Stripe check)..."
npm run dev -- status

echo "\nDemo smoke run complete."
