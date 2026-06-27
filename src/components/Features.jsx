import { BarChart3, Camera, FileUp, QrCode, ShieldCheck, Users } from "lucide-react";

const features = [
  { icon: Users, title: "Employee accountability", text: "Every checkout, repair, upload, import, and change is connected to the person who did it." },
  { icon: FileUp, title: "CSV imports", text: "Bring in customers, assets, parts, and inventory without starting from scratch." },
  { icon: Camera, title: "Photo history", text: "Store rental, return, damage, inspection, and repair photos directly on asset records." },
  { icon: QrCode, title: "QR asset tags", text: "Generate printable asset tags so your team can scan equipment and open records instantly." },
  { icon: BarChart3, title: "Profitability reports", text: "See asset value, rental revenue, repair cost, lifetime profit, and fleet performance." },
  { icon: ShieldCheck, title: "Company workspaces", text: "Every company gets its own private workspace, employee roles, and clean data separation." },
];

export default function Features() {
  return (
    <section className="section">
      <div className="sectionHeader">
        <span>Why BC Digital</span>
        <h2>Less guessing. More control.</h2>
        <p>Stop digging through paper, texts, spreadsheets, and memory. BC Digital gives your team one place to track the work.</p>
      </div>

      <div className="featureGrid">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article className="featureCard" key={feature.title}>
              <Icon size={26} />
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
