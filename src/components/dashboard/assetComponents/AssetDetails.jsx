export default function AssetDetails({ asset, onClose, onEdit, onDelete }) {
  if (!asset) return null;

  const usageLabel =
    asset.asset_type === "Vehicle"
      ? "Mileage"
      : asset.asset_type === "Equipment"
      ? "Engine Hours"
      : "Usage";

  const usageValue =
    asset.asset_type === "Vehicle"
      ? asset.mileage != null
        ? `${asset.mileage} mi`
        : "-"
      : asset.asset_type === "Equipment"
      ? asset.engine_hours != null
        ? `${asset.engine_hours} hrs`
        : "-"
      : "-";

  return (
    <div className="assetPanelOverlay">
      <aside className="assetPanel">
        <div className="assetPanelHeader">
          <div>
            <span>Asset Profile</span>
            <h2>{asset.name}</h2>
          </div>

          <button onClick={onClose}>×</button>
        </div>

        <div className="assetProfileHero">
          <div className="assetPhotoPlaceholder">
            {asset.name?.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <span className={`statusBadge ${asset.status}`}>
              {asset.status}
            </span>
            <h3>{asset.asset_tag}</h3>
            <p>{asset.asset_type || "Equipment"} · {asset.category || "No category added"}</p>
          </div>
        </div>

        <div className="assetActionGrid">
          <button onClick={onEdit}>Edit Asset</button>
          <button>Check Out</button>
          <button>Create Repair</button>
          <button>Upload Photos</button>
          <button>Generate QR</button>
          <button className="dangerButton" onClick={onDelete}>
            Delete
          </button>
        </div>

        <div className="assetDetailGrid">
          <Detail label="Asset Tag" value={asset.asset_tag} />
          <Detail label="Type" value={asset.asset_type || "Equipment"} />
          <Detail label="Status" value={asset.status} />
          <Detail label="Category" value={asset.category || "-"} />
          <Detail label={usageLabel} value={usageValue} />
          <Detail label="Customer" value={asset.current_customer || "-"} />
          <Detail label="Due Back" value={asset.due_back || "-"} />
          <Detail label="Notes" value={asset.notes || "-"} />
        </div>

        <div className="assetTabs">
          <button className="active">Overview</button>
          <button>Rentals</button>
          <button>Repairs</button>
          <button>Photos</button>
        </div>

        <div className="assetTimeline">
          <h3>Activity Timeline</h3>
          <p>Asset created.</p>
          <p>
            Rental history, repair history, inspections, photos, mileage/engine
            hour logs, and QR codes will show here next.
          </p>
        </div>
      </aside>
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