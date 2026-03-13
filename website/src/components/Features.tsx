const features = [
  {
    title: "One guided flow, no setup drift",
    body: "Authentication, product strategy, checkout path, and optional webhook or tax decisions stay in one deliberate sequence.",
  },
  {
    title: "Output that survives handoff",
    body: "Generate the files teams actually need: local state, commit-safe config, environment values, and framework snippets.",
  },
  {
    title: "Designed for iteration",
    body: "Use focused commands for add-product, status, and reset when requirements shift after launch.",
  },
];

export function Features() {
  return (
    <section aria-labelledby="proof-heading" className="section" id="proof">
      <div className="container">
        <div className="section-heading">
          <h2 id="proof-heading">Move from first prompt to deploy-ready Stripe wiring without context switching.</h2>
          <p>
            Stripe EZ was built for teams who want confidence, not dashboard archaeology. Every run gives
            you a documented, repeatable setup path.
          </p>
        </div>
        <div className="proof-grid">
          {features.map((feature, index) => (
            <article className="proof-card" key={feature.title}>
              <span className="proof-card__number">0{index + 1}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}