import { Check } from "lucide-react";

const plans = [
  { name: "Free Trial", price: "$0", text: "Try BC Fleet with no credit card required.", features: ["30-day trial", "Up to 25 assets", "Customers", "CSV imports"] },
  { name: "Basic", price: "$29", text: "For small businesses getting organized.", features: ["Up to 250 assets", "Customers", "Repairs", "Photo uploads", "Employee accounts"] },
  { name: "Professional", price: "$59", text: "For active rental and service companies.", features: ["Unlimited assets", "Audit log", "Reports", "QR asset tags", "Custom branding"], featured: true },
  { name: "Business", price: "$99", text: "For larger teams that need more control.", features: ["Multiple locations", "Advanced roles", "Priority support", "Customer portal", "Future AI tools"] },
];

export default function Pricing() {
  return (
    <section className="section" id="pricing">
      <div className="sectionHeader">
        <span>Pricing</span>
        <h2>Start free. Upgrade when it makes sense.</h2>
        <p>Start with a 30-day free trial. No credit card. No sales call. No waiting on a demo.</p>
      </div>

      <div className="pricingGrid">
        {plans.map((plan) => (
          <article className={plan.featured ? "priceCard featured" : "priceCard"} key={plan.name}>
            <h3>{plan.name}</h3>
            <div className="price">{plan.price}<span>{plan.price === "$0" ? "" : "/mo"}</span></div>
            <p>{plan.text}</p>
            <ul>{plan.features.map((feature) => <li key={feature}><Check size={16} /> {feature}</li>)}</ul>
            <a href="https://app.bcdigital.org">{plan.price === "$0" ? "Start Free Trial" : "Choose Plan"}</a>
          </article>
        ))}
      </div>
    </section>
  );
}
