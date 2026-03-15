import { useState, useEffect, useMemo } from "react";
import { vendingAPI } from "../services/api";

// ---- Mock Data ----
const MOCK = [
  { accountId: 'ACC-2019-004521', name: 'Johannes Shikongo', meterNo: '01234567890', area: 'Grunau', tariff: 'R1', arrears: 0, status: 'Active', phone: '+264 81 234 5678', idNumber: '8201015012083', address: 'Erf 142, Main Road, Grunau', supplyGroupCode: 'SG-GRN-001', keyRevision: '1', tokenTech: 'STS', meterMake: 'Conlog', gpsLat: '-28.0486', gpsLng: '18.3642' },
  { accountId: 'ACC-2020-005102', name: 'Maria Nghidishange', meterNo: '01234567912', area: 'Grunau', tariff: 'R1', arrears: 0, status: 'Active', phone: '+264 81 345 6789', idNumber: '9005024012087', address: 'Erf 88, Church St, Grunau', supplyGroupCode: 'SG-GRN-001', keyRevision: '1', tokenTech: 'STS', meterMake: 'Hexing', gpsLat: '-28.0502', gpsLng: '18.3615' },
  { accountId: 'ACC-2018-002876', name: 'Thomas Amukoto', meterNo: '01234568001', area: 'Noordoewer', tariff: 'R2', arrears: 0, status: 'Active', phone: '+264 81 456 7890', idNumber: '7603125012085', address: 'Plot 23, River Drive, Noordoewer', supplyGroupCode: 'SG-NRD-002', keyRevision: '2', tokenTech: 'STS', meterMake: 'Landis+Gyr', gpsLat: '-28.7683', gpsLng: '17.6108' },
  { accountId: 'ACC-2021-006340', name: 'Anna Hamunyela', meterNo: '01234568112', area: 'Groot Aub', tariff: 'R1', arrears: 0, status: 'Active', phone: '+264 81 567 8901', idNumber: '8808104012089', address: 'Erf 310, Jacaranda Ave, Groot Aub', supplyGroupCode: 'SG-GAB-001', keyRevision: '1', tokenTech: 'STS', meterMake: 'Conlog', gpsLat: '-22.6317', gpsLng: '17.1294' },
  { accountId: 'ACC-2017-001204', name: 'Simon Iiyambo', meterNo: '01234568230', area: 'Dordabis', tariff: 'R1', arrears: 0, status: 'Active', phone: '+264 81 678 9012', idNumber: '7210215012081', address: 'Farm 45, Dordabis Settlement', supplyGroupCode: 'SG-DRD-001', keyRevision: '1', tokenTech: 'STS', meterMake: 'Hexing', gpsLat: '-22.9658', gpsLng: '17.6875' },
  { accountId: 'ACC-2016-000892', name: 'Selma Nakamhela', meterNo: '01234568341', area: 'Seeis', tariff: 'C1', arrears: 345.60, status: 'Arrears', phone: '+264 81 789 0123', idNumber: '8505104012082', address: 'Erf 17, Industrial Area, Seeis', supplyGroupCode: 'SG-SEE-003', keyRevision: '1', tokenTech: 'STS', meterMake: 'Landis+Gyr', gpsLat: '-22.5214', gpsLng: '17.3401' },
  { accountId: 'ACC-2022-007815', name: 'David Hashiyana', meterNo: '01234568455', area: 'Stampriet', tariff: 'R1', arrears: 0, status: 'Active', phone: '+264 81 890 1234', idNumber: '9907085012086', address: 'Erf 62, Palm Lane, Stampriet', supplyGroupCode: 'SG-STP-001', keyRevision: '1', tokenTech: 'STS', meterMake: 'Conlog', gpsLat: '-24.0833', gpsLng: '18.1333' },
  { accountId: 'ACC-2019-004788', name: 'Hilka Nambinga', meterNo: '01234568567', area: 'Grunau', tariff: 'R1', arrears: 0, status: 'Active', phone: '+264 81 901 2345', idNumber: '9203054012088', address: 'Erf 201, Station Rd, Grunau', supplyGroupCode: 'SG-GRN-001', keyRevision: '1', tokenTech: 'STS', meterMake: 'Hexing', gpsLat: '-28.0491', gpsLng: '18.3639' },
  { accountId: 'ACC-2015-000312', name: 'Frans Nghifikepunye', meterNo: '01234568678', area: 'Noordoewer', tariff: 'R2', arrears: 1280.00, status: 'Suspended', phone: '+264 81 012 3456', idNumber: '6811085012084', address: 'Plot 8, Border Rd, Noordoewer', supplyGroupCode: 'SG-NRD-002', keyRevision: '2', tokenTech: 'STS', meterMake: 'Landis+Gyr', gpsLat: '-28.7701', gpsLng: '17.6095' },
  { accountId: 'ACC-2023-009001', name: 'Lahja Uusiku', meterNo: '01234568789', area: 'Groot Aub', tariff: 'R1', arrears: 0, status: 'Active', phone: '+264 81 123 4567', idNumber: '0102054012080', address: 'Erf 415, Baobab Cres, Groot Aub', supplyGroupCode: 'SG-GAB-001', keyRevision: '1', tokenTech: 'STS', meterMake: 'Conlog', gpsLat: '-22.6330', gpsLng: '17.1281' },
];

