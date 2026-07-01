import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import AssetDetails from "./assetComponents/AssetDetails";

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  const emptyForm = {
    asset_tag: "",
    name: "",
    asset_type: "Equipment",
    category: "",
    status: "Available",
    current_customer: "",
    due_back: "",
    mileage: "",
    engine_hours: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
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
      .from("fleet_assets")
      .select("*")
      .eq("company_id", membership.company_id)
      .order("created_at", { ascending: false });

    if (!error) setAssets(data || []);

    setLoading(false);
  }

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const searchText = `${asset.asset_tag || ""} ${asset.name || ""} ${
        asset.asset_type || ""
      } ${asset.category || ""} ${
        asset.current_customer || ""
      }`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || asset.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assets, search, statusFilter]);

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAddPanel() {
    setEditingAsset(null);
    setForm(emptyForm);
    setPanelOpen(true);
  }

  function openEditPanel(asset) {
    setSelectedAsset(null);
    setEditingAsset(asset);
    setForm({
      asset_tag: asset.asset_tag || "",
      name: asset.name || "",
      asset_type: asset.asset_type || "Equipment",
      category: asset.category || "",
      status: asset.status || "Available",
      current_customer: asset.current_customer || "",
      due_back: asset.due_back || "",
      mileage: asset.mileage ?? "",
      engine_hours: asset.engine_hours ?? "",
      notes: asset.notes || "",
    });
    setPanelOpen(true);
  }

  async function saveAsset(e) {
    e.preventDefault();

    if (!form.asset_tag || !form.name || !companyId) return;

    const isVehicle = form.asset_type === "Vehicle";
    const isEquipment = form.asset_type === "Equipment";

    const payload = {
      company_id: companyId,
      asset_tag: form.asset_tag,
      name: form.name,
      asset_type: form.asset_type,
      category: form.category,
      status: form.status,
      current_customer: form.current_customer,
      due_back: form.due_back || null,
      mileage: isVehicle && form.mileage !== "" ? Number(form.mileage) : null,
      engine_hours:
        isEquipment && form.engine_hours !== ""
          ? Number(form.engine_hours)
          : null,
      notes: form.notes,
    };

    let error;

    if (editingAsset) {
      const result = await supabase
        .from("fleet_assets")
        .update(payload)
        .eq("id", editingAsset.id)
        .eq("company_id", companyId);

      error = result.error;
    } else {
      const result = await supabase.from("fleet_assets").insert(payload);
      error = result.error;
    }

    if (error) {
      alert(error.message);
      return;
    }

    setForm(emptyForm);
    setEditingAsset(null);
    setPanelOpen(false);
    await loadAssets();
  }

  async function deleteAsset(asset) {
    const confirmed = window.confirm(
      `Delete ${asset.asset_tag} - ${asset.name}? This cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("fleet_assets")
      .delete()
      .eq("id", asset.id)
      .eq("company_id", companyId);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedAsset(null);
    setEditingAsset(null);
    setPanelOpen(false);
    await loadAssets();
  }

  return (
    <div className="assetsPage">
      <section className="assetsHeader">
        <div>
          <span>BC Fleet</span>
          <h1>Assets</h1>
          <p>
            Search, filter, add, edit, and manage equipment, vehicles, and
            other trackable assets.
          </p>
        </div>

        <button onClick={openAddPanel}>+ Add Asset</button>
      </section>

      <section className="assetToolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by tag, equipment, type, category, or customer..."
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All</option>
          <option>Available</option>
          <option>Rented</option>
          <option>Repair</option>
          <option>Reserved</option>
        </select>
      </section>

      <section className="assetTableCard">
        <div className="assetTableTop">
          <div>
            <h2>Fleet Assets</h2>
            <p>
              {filteredAssets.length} asset
              {filteredAssets.length === 1 ? "" : "s"} shown
            </p>
          </div>
        </div>

        {loading ? (
          <p className="emptyState">Loading assets...</p>
        ) : filteredAssets.length === 0 ? (
          <p className="emptyState">
            No assets found. Click <strong>+ Add Asset</strong> to create your
            first one.
          </p>
        ) : (
          <div className="assetTableWrap">
            <table className="assetTable">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Usage</th>
                  <th>Customer</th>
                  <th>Due Back</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className="clickableRow"
                  >
                    <td>
                      <strong>{asset.asset_tag}</strong>
                    </td>
                    <td>{asset.name}</td>
                    <td>{asset.asset_type || "Equipment"}</td>
                    <td>{asset.category || "-"}</td>
                    <td>
                      <span className={`statusBadge ${asset.status}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td>
                      {asset.asset_type === "Vehicle"
                        ? asset.mileage != null
                          ? `${asset.mileage} mi`
                          : "-"
                        : asset.asset_type === "Equipment"
                        ? asset.engine_hours != null
                          ? `${asset.engine_hours} hrs`
                          : "-"
                        : "-"}
                    </td>
                    <td>{asset.current_customer || "-"}</td>
                    <td>{asset.due_back || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedAsset && (
        <AssetDetails
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onEdit={() => openEditPanel(selectedAsset)}
          onDelete={() => deleteAsset(selectedAsset)}
        />
      )}

      {panelOpen && (
        <div className="assetPanelOverlay">
          <aside className="assetPanel">
            <div className="assetPanelHeader">
              <div>
                <span>{editingAsset ? "Edit Asset" : "New Asset"}</span>
                <h2>{editingAsset ? editingAsset.name : "Add Asset"}</h2>
              </div>

              <button
                onClick={() => {
                  setPanelOpen(false);
                  setEditingAsset(null);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveAsset} className="assetForm">
              <label>
                Asset Tag
                <input
                  value={form.asset_tag}
                  onChange={(e) => updateForm("asset_tag", e.target.value)}
                  placeholder="GR-1005"
                  required
                />
              </label>

              <label>
                Asset Name
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Husqvarna PG530"
                  required
                />
              </label>

              <label>
                Asset Type
                <select
                  value={form.asset_type}
                  onChange={(e) => updateForm("asset_type", e.target.value)}
                >
                  <option>Equipment</option>
                  <option>Vehicle</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Category
                <input
                  value={form.category}
                  onChange={(e) => updateForm("category", e.target.value)}
                  placeholder="Grinder, Truck, Trailer, Generator..."
                />
              </label>

              {form.asset_type === "Equipment" && (
                <label>
                  Engine Hours
                  <input
                    value={form.engine_hours}
                    onChange={(e) =>
                      updateForm("engine_hours", e.target.value)
                    }
                    placeholder="642"
                    type="number"
                    min="0"
                    step="0.1"
                  />
                </label>
              )}

              {form.asset_type === "Vehicle" && (
                <label>
                  Mileage
                  <input
                    value={form.mileage}
                    onChange={(e) => updateForm("mileage", e.target.value)}
                    placeholder="125000"
                    type="number"
                    min="0"
                    step="1"
                  />
                </label>
              )}

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value)}
                >
                  <option>Available</option>
                  <option>Rented</option>
                  <option>Repair</option>
                  <option>Reserved</option>
                </select>
              </label>

              <label>
                Current Customer
                <input
                  value={form.current_customer}
                  onChange={(e) =>
                    updateForm("current_customer", e.target.value)
                  }
                  placeholder="Optional"
                />
              </label>

              <label>
                Due Back
                <input
                  value={form.due_back}
                  onChange={(e) => updateForm("due_back", e.target.value)}
                  type="date"
                />
              </label>

              <label>
                Notes
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  placeholder="Condition, included accessories, reminders..."
                />
              </label>

              <div className="assetPanelActions">
                {editingAsset && (
                  <button
                    type="button"
                    className="dangerButton"
                    onClick={() => deleteAsset(editingAsset)}
                  >
                    Delete
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPanelOpen(false);
                    setEditingAsset(null);
                  }}
                >
                  Cancel
                </button>

                <button type="submit">
                  {editingAsset ? "Save Changes" : "Save Asset"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}