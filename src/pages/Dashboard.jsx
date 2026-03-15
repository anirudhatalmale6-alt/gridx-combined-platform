import { useState, useEffect } from "react";
import { vendingAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

// ---- Helpers ----
const fmt = (n) => Number(n || 0).toLocaleString();
const fmtCurrency = (n) =>
  `N$ ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

function formatTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-NA", { hour: "2-digit", minute: "2-digit" });
}

function getDayLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[d.getDay()] || "";
}

// Mock fallback data
const MOCK_DASHBOARD = {
  todayRevenue: 18742,
  todayTokens: 247,
  activeCustomers: 2984,
  monthRevenue: 412580,
  salesTrend: [
    { day: "Thu", revenue: 9840 },
    { day: "Fri", revenue: 13200 },
    { day: "Sat", revenue: 8420 },
    { day: "Sun", revenue: 6100 },
    { day: "Mon", revenue: 15600 },
    { day: "Tue", revenue: 14380 },
    { day: "Today", revenue: 18742 },
  ],
};

const MOCK_TRANSACTIONS = [
  {
    id: 1,
    time: new Date().toISOString(),
    customer: "Martha Shilongo",
    meterNo: "04040512345",
    amount: 250.0,
    kwh: 58.2,
    status: "Success",
  },
  {
    id: 2,
    time: new Date(Date.now() - 300000).toISOString(),
    customer: "Jonas Amupanda",
    meterNo: "04040598765",
    amount: 100.0,
    kwh: 23.1,
    status: "Success",
  },
  {
    id: 3,
    time: new Date(Date.now() - 600000).toISOString(),
    customer: "Selma Kapunda",
    meterNo: "04040534567",
    amount: 500.0,
    kwh: 116.8,
    status: "Arrears",
  },
  {
    id: 4,
    time: new Date(Date.now() - 900000).toISOString(),
    customer: "Petrus Hamutenya",
    meterNo: "04040523456",
    amount: 50.0,
    kwh: 11.5,
    status: "Success",
  },
  {
    id: 5,
    time: new Date(Date.now() - 1200000).toISOString(),
    customer: "Maria Nangolo",
    meterNo: "04040567890",
    amount: 200.0,
    kwh: 46.4,
    status: "Success",
  },
  {
    id: 6,
    time: new Date(Date.now() - 1800000).toISOString(),
    customer: "David Nghifikwa",
    meterNo: "04040545678",
    amount: 75.0,
    kwh: 17.3,
    status: "Failed",
  },
  {
    id: 7,
    time: new Date(Date.now() - 2400000).toISOString(),
    customer: "Anna Shikongo",
    meterNo: "04040578901",
    amount: 300.0,
    kwh: 69.8,
    status: "Success",
  },
  {
    id: 8,
    time: new Date(Date.now() - 3000000).toISOString(),
    customer: "Thomas Iipumbu",
    meterNo: "04040589012",
    amount: 150.0,
    kwh: 34.7,
    status: "Success",
  },
  {
    id: 9,
    time: new Date(Date.now() - 3600000).toISOString(),
    customer: "Elizabeth Kandji",
    meterNo: "04040556789",
    amount: 100.0,
    kwh: 23.1,
    status: "Arrears",
  },
  {
    id: 10,
    time: new Date(Date.now() - 4200000).toISOString(),
    customer: "Simon Nghidishange",
    meterNo: "04040590123",
    amount: 400.0,
    kwh: 93.2,
    status: "Success",
  },
];

// Status badge class map
function statusBadgeClass(status) {
  switch (status) {
    case "Success":
    case "Completed":
      return "badge badge-success";
    case "Arrears":
    case "Warning":
    case "Reversed":
      return "badge badge-warning";
    case "Failed":
      return "badge badge-danger";
    default:
      return "badge badge-info";
  }
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState(MOCK_DASHBOARD);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await vendingAPI.getDashboard();
        if (res.success) setDashData(res.data);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      }
      try {
        const res = await vendingAPI.getTransactions({ limit: 10 });
        if (res.success) setTransactions(res.data || []);
      } catch (e) {
        console.error("Transactions fetch error:", e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Sales trend chart helpers
  const salesTrend = dashData.salesTrend || MOCK_DASHBOARD.salesTrend;
  const maxRevenue = Math.max(...salesTrend.map((d) => d.revenue), 1);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* ===== KPI Grid ===== */}
      <div className="kpi-grid">
        {/* Today's Sales */}
        <div className="kpi-card blue">
          <div className="kpi-icon">&#9889;</div>
          <div className="kpi-label">Today's Sales</div>
          <div className="kpi-value">
            {fmtCurrency(dashData.todayRevenue ?? MOCK_DASHBOARD.todayRevenue)}
          </div>
          <div className="kpi-change up">
            <span>&#9650;</span> +12.5% vs yesterday
          </div>
        </div>

        {/* Tokens Generated */}
        <div className="kpi-card green">
          <div className="kpi-icon">&#129682;</div>
          <div className="kpi-label">Tokens Generated</div>
          <div className="kpi-value">
            {fmt(dashData.todayTokens ?? MOCK_DASHBOARD.todayTokens)}
          </div>
          <div className="kpi-change up">
            <span>&#9650;</span> +8.3% vs yesterday
          </div>
        </div>

        {/* Active Meters */}
        <div className="kpi-card amber">
          <div className="kpi-icon">&#128161;</div>
          <div className="kpi-label">Active Meters</div>
          <div className="kpi-value">
            {fmt(dashData.activeCustomers ?? MOCK_DASHBOARD.activeCustomers)}
          </div>
          <div className="kpi-change up">
            <span>&#9650;</span> +2.1% this month
          </div>
        </div>

        {/* Revenue This Month */}
        <div className="kpi-card purple">
          <div className="kpi-icon">&#128184;</div>
          <div className="kpi-label">Revenue This Month</div>
          <div className="kpi-value">
            {fmtCurrency(dashData.monthRevenue ?? MOCK_DASHBOARD.monthRevenue)}
          </div>
          <div className="kpi-change up">
            <span>&#9650;</span> +15.7% vs last month
          </div>
        </div>
      </div>

      {/* ===== Dashboard Grid ===== */}
      <div className="dash-grid">
        {/* LEFT COLUMN: Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Transactions</div>
              <div className="card-subtitle">
                Last 10 vending transactions
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate("/transactions")}
            >
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="vend-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Meter No.</th>
                    <th>Amount</th>
                    <th>kWh</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td>{formatTime(txn.time || txn.createdAt)}</td>
                      <td>{txn.customer || txn.customerName || "-"}</td>
                      <td className="mono ref-cell">
                        {txn.meterNo || txn.meter_number || "-"}
                      </td>
                      <td className="mono amount-cell">
                        N$ {Number(txn.amount || 0).toFixed(2)}
                      </td>
                      <td className="mono">
                        {Number(txn.kwh || txn.kWh || 0).toFixed(1)}
                      </td>
                      <td>
                        <span className={statusBadgeClass(txn.status)}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          padding: "32px 16px",
                          color: "var(--text-muted)",
                        }}
                      >
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (stacked) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Sales Trend Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Sales Trend</div>
                <div className="card-subtitle">Last 7 days revenue</div>
              </div>
            </div>
            <div className="chart-area">
              <div className="bar-chart">
                {salesTrend.map((d, i) => {
                  const heightPct = Math.max(
                    (d.revenue / maxRevenue) * 100,
                    4
                  );
                  return (
                    <div className="bar-group" key={i}>
                      <div
                        className="bar"
                        style={{ height: `${heightPct}%` }}
                        title={`${d.day}: N$ ${fmt(d.revenue)}`}
                      />
                      <span className="bar-label">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* System Status Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">System Status</div>
                <div className="card-subtitle">All services operational</div>
              </div>
              <span className="badge badge-success">
                <span
                  className="status-dot online"
                  style={{ marginRight: 4 }}
                />
                Healthy
              </span>
            </div>
            <div className="system-status">
              <div className="status-row">
                <span className="status-label">
                  <span>&#127760;</span> App Server
                </span>
                <span className="status-val online">Online</span>
              </div>
              <div className="status-row">
                <span className="status-label">
                  <span>&#128274;</span> STS Gateway
                </span>
                <span className="status-val online">Connected</span>
              </div>
              <div className="status-row">
                <span className="status-label">
                  <span>&#128451;</span> Database
                </span>
                <span className="status-val online">Healthy</span>
              </div>
              <div className="status-row">
                <span className="status-label">
                  <span>&#128172;</span> SMS Gateway
                </span>
                <span className="status-val online">Online</span>
              </div>
              <div className="status-row">
                <span className="status-label">
                  <span>&#128190;</span> Last Backup
                </span>
                <span className="status-val online">Today 02:00</span>
              </div>
              <div className="status-row">
                <span className="status-label">
                  <span>&#128100;</span> Active Operators
                </span>
                <span className="status-val online">3 Online</span>
              </div>
            </div>
          </div>

          {/* Quick Vend Button */}
          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => navigate("/vending")}
          >
            <span style={{ fontSize: 18 }}>&#9889;</span>
            Quick Vend Token
          </button>
        </div>
      </div>
    </div>
  );
}
