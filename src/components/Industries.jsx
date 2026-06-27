const industries = ["Equipment Rental", "Construction", "Auto Repair", "Pressure Washing", "Decorative Concrete", "Home Services"];

export default function Industries() {
  return (
    <section className="section compact" id="industries">
      <div className="sectionHeader">
        <span>Industries</span>
        <h2>Built for the businesses that keep work moving.</h2>
        <p>Whether you rent equipment, repair vehicles, manage crews, or run service jobs, BC Digital is designed around real daily operations.</p>
      </div>

      <div className="industryGrid">
        {industries.map((industry) => (
          <div className="industryCard" key={industry}>
            <strong>{industry}</strong>
            <span>Workflows, customers, assets, photos, and reporting.</span>
          </div>
        ))}
      </div>
    </section>
  );
}
