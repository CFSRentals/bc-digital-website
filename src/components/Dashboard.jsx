import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import DashboardHome from "./dashboard/DashboardHome.jsx";
import BCFleet from "./dashboard/BCFleet.jsx";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState("fleet");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    setUser(data.user);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="dashboardLoading">
        <h2>Loading BC Digital...</h2>
      </div>
    );
  }

  return (
    <div className="dashboardPage">
      <aside className="dashboardSidebar">
        <div className="sidebarTop">
          <div className="brandMark">BC</div>
          <div>
            <h2>BC Digital</h2>
            <p>Business Operating System</p>
          </div>
        </div>

        <nav className="sideNav">
          <button
            className={activeModule === "dashboard" ? "active" : ""}
            onClick={() => setActiveModule("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={activeModule === "fleet" ? "active" : ""}
            onClick={() => setActiveModule("fleet")}
          >
            BC Fleet
          </button>

          <button>BC Service</button>
          <button>Customers</button>
          <button>Inventory</button>
          <button>Billing</button>
          <button>Settings</button>
        </nav>

        <div className="sidebarUser">
          <p>{user?.email}</p>
          <button onClick={logout}>Log Out</button>
        </div>
      </aside>

      <main className="dashboardMain">
        {activeModule === "dashboard" && <DashboardHome user={user} />}
        {activeModule === "fleet" && <BCFleet />}
      </main>
    </div>
  );
}