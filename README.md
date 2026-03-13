# stripe-ez

Zero-friction Stripe setup CLI.

## Quick Start

```bash
npm install
npm run dev
```

## Safe Sharing Checklist

Before pushing to GitHub or sharing a zip/tarball, remove local generated files:

```bash
rm -f .env .stripe-ez.json stripe-config.json
```

Then regenerate locally when needed by running `npm run dev` again.

## Demo Credentials (Safe, Fake)

You can test non-live CLI behavior with included demo files:

```bash
cp .env.demo .env
cp .stripe-ez.demo.json .stripe-ez.json
npm run dev
npm run dev -- status
```

Or run the helper script:

```bash
zsh scripts/demo-smoke.sh
```

Note: Demo credentials are intentionally fake and will not authenticate with Stripe APIs.

## Commands

- `stripe-ez` (default guided flow)
- `stripe-ez init`
- `stripe-ez add-product`
- `stripe-ez status`
- `stripe-ez reset`

## Publish

```bash
npm run build
npm publish
```

After publishing, users can run:

```bash
npx stripe-ez
```
