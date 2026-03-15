import { useState, useEffect } from "react";
import { vendingAPI } from "../services/api";

// ---- Helpers ----
const fmtCurrency = (n) =>
  `N$ ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtShort = (n) => {
  if (n >= 1000000) return `N$ ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `N$ ${(n / 1000).toFixed(0)}K`;
  return `N$ ${n}`;
};

const fmt = (n) => Number(n || 0).toLocaleString();

// ---- Mock Data ----
const MOCK_VENDORS = [
  { id: 1, name: 'NamPower Head Office', location: 'Windhoek, Namibia', status: 'Active', totalSales: 189240, transactionCount: 1021, commissionRate: 0.5, operatorName: 'Sarah Kauna', operatorPhone: '+264 61 205 4111', balance: 150000 },
  { id: 2, name: 'Grunau Post Office', location: 'Grunau, //Karas Region', status: 'Active', totalSales: 62180, transactionCount: 342, commissionRate: 1.2, operatorName: 'Thomas Iipumbu', operatorPhone: '+264 81 300 1002', balance: 45000 },
  { id: 3, name: 'Noordoewer Shop', location: 'Noordoewer, //Karas', status: 'Active', totalSales: 44920, transactionCount: 198, commissionRate: 1.2, operatorName: 'Maria Nghidengwa', operatorPhone: '+264 81 300 1001', balance: 32000 },
  { id: 4, name: 'Groot Aub Community', location: 'Groot Aub, Hardap', status: 'Low Balance', totalSales: 28340, transactionCount: 156, commissionRate: 1.5, operatorName: 'Naomi Shipanga', operatorPhone: '+264 81 300 1004', balance: 5200 },
  { id: 5, name: 'Dordabis Trading Store', location: 'Dordabis, Khomas', status: 'Active', totalSales: 52780, transactionCount: 267, commissionRate: 1.2, operatorName: 'Jonas Nghishidi', operatorPhone: '+264 81 300 1005', balance: 38000 },
  { id: 6, name: 'Stampriet Rural Agent', location: 'Stampriet, Hardap', status: 'Suspended', totalSales: 0, transactionCount: 0, commissionRate: 1.5, operatorName: 'Elias Mouton', operatorPhone: '+264 81 300 1006', balance: 0 },
];

function statusBadgeClass(status) {
  switch (status) {
    case 'Active': return 'badge badge-success';
    case 'Low Balance': return 'badge badge-warning';
    case 'Suspended': return 'badge badge-danger';
    default: return 'badge badge-muted';
  }
}

export default function Vendors() {
  const [vendors, setVendors] = useState(MOCK_VENDORS);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendingAPI.getVendors()
      .then((r) => {
        if (r.success && r.data?.length > 0) setVendors(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedVendor = vendors.find((v) => v.id === selectedId) || null;

  // Derived totals
  const totalSales = vendors.reduce((s, v) => s + Number(v.totalSales || 0), 0);
  const totalCommission = vendors.reduce(
    (s, v) => s + Number(v.totalSales || 0) * (Number(v.commissionRate || 0) / 100),
    0
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* ===== Header Row ===== */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
            Vendor Management
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Manage vending point operators and commission tracking
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary">Batch Report</button>
          <button className="btn btn-primary">+ Add Vendor</button>
        </div>
      </div>

      {/* ===== Vendor Card Grid ===== */}
      <div className="vendor-grid">
        {vendors.map((v) => (
          <div
            key={v.id}
            className={`vendor-card${selectedId === v.id ? " selected" : ""}`}
            onClick={() => setSelectedId(selectedId === v.id ? null : v.id)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <div className="vendor-name">{v.name}</div>
              <span className={statusBadgeClass(v.status)}>{v.status}</span>
            </div>
            <div className="vendor-loc" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 13 }}>&#128205;</span>
              {v.location}
            </div>
            <div className="vendor-stats">
              <div className="vendor-stat">
                <div className="v-val">{fmtShort(v.totalSales)}</div>
                <div className="v-lbl">Month Sales</div>
              </div>
              <div className="vendor-stat">
                <div className="v-val">{fmt(v.transactionCount)}</div>
                <div className="v-lbl">Transactions</div>
              </div>
              <div className="vendor-stat">
                <div className="v-val">{v.commissionRate}%</div>
                <div className="v-lbl">Commission</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Detail Section (2 columns) ===== */}
      {selectedVendor && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {/* Left - Vendor Detail */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">{selectedVendor.name}</div>
              <button className="btn btn-secondary btn-sm">Edit</button>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
                    Contact Person
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                    {selectedVendor.operatorName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
                    Phone
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                    {selectedVendor.operatorPhone}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
                    Commission Rate
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                    {selectedVendor.commissionRate}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
                    Float Balance
                  </div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--success)" }}>
                    {fmtCurrency(selectedVendor.balance)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
                    Batch Status
                  </div>
                  <span className="badge badge-info">Open</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
                    Batch Total
                  </div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {fmtCurrency(selectedVendor.totalSales)}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary btn-sm">Close Batch</button>
                <button className="btn btn-secondary btn-sm">Batch Report</button>
                <button className="btn btn-secondary btn-sm">Banking Statement</button>
              </div>
            </div>
          </div>

          {/* Right - Commission Summary */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Commission Summary &mdash; March 2026</div>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table className="vend-table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th style={{ textAlign: "right" }}>Sales</th>
                      <th style={{ textAlign: "center" }}>Rate</th>
                      <th style={{ textAlign: "right" }}>Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v) => {
                      const commAmt = Number(v.totalSales || 0) * (Number(v.commissionRate || 0) / 100);
                      return (
                        <tr key={v.id}>
                          <td style={{ fontWeight: 500 }}>{v.name}</td>
                          <td className="mono amount-cell" style={{ textAlign: "right" }}>
                            {fmtCurrency(v.totalSales)}
                          </td>
                          <td style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                            {v.commissionRate}%
                          </td>
                          <td className="mono amount-cell" style={{ textAlign: "right", color: "var(--warning)" }}>
                            {fmtCurrency(commAmt)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total row */}
                    <tr style={{ borderTop: "2px solid var(--border)" }}>
                      <td style={{ fontWeight: 700 }}>Totals</td>
                      <td className="mono amount-cell" style={{ textAlign: "right", fontWeight: 700 }}>
                        {fmtCurrency(totalSales)}
                      </td>
                      <td />
                      <td className="mono amount-cell" style={{ textAlign: "right", fontWeight: 700, color: "var(--warning)" }}>
                        {fmtCurrency(totalCommission)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
