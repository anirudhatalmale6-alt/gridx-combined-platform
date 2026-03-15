import { useState, useEffect } from "react";
import { vendingAPI } from "../services/api";

// ---- Helpers ----
const fmtCurrency = (n) =>
  `N$ ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmt = (n) => Number(n || 0).toLocaleString();

// ---- Report types ----
const REPORT_TYPES = [
  'Daily Sales',
  'Monthly Revenue',
  'Vendor Performance',
  'Customer Consumption',
  'Arrears Collection',
  'System Audit',
];

// ---- Mock report data ----
const MOCK_REPORT = [
  { vendor: 'Head Office', transactions: 87, grossSales: 72480, arrears: 520, vat: 9447, commission: 362.40, netRevenue: 62150.60, energy: 4521 },
  { vendor: 'Grunau Post', transactions: 42, grossSales: 28640, arrears: 280, vat: 3731, commission: 343.68, netRevenue: 24285.32, energy: 1842 },
  { vendor: 'Noordoewer', transactions: 31, grossSales: 18420, arrears: 148, vat: 2399, commission: 221.04, netRevenue: 15651.96, energy: 1189 },
  { vendor: 'Groot Aub', transactions: 38, grossSales: 22340, arrears: 180, vat: 2910, commission: 335.10, netRevenue: 18914.90, energy: 1422 },
  { vendor: 'Dordabis', transactions: 49, grossSales: 35780, arrears: 120, vat: 4661, commission: 429.36, netRevenue: 30569.64, energy: 2868 },
];

// ---- Mock stats ----
const MOCK_STATS = {
  totalTransactions: 247,
  totalSales: 18742,
  energyDispensed: 11842,
  arrearsCollected: 1248,
  vatCollected: 2441,
  failedTransactions: 3,
};

// ---- Mock vendor list for filter ----
const VENDOR_OPTIONS = ['All Vendors', 'Head Office', 'Grunau Post', 'Noordoewer', 'Groot Aub', 'Dordabis'];

function sumField(data, field) {
  return data.reduce((s, row) => s + Number(row[field] || 0), 0);
}

export default function Reports() {
  const [activeType, setActiveType] = useState('Daily Sales');
  const [reportData, setReportData] = useState(MOCK_REPORT);
  const [stats, setStats] = useState(MOCK_STATS);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('2026-03-12');
  const [dateTo, setDateTo] = useState('2026-03-12');
  const [vendorFilter, setVendorFilter] = useState('All Vendors');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await vendingAPI.getDailySalesReport({ from: dateFrom, to: dateTo });
      if (res.success && res.data?.length > 0) {
        setReportData(res.data);
      } else {
        setReportData(MOCK_REPORT);
      }
    } catch {
      setReportData(MOCK_REPORT);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const headers = ['Vendor', 'Transactions', 'Gross Sales', 'Arrears Collected', 'VAT', 'Commission', 'Net Revenue', 'Energy (kWh)'];
    const rows = reportData.map((r) => [
      `"${r.vendor}"`,
      r.transactions,
      r.grossSales.toFixed(2),
      r.arrears.toFixed(2),
      r.vat.toFixed(2),
      r.commission.toFixed(2),
      r.netRevenue.toFixed(2),
      r.energy,
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeType.toLowerCase().replace(/\s+/g, '-')}-report-${dateFrom}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Totals for the data table
  const totals = {
    transactions: sumField(reportData, 'transactions'),
    grossSales: sumField(reportData, 'grossSales'),
    arrears: sumField(reportData, 'arrears'),
    vat: sumField(reportData, 'vat'),
    commission: sumField(reportData, 'commission'),
    netRevenue: sumField(reportData, 'netRevenue'),
    energy: sumField(reportData, 'energy'),
  };

  return (
    <div>
      {/* ===== Page Header ===== */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
          Reports
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
          Generate and export system reports
        </p>
      </div>

      {/* ===== Report Type Selector ===== */}
      <div className="report-selector">
        {REPORT_TYPES.map((type) => (
          <button
            key={type}
            className={`report-type-btn${activeType === type ? ' active' : ''}`}
            onClick={() => setActiveType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* ===== Filter Card ===== */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div className="form-row col-4" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr auto auto' }}>
            <div className="field">
              <label>Report Type</label>
              <input type="text" value={activeType} readOnly style={{ background: '#f8fafb' }} />
            </div>
            <div className="field">
              <label>Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="field">
              <label>Date To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="field">
              <label>Vendor</label>
              <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}>
                {VENDOR_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <label>&nbsp;</label>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <label>&nbsp;</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => window.print()}>
                  Export PDF
                </button>
                <button className="btn btn-secondary" onClick={handleExportCSV}>
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Report Stats Grid (3x2) ===== */}
      <div className="report-stat-grid">
        <div className="report-stat">
          <div className="label">Total Transactions</div>
          <div className="value">{fmt(stats.totalTransactions)}</div>
        </div>
        <div className="report-stat">
          <div className="label">Total Sales Revenue</div>
          <div className="value" style={{ color: "var(--success)" }}>
            {fmtCurrency(stats.totalSales)}
          </div>
        </div>
        <div className="report-stat">
          <div className="label">Energy Dispensed</div>
          <div className="value" style={{ color: "var(--info)" }}>
            {fmt(stats.energyDispensed)} kWh
          </div>
        </div>
        <div className="report-stat">
          <div className="label">Arrears Collected</div>
          <div className="value" style={{ color: "var(--warning)" }}>
            {fmtCurrency(stats.arrearsCollected)}
          </div>
        </div>
        <div className="report-stat">
          <div className="label">VAT Collected</div>
          <div className="value">{fmtCurrency(stats.vatCollected)}</div>
        </div>
        <div className="report-stat">
          <div className="label">Failed Transactions</div>
          <div className="value" style={{ color: "var(--danger)" }}>
            {fmt(stats.failedTransactions)}
          </div>
        </div>
      </div>

      {/* ===== Report Data Table ===== */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Daily Sales Report &mdash; 12 March 2026</div>
            <div className="card-subtitle">Breakdown by vendor channel</div>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="vend-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th style={{ textAlign: "right" }}>Transactions</th>
                    <th style={{ textAlign: "right" }}>Gross Sales</th>
                    <th style={{ textAlign: "right" }}>Arrears Collected</th>
                    <th style={{ textAlign: "right" }}>VAT</th>
                    <th style={{ textAlign: "right" }}>Commission</th>
                    <th style={{ textAlign: "right" }}>Net Revenue</th>
                    <th style={{ textAlign: "right" }}>Energy (kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{row.vendor}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{fmt(row.transactions)}</td>
                      <td className="mono amount-cell" style={{ textAlign: "right" }}>{fmtCurrency(row.grossSales)}</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--warning)" }}>{fmtCurrency(row.arrears)}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{fmtCurrency(row.vat)}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{fmtCurrency(row.commission)}</td>
                      <td className="mono amount-cell" style={{ textAlign: "right", color: "var(--success)" }}>{fmtCurrency(row.netRevenue)}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{fmt(row.energy)}</td>
                    </tr>
                  ))}
                  {reportData.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
                        No report data available. Generate a report first.
                      </td>
                    </tr>
                  )}
                  {/* Total row */}
                  {reportData.length > 0 && (
                    <tr style={{ borderTop: "2px solid var(--border)", background: "#f8fafb" }}>
                      <td style={{ fontWeight: 700 }}>Totals</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{fmt(totals.transactions)}</td>
                      <td className="mono amount-cell" style={{ textAlign: "right", fontWeight: 700 }}>{fmtCurrency(totals.grossSales)}</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--warning)" }}>{fmtCurrency(totals.arrears)}</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{fmtCurrency(totals.vat)}</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{fmtCurrency(totals.commission)}</td>
                      <td className="mono amount-cell" style={{ textAlign: "right", fontWeight: 700, color: "var(--success)" }}>{fmtCurrency(totals.netRevenue)}</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{fmt(totals.energy)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
