import { CodeBlock } from "./CodeBlock";

const terminalLines = [
  { prompt: "$", text: "npx stripe-ez init --no-banner" },
  { prompt: "?", text: "Mode: test" },
  { prompt: "?", text: "Auth: Stripe CLI login" },
  { prompt: "?", text: "Workflow: subscriptions + hosted checkout" },
  { prompt: "→", text: "Generated: .stripe-ez.json, stripe-config.json, .env" },
];

export function Hero() {
  return (
    <section className="section hero" id="top">
      <div className="container hero__layout">
        <div className="hero__content">
          <span className="eyebrow">Built for fast shipping teams</span>
          <h1>
            Stripe setup that reads like an
            <span className="hero__headline-em"> execution plan</span>.
          </h1>
          <p>
            Stripe EZ replaces setup guesswork with a guided CLI flow that creates products, pricing,
            checkout, and optional webhooks in one pass, then hands your team production-ready output.
          </p>
          <CodeBlock code="npx stripe-ez" copyable={true} label="Run the CLI" />
          <div className="hero__actions">
            <a className="button button--primary" href="#start">
              Start setup
            </a>
            <a className="button button--secondary" href="#proof">
              See proof
            </a>
          </div>
          <div aria-label="Prerequisites" className="hero__meta">
            <span className="tag">Node.js 18+</span>
            <span className="tag">Test + live mode</span>
            <span className="tag">Framework output included</span>
          </div>
        </div>

        <div className="hero__panel" aria-hidden="true">
          <div className="terminal">
            <div className="terminal__topbar">
              <span className="terminal__dot terminal__dot--red" />
              <span className="terminal__dot terminal__dot--amber" />
              <span className="terminal__dot terminal__dot--green" />
            </div>
            <div className="terminal__body">
              <span className="terminal__badge">Guided setup flow</span>
              {terminalLines.map((line) => (
                <div className="terminal__line" key={line.text}>
                  <span className="terminal__prompt">{line.prompt}</span>
                  <span>{line.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero__stats">
            <div>
              <strong>5 min</strong>
              <span>Typical first setup</span>
            </div>
            <div>
              <strong>6</strong>
              <span>Framework outputs</span>
            </div>
            <div>
              <strong>1 flow</strong>
              <span>Auth to webhook readiness</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}