const AREAS = ['All Areas', 'Grunau', 'Noordoewer', 'Groot Aub', 'Dordabis', 'Seeis', 'Stampriet'];
const STATUSES = ['All Statuses', 'Active', 'Suspended', 'Arrears'];
const PAGE_SIZE = 15;

// ---- Helpers ----
const fmtCurrency = (n) =>
  `N$ ${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function statusBadgeClass(status) {
  switch (status) {
    case 'Active': return 'badge badge-success';
    case 'Arrears': return 'badge badge-warning';
    case 'Suspended': return 'badge badge-danger';
    default: return 'badge badge-muted';
  }
}

// ---- Component ----
export default function Customers() {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All Areas');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [customers, setCustomers] = useState(MOCK);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [page, setPage] = useState(1);

  // Fetch from API, fallback to mock
  useEffect(() => {
    vendingAPI.getCustomers()
      .then((r) => {
        if (r.success && r.data?.length > 0) setCustomers(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filtered list
  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          (c.name || '').toLowerCase().includes(q) ||
          (c.meterNo || '').toLowerCase().includes(q) ||
          (c.accountId || '').toLowerCase().includes(q) ||
          (c.area || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (areaFilter !== 'All Areas' && c.area !== areaFilter) return false;
      if (statusFilter !== 'All Statuses' && c.status !== statusFilter) return false;
      return true;
    });
  }, [search, areaFilter, statusFilter, customers]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const paged = filtered.slice(pageStart, pageEnd);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, areaFilter, statusFilter]);

  // Selected customer
  const selected = selectedIdx !== null ? customers.find((_, i) => i === selectedIdx) || null : null;

  // Total arrears
  const totalArrears = customers.reduce((s, c) => s + Number(c.arrears || 0), 0);

  // Export CSV
  const handleExport = () => {
    const header = ['Account', 'Name', 'Meter No', 'Area', 'Tariff', 'Arrears', 'Status'];
    const rows = filtered.map((c) => [
      c.accountId, c.name, c.meterNo, c.area, c.tariff, c.arrears, c.status,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Vend button handler
  const handleVend = (meterNo) => {
    // Navigate to vending with meter param, or just alert if router not available
    if (window.location.pathname !== '/vending') {
      window.location.href = `/vending?meter=${encodeURIComponent(meterNo)}`;
    } else {
      alert(`Navigate to vending for meter: ${meterNo}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* ===== Filter Bar ===== */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search name, meter, account, or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button>Search</button>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: '7px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: 'var(--text-primary)',
              background: '#fff',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '150px',
            }}
          >
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: '7px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: 'var(--text-primary)',
              background: '#fff',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '140px',
            }}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => alert('Add Customer dialog coming soon')}>
          + Add Customer
        </button>
        <button className="btn btn-secondary" onClick={handleExport}>
          Export
        </button>
      </div>

      {/* ===== Customer Management Layout ===== */}
      <div className="cust-mgmt-layout">
        {/* LEFT: Customer Registry Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Customer Registry</div>
              <div className="card-subtitle">
                {customers.length.toLocaleString()} registered meters &mdash; showing {pageStart + 1}&ndash;{pageEnd}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Total Arrears</div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: totalArrears > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {fmtCurrency(totalArrears)}
              </div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="vend-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Customer Name</th>
                    <th>Meter No.</th>
                    <th>Area</th>
                    <th>Tariff</th>
                    <th style={{ textAlign: 'right' }}>Arrears</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((c, idx) => {
                    const globalIdx = customers.indexOf(c);
                    const isSelected = globalIdx === selectedIdx;
                    return (
                      <tr
                        key={c.accountId}
                        onClick={() => setSelectedIdx(globalIdx)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'var(--accent-glow)' : undefined,
                          borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                        }}
                      >
                        <td className="mono ref-cell">{c.accountId}</td>
                        <td style={{ fontWeight: 500 }}>{c.name}</td>
                        <td className="mono ref-cell">{c.meterNo}</td>
                        <td>{c.area}</td>
                        <td>{c.tariff}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="mono amount-cell" style={{ color: c.arrears > 0 ? 'var(--danger)' : 'var(--success)' }}>
                            {fmtCurrency(c.arrears)}
                          </span>
                        </td>
                        <td>
                          <span className={statusBadgeClass(c.status)}>{c.status}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(e) => { e.stopPropagation(); handleVend(c.meterNo); }}
                          >
                            Vend
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                        No customers match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Showing {pageStart + 1}&ndash;{pageEnd} of {filtered.length} customers
                </span>
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    &lsaquo;
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`page-btn${page === pageNum ? ' active' : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    className="page-btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    &rsaquo;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Selected Customer Detail Panel */}
        <div className="meter-info-panel">
          {selected ? (
            <>
              {/* Name + Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                  {selected.name}
                </div>
                <span className={statusBadgeClass(selected.status)}>
                  {selected.status}
                </span>
              </div>

              {/* Meter Badge */}
              <div className="meter-badge">
                <span>&#9889;</span>
                {selected.meterNo}
              </div>

              {/* Detail Rows */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '12px', marginBottom: '12px' }}>
                <div className="cust-detail-row">
                  <span className="cust-detail-label">Address</span>
                  <span className="cust-detail-value">{selected.address || '-'}</span>
                </div>
                <div className="cust-detail-row">
                  <span className="cust-detail-label">ID Number</span>
                  <span className="cust-detail-value mono">{selected.idNumber || '-'}</span>
                </div>
                <div className="cust-detail-row">
                  <span className="cust-detail-label">Phone</span>
                  <span className="cust-detail-value">{selected.phone || '-'}</span>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '12px', marginBottom: '12px' }}>
                <div className="cust-detail-row">
                  <span className="cust-detail-label">Tariff Group</span>
                  <span className="cust-detail-value">{selected.tariff}</span>
                </div>
                <div className="cust-detail-row">
                  <span className="cust-detail-label">Supply Group Code</span>
                  <span className="cust-detail-value mono">{selected.supplyGroupCode || '-'}</span>
                </div>
                <div className="cust-detail-row">
                  <span className="cust-detail-label">Key Revision</span>
                  <span className="cust-detail-value">{selected.keyRevision || '-'}</span>
                </div>
                <div className="cust-detail-row">
                  <span className="cust-detail-label">Token Technology</span>
                  <span className="cust-detail-value">{selected.tokenTech || 'STS'}</span>
                </div>
                <div className="cust-detail-row">
                  <span className="cust-detail-label">Meter Make</span>
                  <span className="cust-detail-value">{selected.meterMake || '-'}</span>
                </div>
              </div>

              {/* GPS */}
              {selected.gpsLat && selected.gpsLng && (
                <div className="gps-display" style={{ marginBottom: '16px' }}>
                  <span>&#128205;</span>
                  {selected.gpsLat}, {selected.gpsLng}
                </div>
              )}

              {/* Arrears Display */}
              <div style={{ textAlign: 'center', margin: '16px 0', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                  Outstanding Arrears
                </div>
                <div className="mono" style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: selected.arrears > 0 ? '#f59e0b' : '#22c55e',
                }}>
                  {fmtCurrency(selected.arrears)}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleVend(selected.meterNo)}
                >
                  <span>&#9889;</span> Vend Token
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                    onClick={() => alert('Edit details coming soon')}
                  >
                    Edit Details
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                    onClick={() => alert('Transaction history coming soon')}
                  >
                    History
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                    onClick={() => alert('Send SMS coming soon')}
                  >
                    Send SMS
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => alert(`${selected.status === 'Suspended' ? 'Activate' : 'Suspend'} account coming soon`)}
                  >
                    {selected.status === 'Suspended' ? 'Activate' : 'Suspend Account'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', opacity: 0.15, marginBottom: '12px' }}>&#128100;</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
                Select a customer from the table to view details.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
