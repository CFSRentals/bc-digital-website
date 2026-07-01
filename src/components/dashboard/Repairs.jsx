import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Repairs() {
  const [companyId, setCompanyId] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [assets, setAssets] = useState([]);
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    asset_id: "",
    issue: "",
    diagnosis: "",
    fix_notes: "",
    status: "Open",
    labor_hours: "",
    labor_rate: "",
  });

  const [selectedParts, setSelectedParts] = useState([]);

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

    const [{ data: repairData }, { data: assetData }, { data: partData }] =
      await Promise.all([
        supabase
          .from("fleet_repairs")
          .select("*")
          .eq("company_id", membership.company_id)
          .order("created_at", { ascending: false }),

        supabase
          .from("fleet_assets")
          .select("*")
          .eq("company_id", membership.company_id)
          .order("asset_tag", { ascending: true }),

        supabase
          .from("fleet_parts")
          .select("*")
          .eq("company_id", membership.company_id)
          .order("name", { ascending: true }),
      ]);

    setRepairs(repairData || []);
    setAssets(assetData || []);
    setParts(partData || []);
    setLoading(false);
  }

  const stats = useMemo(() => {
    return {
      open: repairs.filter((r) => r.status === "Open").length,
      waiting: repairs.filter((r) => r.status === "Waiting on Parts").length,
      progress: repairs.filter((r) => r.status === "In Progress").length,
      completed: repairs.filter((r) => r.status === "Completed").length,
      totalCost: repairs.reduce(
        (sum, r) => sum + Number(r.total_cost || 0),
        0
      ),
    };
  }, [repairs]);

  const filteredRepairs = useMemo(() => {
    return repairs.filter((repair) => {
      const text = `${repair.asset_tag || ""} ${repair.asset_name || ""} ${
        repair.issue || ""
      } ${repair.status || ""}`.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [repairs, search]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addPartLine() {
    setSelectedParts((current) => [
      ...current,
      { part_id: "", quantity: 1, unit_cost: 0 },
    ]);
  }

  function updatePartLine(index, field, value) {
    setSelectedParts((current) =>
      current.map((line, i) => {
        if (i !== index) return line;

        if (field === "part_id") {
          const part = parts.find((item) => item.id === value);
          return {
            ...line,
            part_id: value,
            unit_cost: part?.cost || 0,
          };
        }

        return { ...line, [field]: value };
      })
    );
  }

  function removePartLine(index) {
    setSelectedParts((current) => current.filter((_, i) => i !== index));
  }

  const laborTotal =
    Number(form.labor_hours || 0) * Number(form.labor_rate || 0);

  const partsTotal = selectedParts.reduce((sum, line) => {
    return sum + Number(line.quantity || 0) * Number(line.unit_cost || 0);
  }, 0);

  const totalCost = laborTotal + partsTotal;

  async function saveRepair(e) {
    e.preventDefault();

    if (!companyId || !form.asset_id || !form.issue) return;

    const asset = assets.find((item) => item.id === form.asset_id);
    if (!asset) return;

    const completed = form.status === "Completed";

    const { data: repair, error: repairError } = await supabase
      .from("fleet_repairs")
      .insert({
        company_id: companyId,
        asset_id: asset.id,
        asset_tag: asset.asset_tag,
        asset_name: asset.name,
        issue: form.issue,
        diagnosis: form.diagnosis,
        fix_notes: form.fix_notes,
        status: form.status,
        labor_hours: Number(form.labor_hours || 0),
        labor_rate: Number(form.labor_rate || 0),
        labor_total: laborTotal,
        parts_total: partsTotal,
        total_cost: totalCost,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (repairError) {
      alert(repairError.message);
      return;
    }

    const partPayload = selectedParts
      .filter((line) => line.part_id)
      .map((line) => {
        const part = parts.find((item) => item.id === line.part_id);
        const quantity = Number(line.quantity || 0);
        const unitCost = Number(line.unit_cost || 0);

        return {
          repair_id: repair.id,
          part_id: part?.id || null,
          part_number: part?.part_number || "",
          part_name: part?.name || "",
          quantity,
          unit_cost: unitCost,
          total_cost: quantity * unitCost,
        };
      });

    if (partPayload.length > 0) {
      const { error: partError } = await supabase
        .from("fleet_repair_parts")
        .insert(partPayload);

      if (partError) {
        alert(partError.message);
        return;
      }
    }

    await supabase
      .from("fleet_assets")
      .update({
        status: completed ? "Available" : "Repair",
      })
      .eq("id", asset.id)
      .eq("company_id", companyId);

    setForm({
      asset_id: "",
      issue: "",
      diagnosis: "",
      fix_notes: "",
      status: "Open",
      labor_hours: "",
      labor_rate: "",
    });

    setSelectedParts([]);
    setPanelOpen(false);
    await loadData();
  }

  function printWorkOrder(repair) {
    const win = window.open("", "_blank");

    win.document.write(`
      <html>
        <head>
          <title>Repair Work Order</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 32px;
              color: #111827;
            }

            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #111827;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }

            .brand h1 {
              margin: 0;
              font-size: 28px;
            }

            .muted {
              color: #6b7280;
            }

            .section {
              border: 1px solid #d1d5db;
              border-radius: 10px;
              padding: 16px;
              margin-bottom: 16px;
            }

            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }

            h2 {
              margin-top: 0;
            }

            .total {
              font-size: 22px;
              font-weight: bold;
            }

            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <button onclick="window.print()">Print Work Order</button>

          <div class="header">
            <div class="brand">
              <h1>Repair Work Order</h1>
              <p class="muted">BC Fleet</p>
            </div>

            <div>
              <strong>${repair.asset_tag || ""}</strong>
              <p class="muted">${repair.created_at || ""}</p>
            </div>
          </div>

          <div class="section">
            <h2>Equipment</h2>
            <div class="grid">
              <p><strong>Asset:</strong> ${repair.asset_tag || ""}</p>
              <p><strong>Name:</strong> ${repair.asset_name || ""}</p>
              <p><strong>Status:</strong> ${repair.status || ""}</p>
              <p><strong>Completed:</strong> ${repair.completed_at || "-"}</p>
            </div>
          </div>

          <div class="section">
            <h2>Issue</h2>
            <p>${repair.issue || "-"}</p>
          </div>

          <div class="section">
            <h2>Diagnosis</h2>
            <p>${repair.diagnosis || "-"}</p>
          </div>

          <div class="section">
            <h2>Fix Notes</h2>
            <p>${repair.fix_notes || "-"}</p>
          </div>

          <div class="section">
            <h2>Cost</h2>
            <div class="grid">
              <p><strong>Labor Hours:</strong> ${repair.labor_hours || 0}</p>
              <p><strong>Labor Rate:</strong> $${Number(
                repair.labor_rate || 0
              ).toFixed(2)}</p>
              <p><strong>Labor Total:</strong> $${Number(
                repair.labor_total || 0
              ).toFixed(2)}</p>
              <p><strong>Parts Total:</strong> $${Number(
                repair.parts_total || 0
              ).toFixed(2)}</p>
            </div>

            <p class="total">Total: $${Number(repair.total_cost || 0).toFixed(
              2
            )}</p>
          </div>
        </body>
      </html>
    `);

    win.document.close();
  }

  return (
    <div className="assetsPage">
      <section className="assetsHeader">
        <div>
          <span>BC Fleet</span>
          <h1>Repairs</h1>
          <p>
            Create repair orders, track labor and parts, and print polished work
            orders for your team or customer.
          </p>
        </div>

        <button onClick={() => setPanelOpen(true)}>+ New Repair</button>
      </section>

      <section className="dashboardStats">
        <div className="statCard orange">
          <h3>Open</h3>
          <strong>{stats.open}</strong>
        </div>

        <div className="statCard purple">
          <h3>Waiting Parts</h3>
          <strong>{stats.waiting}</strong>
        </div>

        <div className="statCard blue">
          <h3>In Progress</h3>
          <strong>{stats.progress}</strong>
        </div>

        <div className="statCard green">
          <h3>Completed</h3>
          <strong>{stats.completed}</strong>
        </div>

        <div className="statCard red">
          <h3>Total Repair Cost</h3>
          <strong>${stats.totalCost.toFixed(0)}</strong>
        </div>
      </section>

      <section className="assetToolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search repairs by asset, issue, or status..."
        />
      </section>

      <section className="assetTableCard">
        <div className="assetTableTop">
          <div>
            <h2>Repair Orders</h2>
            <p>
              {filteredRepairs.length} repair
              {filteredRepairs.length === 1 ? "" : "s"} shown
            </p>
          </div>
        </div>

        {loading ? (
          <p className="emptyState">Loading repairs...</p>
        ) : filteredRepairs.length === 0 ? (
          <p className="emptyState">
            No repair orders yet. Click <strong>+ New Repair</strong> to create
            one.
          </p>
        ) : (
          <div className="assetTableWrap">
            <table className="assetTable">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Issue</th>
                  <th>Status</th>
                  <th>Labor</th>
                  <th>Parts</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {filteredRepairs.map((repair) => (
                  <tr
                    key={repair.id}
                    className="clickableRow"
                    onClick={() => setSelectedRepair(repair)}
                  >
                    <td>
                      <strong>{repair.asset_tag}</strong> — {repair.asset_name}
                    </td>
                    <td>{repair.issue}</td>
                    <td>
                      <span className={`statusBadge ${repair.status}`}>
                        {repair.status}
                      </span>
                    </td>
                    <td>${Number(repair.labor_total || 0).toFixed(2)}</td>
                    <td>${Number(repair.parts_total || 0).toFixed(2)}</td>
                    <td>
                      <strong>
                        ${Number(repair.total_cost || 0).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedRepair && (
        <div className="assetPanelOverlay">
          <aside className="assetPanel">
            <div className="assetPanelHeader">
              <div>
                <span>Repair Work Order</span>
                <h2>{selectedRepair.asset_tag}</h2>
              </div>

              <button onClick={() => setSelectedRepair(null)}>×</button>
            </div>

            <div className="assetProfileHero">
              <div className="assetPhotoPlaceholder">RO</div>

              <div>
                <span className={`statusBadge ${selectedRepair.status}`}>
                  {selectedRepair.status}
                </span>
                <h3>{selectedRepair.asset_name}</h3>
                <p>{selectedRepair.issue}</p>
              </div>
            </div>

            <div className="assetActionGrid">
              <button onClick={() => printWorkOrder(selectedRepair)}>
                Print Work Order
              </button>
              <button>Create Follow-Up</button>
              <button>Add Photos</button>
            </div>

            <div className="assetDetailGrid">
              <Detail label="Asset" value={selectedRepair.asset_tag} />
              <Detail label="Equipment" value={selectedRepair.asset_name} />
              <Detail label="Status" value={selectedRepair.status} />
              <Detail
                label="Labor"
                value={`$${Number(selectedRepair.labor_total || 0).toFixed(2)}`}
              />
              <Detail
                label="Parts"
                value={`$${Number(selectedRepair.parts_total || 0).toFixed(2)}`}
              />
              <Detail
                label="Total"
                value={`$${Number(selectedRepair.total_cost || 0).toFixed(2)}`}
              />
            </div>

            <div className="assetTimeline">
              <h3>Issue</h3>
              <p>{selectedRepair.issue || "-"}</p>

              <h3>Diagnosis</h3>
              <p>{selectedRepair.diagnosis || "-"}</p>

              <h3>Fix Notes</h3>
              <p>{selectedRepair.fix_notes || "-"}</p>
            </div>
          </aside>
        </div>
      )}

      {panelOpen && (
        <div className="assetPanelOverlay">
          <aside className="assetPanel">
            <div className="assetPanelHeader">
              <div>
                <span>Repair Order</span>
                <h2>New Repair</h2>
              </div>

              <button onClick={() => setPanelOpen(false)}>×</button>
            </div>

            <form onSubmit={saveRepair} className="assetForm">
              <label>
                Asset
                <select
                  value={form.asset_id}
                  onChange={(e) => updateForm("asset_id", e.target.value)}
                  required
                >
                  <option value="">Select asset...</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_tag} — {asset.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Issue
                <input
                  value={form.issue}
                  onChange={(e) => updateForm("issue", e.target.value)}
                  placeholder="Won't start, leaking, damaged cord..."
                  required
                />
              </label>

              <label>
                Diagnosis
                <textarea
                  value={form.diagnosis}
                  onChange={(e) => updateForm("diagnosis", e.target.value)}
                  placeholder="What caused the issue?"
                />
              </label>

              <label>
                Fix Notes
                <textarea
                  value={form.fix_notes}
                  onChange={(e) => updateForm("fix_notes", e.target.value)}
                  placeholder="What was repaired or replaced?"
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value)}
                >
                  <option>Open</option>
                  <option>Waiting on Parts</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </label>

              <div className="repairCostGrid">
                <label>
                  Labor Hours
                  <input
                    value={form.labor_hours}
                    onChange={(e) => updateForm("labor_hours", e.target.value)}
                    type="number"
                    min="0"
                    step="0.25"
                    placeholder="2.5"
                  />
                </label>

                <label>
                  Labor Rate
                  <input
                    value={form.labor_rate}
                    onChange={(e) => updateForm("labor_rate", e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="95"
                  />
                </label>
              </div>

              <div className="repairPartsBox">
                <div className="assetTableTop">
                  <div>
                    <h3>Parts Used</h3>
                    <p>Select from imported parts list.</p>
                  </div>

                  <button type="button" onClick={addPartLine}>
                    + Add Part
                  </button>
                </div>

                {selectedParts.map((line, index) => (
                  <div className="repairPartLine" key={index}>
                    <select
                      value={line.part_id}
                      onChange={(e) =>
                        updatePartLine(index, "part_id", e.target.value)
                      }
                    >
                      <option value="">Select part...</option>
                      {parts.map((part) => (
                        <option key={part.id} value={part.id}>
                          {part.part_number ? `${part.part_number} — ` : ""}
                          {part.name}
                        </option>
                      ))}
                    </select>

                    <input
                      value={line.quantity}
                      onChange={(e) =>
                        updatePartLine(index, "quantity", e.target.value)
                      }
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Qty"
                    />

                    <input
                      value={line.unit_cost}
                      onChange={(e) =>
                        updatePartLine(index, "unit_cost", e.target.value)
                      }
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Cost"
                    />

                    <button type="button" onClick={() => removePartLine(index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="repairTotals">
                <div>
                  <span>Labor</span>
                  <strong>${laborTotal.toFixed(2)}</strong>
                </div>
                <div>
                  <span>Parts</span>
                  <strong>${partsTotal.toFixed(2)}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>${totalCost.toFixed(2)}</strong>
                </div>
              </div>

              <div className="assetPanelActions">
                <button type="button" onClick={() => setPanelOpen(false)}>
                  Cancel
                </button>

                <button type="submit">Save Repair</button>
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