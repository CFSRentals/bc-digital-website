import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const emptyForm = {
    name: "",
    company: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", userData.user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!membership) {
      setLoading(false);
      return;
    }

    setCompanyId(membership.company_id);

    const { data, error } = await supabase
      .from("fleet_customers")
      .select("*")
      .eq("company_id", membership.company_id)
      .order("created_at", { ascending: false });

    if (!error) setCustomers(data || []);

    setLoading(false);
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchText = `${customer.name || ""} ${customer.company || ""} ${
        customer.phone || ""
      } ${customer.email || ""}`.toLowerCase();

      return searchText.includes(search.toLowerCase());
    });
  }, [customers, search]);

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAddPanel() {
    setEditingCustomer(null);
    setForm(emptyForm);
    setPanelOpen(true);
  }

  function openEditPanel(customer) {
    setSelectedCustomer(null);
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      company: customer.company || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setPanelOpen(true);
  }

  async function saveCustomer(e) {
    e.preventDefault();

    if (!form.name || !companyId) return;

    const payload = {
      company_id: companyId,
      name: form.name,
      company: form.company,
      phone: form.phone,
      email: form.email,
      address: form.address,
      notes: form.notes,
    };

    let error;

    if (editingCustomer) {
      const result = await supabase
        .from("fleet_customers")
        .update(payload)
        .eq("id", editingCustomer.id)
        .eq("company_id", companyId);

      error = result.error;
    } else {
      const result = await supabase.from("fleet_customers").insert(payload);
      error = result.error;
    }

    if (error) {
      alert(error.message);
      return;
    }

    setForm(emptyForm);
    setEditingCustomer(null);
    setPanelOpen(false);
    await loadCustomers();
  }

  async function deleteCustomer(customer) {
    const confirmed = window.confirm(
      `Delete ${customer.name}? This cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("fleet_customers")
      .delete()
      .eq("id", customer.id)
      .eq("company_id", companyId);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedCustomer(null);
    setEditingCustomer(null);
    setPanelOpen(false);
    await loadCustomers();
  }

  return (
    <div className="assetsPage">
      <section className="assetsHeader">
        <div>
          <span>BC Fleet</span>
          <h1>Customers</h1>
          <p>Add, search, edit, and manage rental customers.</p>
        </div>

        <button onClick={openAddPanel}>+ Add Customer</button>
      </section>

      <section className="assetToolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, phone, or email..."
        />
      </section>

      <section className="assetTableCard">
        <div className="assetTableTop">
          <div>
            <h2>Customer List</h2>
            <p>
              {filteredCustomers.length} customer
              {filteredCustomers.length === 1 ? "" : "s"} shown
            </p>
          </div>
        </div>

        {loading ? (
          <p className="emptyState">Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="emptyState">
            No customers found. Click <strong>+ Add Customer</strong> to create
            your first one.
          </p>
        ) : (
          <div className="assetTableWrap">
            <table className="assetTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="clickableRow"
                  >
                    <td>
                      <strong>{customer.name}</strong>
                    </td>
                    <td>{customer.company || "-"}</td>
                    <td>{customer.phone || "-"}</td>
                    <td>{customer.email || "-"}</td>
                    <td>{customer.address || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedCustomer && (
        <div className="assetPanelOverlay">
          <aside className="assetPanel">
            <div className="assetPanelHeader">
              <div>
                <span>Customer Profile</span>
                <h2>{selectedCustomer.name}</h2>
              </div>

              <button onClick={() => setSelectedCustomer(null)}>×</button>
            </div>

            <div className="assetDetailGrid">
              <Detail label="Name" value={selectedCustomer.name} />
              <Detail label="Company" value={selectedCustomer.company || "-"} />
              <Detail label="Phone" value={selectedCustomer.phone || "-"} />
              <Detail label="Email" value={selectedCustomer.email || "-"} />
              <Detail label="Address" value={selectedCustomer.address || "-"} />
              <Detail label="Notes" value={selectedCustomer.notes || "-"} />
            </div>

            <div className="assetActionGrid">
              <button onClick={() => openEditPanel(selectedCustomer)}>
                Edit Customer
              </button>
              <button>New Rental</button>
              <button>View Rentals</button>
              <button className="dangerButton" onClick={() => deleteCustomer(selectedCustomer)}>
                Delete
              </button>
            </div>

            <div className="assetTimeline">
              <h3>Customer Timeline</h3>
              <p>Customer created.</p>
              <p>Rental history, invoices, notes, and activity will show here next.</p>
            </div>
          </aside>
        </div>
      )}

      {panelOpen && (
        <div className="assetPanelOverlay">
          <aside className="assetPanel">
            <div className="assetPanelHeader">
              <div>
                <span>{editingCustomer ? "Edit Customer" : "New Customer"}</span>
                <h2>{editingCustomer ? editingCustomer.name : "Add Customer"}</h2>
              </div>

              <button
                onClick={() => {
                  setPanelOpen(false);
                  setEditingCustomer(null);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveCustomer} className="assetForm">
              <label>
                Customer Name
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="John Smith"
                  required
                />
              </label>

              <label>
                Company
                <input
                  value={form.company}
                  onChange={(e) => updateForm("company", e.target.value)}
                  placeholder="ABC Concrete"
                />
              </label>

              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  placeholder="555-555-5555"
                />
              </label>

              <label>
                Email
                <input
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  placeholder="customer@email.com"
                  type="email"
                />
              </label>

              <label>
                Address
                <input
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  placeholder="Street, city, state"
                />
              </label>

              <label>
                Notes
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  placeholder="Billing notes, jobsite notes, preferences..."
                />
              </label>

              <div className="assetPanelActions">
                {editingCustomer && (
                  <button
                    type="button"
                    className="dangerButton"
                    onClick={() => deleteCustomer(editingCustomer)}
                  >
                    Delete
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPanelOpen(false);
                    setEditingCustomer(null);
                  }}
                >
                  Cancel
                </button>

                <button type="submit">
                  {editingCustomer ? "Save Changes" : "Save Customer"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}