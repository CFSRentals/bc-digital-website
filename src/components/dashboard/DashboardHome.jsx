export default function DashboardHome({ user }) {
  return (
    <div className="dashHome">
      <section className="dashHero">
        <div>
          <span>BC Digital Workspace</span>
          <h1>Good evening, Austin 👋</h1>
          <p>
            Your workspace is active. Start setting up BC Fleet, invite your
            team, and begin building your business operating system.
          </p>
        </div>

        <button>Start Setup</button>
      </section>

      <section className="dashStats">
        <div>
          <span>Active Products</span>
          <strong>1</strong>
          <p>BC Fleet enabled</p>
        </div>

        <div>
          <span>Team Members</span>
          <strong>1</strong>
          <p>Owner account</p>
        </div>

        <div>
          <span>Trial Status</span>
          <strong>30</strong>
          <p>Days remaining</p>
        </div>

        <div>
          <span>Setup Progress</span>
          <strong>25%</strong>
          <p>Workspace started</p>
        </div>
      </section>

      <section className="dashSection">
        <div className="dashSectionHeader">
          <div>
            <span>Your Apps</span>
            <h2>Launch the tools your business needs.</h2>
          </div>
        </div>

        <div className="dashProductGrid">
          <ProductCard
            title="BC Fleet"
            label="Ready"
            text="Rental management, assets, repairs, photos, inspections, and fleet profitability."
          />

          <ProductCard
            title="BC Service"
            label="Coming Soon"
            text="Work orders, scheduling, job photos, field teams, and customer updates."
          />

          <ProductCard
            title="Customers"
            label="Setup"
            text="Import customers and connect them across every BC Digital product."
          />

          <ProductCard
            title="Inventory"
            label="Setup"
            text="Track parts, costs, quantities, and usage across your operation."
          />
        </div>
      </section>

      <section className="dashSection">
        <div className="dashSectionHeader">
          <div>
            <span>Recent Activity</span>
            <h2>Workspace timeline</h2>
          </div>
        </div>

        <div className="activityList">
          <Activity text="Workspace created successfully." />
          <Activity text="Owner account connected." />
          <Activity text="BC Fleet trial started." />
        </div>
      </section>
    </div>
  );
}

function ProductCard({ title, label, text }) {
  return (
    <article className="dashProductCard">
      <div>
        <h3>{title}</h3>
        <span>{label}</span>
      </div>
      <p>{text}</p>
      <button>Open</button>
    </article>
  );
}

function Activity({ text }) {
  return (
    <div className="activityRow">
      <span />
      <p>{text}</p>
    </div>
  );
}