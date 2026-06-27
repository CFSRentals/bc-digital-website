import { ArrowRight, CheckCircle, PlayCircle } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="heroGlow heroGlowOne" />
      <div className="heroGlow heroGlowTwo" />

      <div className="heroContent">
        <div className="eyebrow">Built from real-world workflows</div>
        <h1>Run your business.<span> We'll handle the paperwork.</span></h1>
        <p>
          Modern software for rental companies, contractors, repair shops,
          pressure washing businesses, decorative concrete installers, and service teams.
        </p>

        <div className="heroButtons">
          <a className="primaryButton" href="https://app.bcdigital.org">
            Start Free Trial <ArrowRight size={18} />
          </a>
          <a className="secondaryButton" href="#products">
            <PlayCircle size={18} /> Explore Products
          </a>
        </div>

        <div className="heroBenefits">
          <span><CheckCircle size={17} /> No credit card required</span>
          <span><CheckCircle size={17} /> Setup in minutes</span>
          <span><CheckCircle size={17} /> Built by people who use it</span>
        </div>
      </div>

      <div className="dashboardShell">
        <div className="windowDots"><i /><i /><i /></div>
        <div className="previewHeader">
          <div><span>BC Fleet</span><strong>Operations Dashboard</strong></div>
          <div className="livePill">Live Preview</div>
        </div>

        <div className="metricGrid">
          <Metric label="Fleet Value" value="$2.18M" />
          <Metric label="Assets Out" value="41" />
          <Metric label="Open Repairs" value="7" />
          <Metric label="Monthly Revenue" value="$94.6K" />
        </div>

        <div className="activityPanel">
          <div className="activityHeader">Recent Activity</div>
          <Activity title="Asset 0005 checked out" meta="Austin · Big Tex Storage · 8:14 AM" />
          <Activity title="Repair ticket completed" meta="Mike · Grinder L25E · 10:42 AM" />
          <Activity title="Return photos uploaded" meta="Sarah · Vacuum S36 · 2:11 PM" />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return <div className="metricCard"><span>{label}</span><strong>{value}</strong></div>;
}

function Activity({ title, meta }) {
  return <div className="activityItem"><strong>{title}</strong><span>{meta}</span></div>;
}
