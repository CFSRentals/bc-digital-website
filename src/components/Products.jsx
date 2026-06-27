import { Building2, ClipboardCheck, Home, Truck, Wrench } from "lucide-react";

const products = [
  { icon: Truck, name: "BC Fleet", status: "Live Product", text: "Rental fleet management, asset tracking, repairs, inspections, photos, employee logs, and profitability reports." },
  { icon: ClipboardCheck, name: "BC Service", status: "Coming Soon", text: "Service tickets, scheduling, field teams, job photos, customer updates, and recurring work." },
  { icon: Wrench, name: "BC Shop", status: "Coming Soon", text: "Repair shop software for tickets, parts, labor, customer history, and service records." },
  { icon: Building2, name: "BC Concrete", status: "Coming Soon", text: "Decorative concrete job tracking, materials, crews, photos, estimates, and project notes." },
  { icon: Home, name: "BC Home", status: "Coming Soon", text: "Home service scheduling, estimates, job tracking, customer management, and follow-ups." },
];

export default function Products() {
  return (
    <section className="section" id="products">
      <div className="sectionHeader">
        <span>Products</span>
        <h2>One platform. Multiple business tools.</h2>
        <p>BC Digital starts with BC Fleet and grows into a connected software suite for service businesses that need simple, powerful tools.</p>
      </div>

      <div className="productGrid">
        {products.map((product) => {
          const Icon = product.icon;
          return (
            <article className="productCard" key={product.name}>
              <div className="productIcon"><Icon size={28} /></div>
              <div className="productStatus">{product.status}</div>
              <h3>{product.name}</h3>
              <p>{product.text}</p>
              <a href="#pricing">{product.name === "BC Fleet" ? "Start Trial" : "Join Waitlist"}</a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
