const navItems = [
  { href: "#proof", label: "Proof" },
  { href: "#workflow", label: "Workflow" },
  { href: "#start", label: "Start" },
];

const githubRepoUrl = "https://github.com/garrettsiegel/stripe-ez";

type HeaderProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a className="brand" href="#top">
          <span>
            <span className="brand__title">Stripe EZ</span>
            <span className="brand__subtitle">Stripe setup orchestration</span>
          </span>
        </a>
        <nav aria-label="Primary" className="site-nav">
          <ul className="site-nav__links">
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
          <button
            aria-label={`Switch to ${nextTheme} theme`}
            aria-pressed={theme === "dark"}
            className="theme-toggle"
            onClick={onToggleTheme}
            type="button"
          >
            <span className="theme-toggle__dot" />
            <span>{theme === "dark" ? "Dark" : "Light"}</span>
          </button>
          <a className="button button--ghost" href={githubRepoUrl} rel="noreferrer" target="_blank">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
