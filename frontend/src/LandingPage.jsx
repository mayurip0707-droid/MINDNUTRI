
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const previewStates = [
  { balance: 89, sleep: 88, water: 2.0, glasses: 8, trend: 6 },
  { balance: 91, sleep: 85, water: 2.25, glasses: 9, trend: 7 },
  { balance: 86, sleep: 92, water: 1.75, glasses: 7, trend: 4 },
  { balance: 90, sleep: 89, water: 2.5, glasses: 10, trend: 8 },
  { balance: 88, sleep: 86, water: 2.0, glasses: 8, trend: 5 },
];

const features = [
  {
    icon: "☻",
    tag: "MENTAL BALANCE",
    title: "Mood Journal",
    description:
      "Record moods and reflect on emotional patterns with gentle guided prompts and calm reflections.",
    footer: "Reflective Journaling",
    route: "/mood-journal",
    color: "lavender",
  },
  {
    icon: "✣",
    tag: "EQUILIBRIUM",
    title: "Stress Analysis",
    description:
      "Understand stress-related patterns from available assessments and restorative breathing exercises.",
    footer: "Pattern Recognition",
    route: "/stress-assessment",
    color: "mint",
  },
  {
    icon: "☾",
    tag: "REST & RECOVERY",
    title: "Sleep Insights",
    description:
      "Explore sleep habits, wakeful consistency, and morning readiness trends across your days.",
    footer: "Rest Hygiene",
    route: "/sleep",
    color: "blue",
  },
  {
    icon: "♧",
    tag: "NOURISHMENT",
    title: "Nutrition Tracking",
    description:
      "Log meals and review nutritional intake with an emphasis on balance rather than restrictive counting.",
    footer: "Wholefood Focus",
    route: "/nutrition",
    color: "peach",
  },
  {
    icon: "♨",
    tag: "VITALITY",
    title: "Hydration Tracking",
    description:
      "Track daily water intake with visual milestones and personalized gentle hydration reminders.",
    footer: "Daily Flow",
    route: "/nutrition",
    color: "mint",
  },
  {
    icon: "⌁",
    tag: "HOLISTIC VIEW",
    title: "Wellness Analytics",
    description:
      "Explore correlations across available wellness records to discover your natural harmony.",
    footer: "Unified Harmony",
    route: "/wellness-analytics",
    color: "sage",
  },
];

