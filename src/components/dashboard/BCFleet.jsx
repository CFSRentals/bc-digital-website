import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import Assets from "./Assets";
import Customers from "./Customers";
import Rentals from "./Rentals";
import Repairs from "./Repairs";

export default function BCFleet() {
  const [fleetPage, setFleetPage] = useState("overview");

  const [stats, setStats] = useState({
    assets: 0,
    available: 0,
    rented: 0,
    repairs: 0,
    customers: 0,
    openRentals: 0,
  });

  useEffect(() => {
    if (fleetPage === "overview") {
      loadDashboard();
    }
  }, [fleetPage]);

  async function loadDashboard() {
    const { data: userData } = await supabase.auth.getUser();

    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", userData.user.id)
      .eq("status", "active")
      .single();

    if (!membership) return;

    const companyId = membership.company_id;

    const [
      assetsResult,
      customersResult,
      rentalsResult,
      repairsResult,
    ] = await Promise.all([
      supabase
        .from("fleet_assets")
        .select("status")
        .eq("company_id", companyId),

      supabase
        .from("fleet_customers")
        .select("id")
        .eq("company_id", companyId),

      supabase
        .from("fleet_rentals")
        .select("status")
        .eq("company_id", companyId),

      supabase
        .from("fleet_repairs")
        .select("status")
        .eq("company_id", companyId),
    ]);

    const assets = assetsResult.data || [];
    const rentals = rentalsResult.data || [];
    const repairs = repairsResult.data || [];

    setStats({
      assets: assets.length,

      available: assets.filter(
        (a) => a.status === "Available"
      ).length,

      rented: assets.filter(
        (a) => a.status === "Rented"
      ).length,

      repairs: repairs.filter(
        (r) => r.status !== "Completed"
      ).length,

      customers: customersResult.data?.length || 0,

      openRentals: rentals.filter(
        (r) => r.status === "Open"
      ).length,
    });
  }

  return (
    <div className="modulePage">

      <div className="fleetNav">

        <button
          className={fleetPage === "overview" ? "active" : ""}
          onClick={() => setFleetPage("overview")}
        >
          Dashboard
        </button>

        <button
          className={fleetPage === "assets" ? "active" : ""}
          onClick={() => setFleetPage("assets")}
        >
          Assets
        </button>

        <button
          className={fleetPage === "customers" ? "active" : ""}
          onClick={() => setFleetPage("customers")}
        >
          Customers
        </button>

        <button
          className={fleetPage === "rentals" ? "active" : ""}
          onClick={() => setFleetPage("rentals")}
        >
          Rentals
        </button>

        <button
          className={fleetPage === "repairs" ? "active" : ""}
          onClick={() => setFleetPage("repairs")}
        >
          Repairs
        </button>

        <button>Reservations</button>

      </div>

      {fleetPage === "overview" && (

        <>

          <section className="moduleHero">

            <div>

              <span>BC Fleet</span>

              <h1>Operations Dashboard</h1>

              <p>
                Everything happening in your rental business,
                all in one place.
              </p>

            </div>

          </section>

          <section className="dashboardStats">

            <div className="statCard">
              <h3>Total Assets</h3>
              <strong>{stats.assets}</strong>
            </div>

            <div className="statCard green">
              <h3>Available</h3>
              <strong>{stats.available}</strong>
            </div>

            <div className="statCard blue">
              <h3>Currently Rented</h3>
              <strong>{stats.rented}</strong>
            </div>

            <div className="statCard orange">
              <h3>Open Repairs</h3>
              <strong>{stats.repairs}</strong>
            </div>

            <div className="statCard purple">
              <h3>Customers</h3>
              <strong>{stats.customers}</strong>
            </div>

            <div className="statCard red">
              <h3>Open Rentals</h3>
              <strong>{stats.openRentals}</strong>
            </div>

          </section>

          <section className="quickActions">

            <button onClick={() => setFleetPage("rentals")}>
              ➕ New Rental
            </button>

            <button onClick={() => setFleetPage("repairs")}>
              🔧 New Repair
            </button>

            <button onClick={() => setFleetPage("customers")}>
              👤 Add Customer
            </button>

            <button onClick={() => setFleetPage("assets")}>
              🚜 Add Asset
            </button>

          </section>

          <section className="comingSoonCard">

            <h2>Today's Activity</h2>

            <p>
              Tomorrow we're replacing this section with:
            </p>

            <ul>

              <li>Today's Pickups</li>

              <li>Today's Returns</li>

              <li>Reservations</li>

              <li>Open Repairs</li>

              <li>Overdue Rentals</li>

              <li>Equipment Waiting on Parts</li>

            </ul>

          </section>

        </>

      )}

      {fleetPage === "assets" && <Assets />}

      {fleetPage === "customers" && <Customers />}

      {fleetPage === "rentals" && <Rentals />}

      {fleetPage === "repairs" && <Repairs />}

    </div>
  );
}