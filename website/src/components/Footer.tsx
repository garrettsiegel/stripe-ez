const githubRepoUrl = "https://github.com/garrettsiegel/stripe-ez";

export function Footer() {
  return (
    <footer className="section cta" id="start">
      <div className="container cta__panel">
        <p className="cta__eyebrow">Stripe EZ for teams that ship weekly</p>
        <h2>Turn Stripe setup into a repeatable launch ritual.</h2>
        <p>
          Run the guided flow, commit what is safe, keep secrets local, and hand off a setup your next
          teammate can understand in minutes.
        </p>
        <div className="cta__actions">
          <a className="button button--primary" href={githubRepoUrl} target="_blank" rel="noreferrer">
            Open GitHub
          </a>
          <a className="button button--secondary" href="#top">
            Back to top
          </a>
        </div>
        <div className="cta__meta">
          <span>MIT licensed</span>
          <span>TypeScript CLI</span>
          <span>Built for fast auth and local webhook testing</span>
        </div>
      </div>
    </footer>
  );
}
