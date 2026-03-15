import { useState, useEffect, useMemo } from "react";
import { vendingAPI } from "../services/api";

// ---- Mock Data ----
const MOCK_TXN = [
  { id: 1, dateTime: '2026-03-12 08:47:22', refNo: 'TXN-2026031200247', customer: 'Johannes Shikongo', meterNo: '01234567890', amount: 200, kWh: 124.6, token: '6234-8901-2345-6789-0123', operator: 'S.Admin', status: 'Completed' },
  { id: 2, dateTime: '2026-03-12 08:31:05', refNo: 'TXN-2026031200246', customer: 'Maria Nghidishange', meterNo: '01234567912', amount: 100, kWh: 60.8, token: '4521-7893-1054-2367-8901', operator: 'J.Amukoto', status: 'Completed' },
  { id: 3, dateTime: '2026-03-12 08:19:44', refNo: 'TXN-2026031200245', customer: 'Thomas Amukoto', meterNo: '01234568001', amount: 500, kWh: 318.5, token: '7812-3456-9012-3456-7890', operator: 'S.Admin', status: 'Completed' },
  { id: 4, dateTime: '2026-03-12 07:58:11', refNo: 'TXN-2026031200244', customer: 'Anna Hamunyela', meterNo: '01234568112', amount: 50, kWh: 29.4, token: '3301-5678-4490-1234-5678', operator: 'M.Nghidi', status: 'Completed' },
  { id: 5, dateTime: '2026-03-12 07:42:36', refNo: 'TXN-2026031200243', customer: 'Simon Iiyambo', meterNo: '01234568230', amount: 25, kWh: 13.8, token: '9920-1122-3344-5566-7788', operator: 'J.Amukoto', status: 'Completed' },
  { id: 6, dateTime: '2026-03-12 07:28:50', refNo: 'TXN-2026031200242', customer: 'Selma Nakamhela', meterNo: '01234568341', amount: 200, kWh: 121.3, token: '1144-2255-3366-4477-5588', operator: 'S.Admin', status: 'Completed', hasArrears: true },
  { id: 7, dateTime: '2026-03-12 07:15:03', refNo: 'TXN-2026031200241', customer: 'David Hashiyana', meterNo: '01234568455', amount: 100, kWh: 59.2, token: '5566-7788-9900-1122-3344', operator: 'T.Hamute', status: 'Completed' },
  { id: 8, dateTime: '2026-03-12 06:30:02', refNo: 'TXN-2026031200240', customer: 'Lahja Uusiku', meterNo: '01234568789', amount: 500, kWh: 0, token: '', operator: 'S.Admin', status: 'Failed' },
];

const TYPE_OPTIONS = ['All Types', 'Sale', 'Reversal', 'Reprint', 'Test Token'];
const STATUS_OPTIONS = ['All', 'Success', 'Failed', 'Reversed'];
const PAGE_SIZE = 15;

