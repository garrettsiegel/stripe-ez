const steps = [
  {
    title: "Authenticate with intent",
    body: "Select test or live mode, then connect through Stripe CLI login or manual key entry depending on team policy.",
  },
  {
    title: "Shape your revenue model",
    body: "Choose one-time, recurring, hybrid, or donation pricing so product configuration aligns with your release plan.",
  },
  {
    title: "Choose checkout behavior",
    body: "Use hosted checkout, payment links, or embedded flow and turn on optional webhooks, portal, and tax in the same run.",
  },
  {
    title: "Ship with generated assets",
    body: "Receive config files, environment values, and framework-specific snippets your team can commit, review, and deploy.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="workflow-heading" className="section" id="workflow">
      <div className="container">
        <div className="section-heading">
          <h2 id="workflow-heading">A compact workflow your team can repeat release after release.</h2>
          <p>
            The CLI keeps the surface area small, but the output complete. Start quickly, keep control,
            and avoid one-off setup decisions that break on the next project.
          </p>
        </div>
        <div className="workflow-grid">
          {steps.map((step, index) => (
            <article className="workflow-step" key={step.title}>
              <span className="workflow-step__number">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}