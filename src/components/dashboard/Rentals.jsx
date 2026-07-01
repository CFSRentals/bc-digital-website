import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function Rentals() {
  const [companyId, setCompanyId] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");
  const [assetSearch, setAssetSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    customer_id: "",
    selected_asset_ids: [],
    checkout_date: todayDate(),
    due_date: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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

    const [{ data: rentalData }, { data: customerData }, { data: assetData }] =
      await Promise.all([
        supabase
          .from("fleet_rentals")
          .select("*")
          .eq("company_id", membership.company_id)
          .order("created_at", { ascending: false }),

        supabase
          .from("fleet_customers")
          .select("*")
          .eq("company_id", membership.company_id)
          .order("name", { ascending: true }),

        supabase
          .from("fleet_assets")
          .select("*")
          .eq("company_id", membership.company_id)
          .order("asset_tag", { ascending: true }),
      ]);

    setRentals(rentalData || []);
    setCustomers(customerData || []);
    setAssets(assetData || []);
    setLoading(false);
  }

  const availableAssets = assets.filter((asset) => asset.status === "Available");

  const searchedAvailableAssets = useMemo(() => {
    return availableAssets.filter((asset) => {
      const text = `${asset.asset_tag || ""} ${asset.name || ""} ${
        asset.category || ""
      } ${asset.asset_type || ""}`.toLowerCase();

      return text.includes(assetSearch.toLowerCase());
    });
  }, [availableAssets, assetSearch]);

  const selectedAssets = useMemo(() => {
    return assets.filter((asset) => form.selected_asset_ids.includes(asset.id));
  }, [assets, form.selected_asset_ids]);

  const filteredRentals = useMemo(() => {
    return rentals.filter((rental) => {
      const text = `${rental.customer_name || ""} ${rental.asset_tag || ""} ${
        rental.asset_name || ""
      } ${rental.status || ""}`.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [rentals, search]);

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleAsset(assetId) {
    setForm((current) => {
      const alreadySelected = current.selected_asset_ids.includes(assetId);

      return {
        ...current,
        selected_asset_ids: alreadySelected
          ? current.selected_asset_ids.filter((id) => id !== assetId)
          : [...current.selected_asset_ids, assetId],
      };
    });
  }

  async function createRental(e) {
    e.preventDefault();

    if (
      !companyId ||
      !form.customer_id ||
      form.selected_asset_ids.length === 0 ||
      !form.checkout_date ||
      !form.due_date
    ) {
      return;
    }

    const customer = customers.find((item) => item.id === form.customer_id);
    const rentalAssets = assets.filter((item) =>
      form.selected_asset_ids.includes(item.id)
    );

    if (!customer || rentalAssets.length === 0) return;

    const rentalPayload = rentalAssets.map((asset) => ({
      company_id: companyId,
      customer_id: customer.id,
      asset_id: asset.id,
      customer_name: customer.company || customer.name,
      asset_tag: asset.asset_tag,
      asset_name: asset.name,
      checkout_date: form.checkout_date,
      due_date: form.due_date,
      status: "Open",
      notes: form.notes,
    }));

    const { error: rentalError } = await supabase
      .from("fleet_rentals")
      .insert(rentalPayload);

    if (rentalError) {
      alert(rentalError.message);
      return;
    }

    const { error: assetError } = await supabase
      .from("fleet_assets")
      .update({
        status: "Rented",
        current_customer: customer.company || customer.name,
        due_back: form.due_date,
      })
      .in("id", form.selected_asset_ids)
      .eq("company_id", companyId);

    if (assetError) {
      alert(assetError.message);
      return;
    }

    setForm({
      customer_id: "",
      selected_asset_ids: [],
      checkout_date: todayDate(),
      due_date: "",
      notes: "",
    });

    setAssetSearch("");
    setPanelOpen(false);
    await loadData();
  }

  async function returnRental(rental) {
    const confirmed = window.confirm(
      `Return ${rental.asset_tag} - ${rental.asset_name}?`
    );

    if (!confirmed) return;

    const today = todayDate();

    const { error: rentalError } = await supabase
      .from("fleet_rentals")
      .update({
        status: "Returned",
        return_date: today,
      })
      .eq("id", rental.id)
      .eq("company_id", companyId);

    if (rentalError) {
      alert(rentalError.message);
      return;
    }

    if (rental.asset_id) {
      const { error: assetError } = await supabase
        .from("fleet_assets")
        .update({
          status: "Available",
          current_customer: "",
          due_back: null,
        })
        .eq("id", rental.asset_id)
        .eq("company_id", companyId);

      if (assetError) {
        alert(assetError.message);
        return;
      }
    }

    await loadData();
  }

  function openRentalPanel() {
    setForm({
      customer_id: "",
      selected_asset_ids: [],
      checkout_date: todayDate(),
      due_date: "",
      notes: "",
    });

    setAssetSearch("");
    setPanelOpen(true);
  }

  return (
    <div className="assetsPage">
      <section className="assetsHeader">
        <div>
          <span>BC Fleet</span>
          <h1>Rentals</h1>
          <p>
            Check out one or multiple assets, search equipment by tag or name,
            and return assets when they come back.
          </p>
        </div>

        <button onClick={openRentalPanel}>+ New Rental</button>
      </section>

      <section className="assetToolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rentals by customer, asset, or status..."
        />
      </section>

      <section className="assetTableCard">
        <div className="assetTableTop">
          <div>
            <h2>Rental Activity</h2>
            <p>
              {filteredRentals.length} rental
              {filteredRentals.length === 1 ? "" : "s"} shown
            </p>
          </div>
        </div>

        {loading ? (
          <p className="emptyState">Loading rentals...</p>
        ) : filteredRentals.length === 0 ? (
          <p className="emptyState">
            No rentals yet. Click <strong>+ New Rental</strong> to check out an
            asset.
          </p>
        ) : (
          <div className="assetTableWrap">
            <table className="assetTable">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Asset</th>
                  <th>Status</th>
                  <th>Checked Out</th>
                  <th>Due</th>
                  <th>Returned</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRentals.map((rental) => (
                  <tr key={rental.id}>
                    <td>
                      <strong>{rental.customer_name}</strong>
                    </td>
                    <td>
                      {rental.asset_tag} — {rental.asset_name}
                    </td>
                    <td>
                      <span className={`statusBadge ${rental.status}`}>
                        {rental.status}
                      </span>
                    </td>
                    <td>{rental.checkout_date || "-"}</td>
                    <td>{rental.due_date || "-"}</td>
                    <td>{rental.return_date || "-"}</td>
                    <td>
                      {rental.status === "Open" ? (
                        <button
                          className="tableButton"
                          onClick={() => returnRental(rental)}
                        >
                          Return
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {panelOpen && (
        <div className="assetPanelOverlay">
          <aside className="assetPanel">
            <div className="assetPanelHeader">
              <div>
                <span>New Rental</span>
                <h2>Check Out Assets</h2>
              </div>

              <button onClick={() => setPanelOpen(false)}>×</button>
            </div>

            <form onSubmit={createRental} className="assetForm">
              <label>
                Customer
                <select
                  value={form.customer_id}
                  onChange={(e) => updateForm("customer_id", e.target.value)}
                  required
                >
                  <option value="">Select customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company || customer.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Search Assets
                <input
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder="Search asset tag, Lavina GE, GEB, grinder..."
                />
              </label>

              <div className="rentalAssetPicker">
                {searchedAvailableAssets.length === 0 ? (
                  <p>No available assets match that search.</p>
                ) : (
                  searchedAvailableAssets.map((asset) => {
                    const checked = form.selected_asset_ids.includes(asset.id);

                    return (
                      <button
                        type="button"
                        key={asset.id}
                        className={
                          checked
                            ? "rentalAssetOption selected"
                            : "rentalAssetOption"
                        }
                        onClick={() => toggleAsset(asset.id)}
                      >
                        <span>
                          <strong>{asset.asset_tag}</strong>
                          {asset.name}
                        </span>

                        <small>{asset.category || asset.asset_type || "Asset"}</small>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedAssets.length > 0 && (
                <div className="selectedRentalAssets">
                  <strong>{selectedAssets.length} selected</strong>
                  {selectedAssets.map((asset) => (
                    <span key={asset.id}>
                      {asset.asset_tag} — {asset.name}
                    </span>
                  ))}
                </div>
              )}

              <label>
                Checkout Date
                <input
                  value={form.checkout_date}
                  onChange={(e) => updateForm("checkout_date", e.target.value)}
                  type="date"
                  required
                />
              </label>

              <label>
                Due Date
                <input
                  value={form.due_date}
                  onChange={(e) => updateForm("due_date", e.target.value)}
                  type="date"
                  required
                />
              </label>

              <label>
                Notes
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  placeholder="Rental notes, delivery details, accessories..."
                />
              </label>

              <div className="assetPanelActions">
                <button type="button" onClick={() => setPanelOpen(false)}>
                  Cancel
                </button>

                <button type="submit">
                  Check Out {selectedAssets.length || ""} Asset
                  {selectedAssets.length === 1 ? "" : "s"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}