function MiniTrend({ offset }) {
  const paths = [
    "M4 32 L24 28 L44 25 L64 22 L84 17 L104 14 L124 9",
    "M4 29 L24 31 L44 23 L64 25 L84 15 L104 18 L124 8",
    "M4 34 L24 27 L44 29 L64 18 L84 21 L104 12 L124 10",
    "M4 31 L24 24 L44 26 L64 19 L84 14 L104 16 L124 7",
    "M4 30 L24 27 L44 22 L64 25 L84 18 L104 11 L124 12",
  ];

  return (
    <svg
      className="mn-trend"
      viewBox="0 0 132 42"
      role="img"
      aria-label="Illustrative wellness trend"
    >
      <path
        d={paths[offset]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [previewIndex, setPreviewIndex] = useState(0);
  const preview = previewStates[previewIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPreviewIndex((current) => (current + 1) % previewStates.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  
    const openLogin = () =>
    navigate("/auth", { state: { authMode: "login" } });

    const openRegister = () =>
    navigate("/auth", { state: { authMode: "register" } });

  return (
    <div className="mn-landing">
      <header className="mn-navbar">
        <button
          className="mn-brand"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="MINDNUTRI Home"
        >
          <span className="mn-brand-icon">♧</span>
          <span className="mn-brand-copy">
            <strong>MINDNUTRI</strong>
            <small>WELLNESS COMPANION</small>
          </span>
        </button>

        <nav className="mn-nav-links">
          <a href="#features">Features</a>
          <a href="#preview">Interactive Preview</a>
        </nav>

        <div className="mn-nav-actions">
          <button className="mn-signin" onClick={openLogin}>
            Sign In
          </button>
          <button className="mn-primary mn-nav-cta" onClick={openRegister}>
            Get Started <span>→</span>
          </button>
        </div>
      </header>

      <main>
        <section className="mn-hero" id="preview">
          <div className="mn-hero-copy">
            <div className="mn-eyebrow">
              <span /> YOUR MIND. YOUR BODY. YOUR BALANCE.
            </div>

            <h1>
              Understand
              <br />
              yourself. <em>Live better.</em>
            </h1>

            <p className="mn-hero-description">
              MINDNUTRI brings mood journaling, stress insights, sleep,
              nutrition, hydration and wellness patterns together in one
              companion — guiding you toward mindful balance without guesswork
              or intrusive surveillance.
            </p>

            <div className="mn-hero-actions">
              <button className="mn-primary" onClick={openRegister}>
                Get Started <span>→</span>
              </button>
              <a className="mn-secondary" href="#features">
                Explore Features
              </a>
            </div>

            <div className="mn-trust-row">
              <span>♧ &nbsp;100% Private local processing</span>
              <span>✣ &nbsp;No external AI APIs</span>
              <span>♡ &nbsp;Zero personal data sold</span>
            </div>
          </div>

          <div className="mn-dashboard-wrap">
            <div className="mn-dashboard">
              <div className="mn-dashboard-header">
                <div className="mn-dashboard-brand">
                  <span className="mn-dot peach-dot" />
                  <span className="mn-dot lilac-dot" />
                  <span className="mn-dot green-dot" />
                  <span><h2>MINDNUTRI Companion</h2></span>
                </div>
                <span className="mn-today-pill">Today · Daily Balance</span>
              </div>

              <div className="mn-preview-grid">
                <article className="mn-preview-card balance-card">
                  <div className="mn-card-heading">
                    <span>WELLNESS BALANCE</span>
                    <span>✣</span>
                  </div>
                  <div className="mn-balance-content">
                    <div
                      className="mn-score-ring"
                      style={{
                        "--score-progress": `${preview.balance * 3.6}deg`,
                      }}
                    >
                      <div>
                        <strong>{preview.balance}</strong>
                        <small>/ 100</small>
                      </div>
                    </div>
                    <div className="mn-balance-text">
                      <strong>Holistic State</strong>
                      <p>Harmonious mind &amp; nutrition alignment</p>
                      <small>◉ Optimal equilibrium</small>
                    </div>
                  </div>
                </article>

                <article className="mn-preview-card sleep-card">
                  <div className="mn-card-heading">
                    <span>SLEEP RESTORATION</span>
                    <span className="mn-small-icon">☾</span>
                  </div>
                  <div className="mn-sleep-score">
                    <strong>{preview.sleep}%</strong>
                    <span>Rest quality</span>
                  </div>
                  <div className="mn-progress">
                    <span style={{ width: `${preview.sleep}%` }} />
                  </div>
                  <small>7h 45m restorative sleep</small>
                </article>

                <article className="mn-preview-card hydration-card">
                  <div className="mn-card-heading">
                    <span>HYDRATION INTAKE</span>
                    <span className="mn-small-icon">♨</span>
                  </div>
                  <div className="mn-water-score">
                    <strong>{preview.water.toFixed(2).replace(/0$/, "")} L</strong>
                    <span>· {preview.glasses} glasses</span>
                    <small>Target: 2.5 L</small>
                  </div>
                  <div className="mn-progress">
                    <span
                      style={{
                        width: `${Math.min((preview.water / 2.5) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mn-water-footer">
                    <small>
                      {Math.round((preview.water / 2.5) * 100)}% of daily target
                    </small>
                    <small>Keep sipping</small>
                  </div>
                </article>

                <article className="mn-preview-card mood-card">
                  <div className="mn-card-heading">
                    <span>MOOD JOURNAL</span>
                    <span className="mn-small-icon">☻</span>
                  </div>
                  <strong className="mn-mood-status">◉ Grounded &amp; Present</strong>
                  <p className="mn-mood-quote">
                    “Breathed the morning air, feeling steady and balanced.”
                  </p>
                  <div className="mn-mood-footer">
                    <small>Mindful reflection logged</small>
                    <small>Local private record</small>
                  </div>
                </article>

                <article className="mn-preview-card nutrition-card">
                  <div className="mn-card-heading">
                    <span>NUTRITION BALANCE</span>
                    <span className="mn-small-icon">♧</span>
                  </div>
                  <strong className="mn-food-title">Wholesome Breakfast</strong>
                  <p>Overnight oats with chia, walnuts &amp; blueberries</p>
                  <div className="mn-food-tags">
                    <span>Clean Wholefoods</span>
                    <small>· Balanced fuel</small>
                  </div>
                </article>

                <article className="mn-preview-card trend-card">
                  <div className="mn-card-heading">
                    <span>7-DAY TREND</span>
                    <span>↗ Steady Rise</span>
                  </div>
                  <MiniTrend offset={previewIndex} />
                  <div className="mn-trend-footer">
                    <small>Mon — Sun review</small>
                    <small>+{preview.trend} pts this week</small>
                  </div>
                </article>
              </div>
            </div>
            <div className="mn-hero-orb" />
          </div>
        </section>

        <section className="mn-features" id="features">
          <div className="mn-features-heading">
            <div className="mn-eyebrow">
              <span /> NURTURE EVERY PILLAR
            </div>
            <h2>
              Designed for genuine
              <br />
              balance, <em>not data overload.</em>
            </h2>
            <p>
              Explore the six core pillars inside MINDNUTRI. Each tool works
              quietly together to help you understand your rhythms without
              overwhelming you with noisy alerts.
            </p>
          </div>

          <div className="mn-feature-grid">
            {features.map((feature) => (
              <article className="mn-feature-card" key={feature.title}>
                <div className="mn-feature-top">
                  <span className={`mn-feature-icon ${feature.color}`}>
                    {feature.icon}
                  </span>
                  <span className="mn-feature-tag">{feature.tag}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="mn-feature-footer">
                  <span>{feature.footer}</span>
                  <button onClick={() => navigate(feature.route)}>
                    Learn more <span>↗</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