// ---- Helpers ----
const fmtCurrency = (n) =>
  `N$ ${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function formatDateTime(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  return (
    d.toLocaleDateString('en-NA', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-NA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
}

function statusBadgeClass(status) {
  switch (status) {
    case 'Completed':
    case 'Success':
      return 'badge badge-success';
    case 'Failed':
      return 'badge badge-danger';
    case 'Reversed':
      return 'badge badge-muted';
    default:
      return 'badge badge-info';
  }
}

function statusLabel(status, hasArrears) {
  if (hasArrears && (status === 'Completed' || status === 'Success')) {
    return (
      <span className="badge badge-warning">
        &#9888; Arrears
      </span>
    );
  }
  return <span className={statusBadgeClass(status)}>{status}</span>;
}

// ---- Component ----
export default function Transactions() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All');
  const [transactions, setTransactions] = useState(MOCK_TXN);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);

  // Reversal dialog state
  const [reverseTarget, setReverseTarget] = useState(null);
  const [reverseReason, setReverseReason] = useState('');

  // Fetch from API
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter !== 'All Types') params.type = typeFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await vendingAPI.getTransactions(params);
      if (res.success && res.data?.length > 0) {
        setTransactions(res.data);
      }
    } catch {
      // Keep mock data as fallback
    }
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, []);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          (t.refNo || '').toLowerCase().includes(q) ||
          (t.customer || t.customerName || '').toLowerCase().includes(q) ||
          (t.meterNo || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        const txDate = new Date(t.dateTime);
        if (txDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        const txDate = new Date(t.dateTime);
        if (txDate > to) return false;
      }
      if (typeFilter !== 'All Types' && t.type && t.type !== typeFilter) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      return true;
    });
  }, [search, dateFrom, dateTo, typeFilter, statusFilter, transactions]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const paged = filtered.slice(pageStart, pageEnd);

  useEffect(() => { setPage(1); }, [search, dateFrom, dateTo, typeFilter, statusFilter]);

  // Summary
  const totalAmount = filtered.reduce((s, t) => s + Number(t.amount || 0), 0);
  const todayCount = filtered.filter((t) => {
    const d = new Date(t.dateTime);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // Handlers
  const handleApplyFilters = () => {
    fetchTransactions();
  };

  const handleReverse = async () => {
    if (!reverseTarget || !reverseReason.trim()) return;
    try {
      const res = await vendingAPI.reverseTransaction(reverseTarget.id, reverseReason);
      if (res.success) {
        showToast('Transaction reversed successfully', 'success');
        fetchTransactions();
      }
    } catch (err) {
      showToast(err.message || 'Reversal failed', 'error');
    }
    setReverseTarget(null);
    setReverseReason('');
  };

  const handleReprint = async (txn) => {
    try {
      const res = await vendingAPI.reprintToken(txn.id);
      if (res.success) {
        showToast(`Reprinting token for ${txn.customer || txn.customerName}`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Reprint failed', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const header = ['Date/Time', 'Reference', 'Customer', 'Meter No', 'Amount', 'kWh', 'STS Token', 'Operator', 'Status'];
    const rows = filtered.map((t) => [
      t.dateTime,
      t.refNo,
      t.customer || t.customerName || '',
      t.meterNo,
      t.amount,
      t.kWh,
      t.token,
      t.operator,
      t.status,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF (simple print-based)
  const handleExportPDF = () => {
    window.print();
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
      {/* ===== Filter Card ===== */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <div className="form-row col-5" style={{ gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr', alignItems: 'end' }}>
            <div className="field">
              <label>Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Customer / Meter</label>
              <input
                type="text"
                placeholder="Search ref, customer, meter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Transaction Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button className="btn btn-primary" onClick={handleApplyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* ===== Transaction History Card ===== */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Transaction History</div>
            <div className="card-subtitle">
              March 2026 &mdash; {todayCount} transactions today
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
              Export CSV
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
              Export PDF
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="vend-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Meter No.</th>
                  <th style={{ textAlign: 'right' }}>Amount (N$)</th>
                  <th style={{ textAlign: 'right' }}>kWh</th>
                  <th>STS Token</th>
                  <th>Operator</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((t) => (
                  <tr key={t.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {formatDateTime(t.dateTime)}
                    </td>
                    <td className="mono ref-cell">{t.refNo}</td>
                    <td style={{ fontWeight: 500 }}>{t.customer || t.customerName || '-'}</td>
                    <td className="mono ref-cell">{t.meterNo}</td>
                    <td className="mono amount-cell" style={{ textAlign: 'right' }}>
                      {fmtCurrency(t.amount)}
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {Number(t.kWh || 0).toFixed(2)}
                    </td>
                    <td className="token-cell">
                      {t.token ? t.token : <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>}
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {t.operator || '-'}
                    </td>
                    <td>
                      {statusLabel(t.status, t.hasArrears)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '14px', minWidth: 'auto' }}
                          title="Reprint"
                          onClick={() => handleReprint(t)}
                        >
                          &#128424;
                        </button>
                        {(t.status === 'Completed' || t.status === 'Success') && !t.hasArrears && (
                          <button
                            className="btn btn-sm"
                            style={{
                              padding: '4px 8px',
                              fontSize: '14px',
                              minWidth: 'auto',
                              background: 'rgba(239,68,68,0.1)',
                              color: 'var(--danger)',
                              border: '1px solid rgba(239,68,68,0.2)',
                            }}
                            title="Reverse"
                            onClick={() => { setReverseTarget(t); setReverseReason(''); }}
                          >
                            &#8630;
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                      No transactions match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Row + Pagination */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Showing {pageStart + 1}&ndash;{pageEnd} of {filtered.length} transactions &bull; Total: <strong className="mono">{fmtCurrency(totalAmount)}</strong>
            </span>

            {totalPages > 1 && (
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
            )}
          </div>
        </div>
      </div>

      {/* ===== Reversal Confirmation Modal ===== */}
      {reverseTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => { setReverseTarget(null); setReverseReason(''); }}
        >
          <div
            className="card"
            style={{ width: '480px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div className="card-title" style={{ color: 'var(--danger)' }}>Confirm Reversal</div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.6 }}>
                You are about to reverse transaction{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{reverseTarget.refNo}</strong>{' '}
                for customer{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{reverseTarget.customer || reverseTarget.customerName}</strong>{' '}
                ({fmtCurrency(reverseTarget.amount)}).
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                This action cannot be undone. Please provide a reason for the reversal.
              </p>
              <div className="field">
                <label>Reason for reversal</label>
                <textarea
                  rows={3}
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  placeholder="Enter reason..."
                  style={{
                    padding: '10px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: '7px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    background: '#fff',
                    outline: 'none',
                    resize: 'vertical',
                    width: '100%',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setReverseTarget(null); setReverseReason(''); }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleReverse}
                  disabled={!reverseReason.trim()}
                  style={{ opacity: reverseReason.trim() ? 1 : 0.5 }}
                >
                  &#8630; Reverse Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Toast Notification ===== */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 2000,
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#fff',
            background: toast.type === 'success'
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : 'linear-gradient(135deg, #ef4444, #dc2626)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            animation: 'tokenReveal 0.3s ease-out forwards',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
