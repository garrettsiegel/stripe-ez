# stripe-ez

[![Socket Security](https://github.com/garrettsiegel/stripe-ez/actions/workflows/socket.yml/badge.svg)](https://github.com/garrettsiegel/stripe-ez/actions/workflows/socket.yml)

Zero-friction Stripe setup CLI.

`stripe-ez` walks you through Stripe setup and generates the files you need to start taking payments quickly.

## Links

- Website: https://stripe-ez.com
- Repository: https://github.com/garrettsiegel/stripe-ez

## What It Does

- Guides Stripe authentication (Stripe CLI login or manual API key)
- Creates products and prices for one-time payments, subscriptions, or donations
- Supports checkout modes: hosted checkout, payment links, or embedded flows
- Optionally configures webhooks, customer portal, and tax behavior
- Generates local config, public config, `.env`, and framework-specific starter snippets

## Prerequisites

- Node.js 18+
- A Stripe account

Stripe CLI is optional, but recommended for easiest auth and local webhook testing.

## Install And Run

For local development in this repo:

```bash
npm install
npm run dev
```

As a published CLI:

```bash
npx stripe-ez
```

## Website

This repo also includes the Stripe EZ marketing website.

Live site:

- https://stripe-ez.com

Run locally:

```bash
cd website
npm install
npm run dev
```

Website scripts:

```bash
npm run build      # type-check + production build
npm run preview    # preview production build locally
npm run typecheck  # TypeScript project check
```

## Commands

| Command | Description | Notes |
|---|---|---|
| `stripe-ez` | Default guided setup flow | Same behavior as `stripe-ez init` |
| `stripe-ez init` | Full guided setup flow | Supports `--no-banner` |
| `stripe-ez add-product` | Add product/prices to existing setup | Requires `STRIPE_SECRET_KEY` in env |
| `stripe-ez status` | Show local setup summary and optionally check Stripe connectivity | Set `STRIPE_SECRET_KEY` |
| `stripe-ez reset` | Remove local `.stripe-ez.json` | Does not delete Stripe resources |

Global option:

- `--no-banner` skips startup banner output

## Guided Setup Flow

When you run `stripe-ez` or `stripe-ez init`, the CLI walks through:

1. Stripe mode and auth
	- Choose `test` or `live` mode
	- Choose auth method:
	  - Stripe CLI login (recommended)
	  - Manual API key paste
2. Product model
	- One-time, subscription, both, or donation
3. Currency selection
	- USD always included
	- Optional: EUR, GBP, CAD, AUD, JPY
4. Checkout type
	- Hosted checkout
	- Payment links
	- Embedded flow
5. Optional setup
	- Webhooks
	- Customer portal
	- Tax behavior
6. Output generation choices
	- `.env` file
	- Framework snippet
	- Payment links (if selected)

If an existing setup file is found, you can choose to:

- `update` existing setup
- `replace` with a fresh setup
- `reuse` and skip Stripe changes

## Walkthrough With Examples

### Example 1: First-Time Setup (Recommended)

Run the guided flow:

```bash
npm run dev
```

Typical choices:

- Mode: `test`
- Auth: Stripe CLI login
- Use case: subscriptions
- Currencies: USD only
- Checkout: hosted
- Webhooks: yes
- Portal: yes
- Tax: automatic

Expected result:

- Stripe products/prices created
- Local config written
- `stripe-config.json` written
- Optional `.env` written
- Framework snippet printed to terminal

### Example 2: Add A Product Later

Set your key, then run add-product:

```bash
export STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
npm run dev -- add-product
```

Expected result:

- New product/price added in Stripe
- Local `.stripe-ez.json` updated

### Example 3: View Current Status

Local summary only:

```bash
npm run dev -- status
```

Summary plus connectivity check:

```bash
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY npm run dev -- status
```

Expected result:

- Prints current local setup summary
- If key is valid, prints connection check success

### Example 4: Local Webhook Testing

If your webhook URL is local (for example `http://localhost:3000/api/webhooks/stripe`), use Stripe CLI forwarding:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Then place the printed webhook secret in `.env` as `STRIPE_WEBHOOK_SECRET`.

### Example 5: Generate Payment Links

In setup, choose checkout type `payment_links`, then select the Payment Links output option.

Expected result:

- CLI prints a shareable URL for each created price

## Generated Files And Outputs

After setup, you can get:

1. `.stripe-ez.json` (private)
	- Full local setup state (account, mode, products/prices, checkout type, optional webhook/portal/tax settings)
2. `stripe-config.json` (safe to commit)
	- Public config for app usage
3. `.env` (private)
	- Includes keys like `STRIPE_SECRET_KEY`
	- Includes generated price ID env vars per product/price
	- Includes webhook, portal, and tax vars when configured
4. Framework snippet output
	- Next.js (App Router)
	- Next.js (Pages Router)
	- Express / Node.js
	- React
	- Vanilla HTML/JS
	- Raw API example
5. Payment link URLs (if selected)

## Development Scripts

```bash
npm run dev         # run CLI from src/
npm run build       # compile TypeScript to dist/
npm run typecheck   # tsc --noEmit
npm run lint        # same as typecheck in this project
npm test            # run test suite once
npm run test:watch  # run tests in watch mode
```

## Demo Mode (Safe, Fake Data)

This repo includes a fake local config for smoke checks.

```bash
cp .stripe-ez.demo.json .stripe-ez.json
npm run dev -- status
```

Or run:

```bash
zsh scripts/demo-smoke.sh
```

Note: demo data is intentionally fake and will not authenticate to real Stripe APIs.

## Safe Sharing Checklist

Before sharing or committing, remove generated local files with secrets:

```bash
rm -f .env .stripe-ez.json stripe-config.json
```

Regenerate later with:

```bash
npm run dev
```

## Publish

```bash
npm run build
npm publish
```

After publishing, users can run:

```bash
npx stripe-ez
```
