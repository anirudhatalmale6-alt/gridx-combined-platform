import { useState, useEffect } from "react";
import { vendingAPI } from "../services/api";

/* ---- Mock Data ---- */
const MOCK_OPERATORS = [
  { name: 'System Admin', username: 'admin', role: 'ADMIN', lastLogin: '2026-03-12 08:01', status: 'Online' },
  { name: 'Johannes Amukoto', username: 'j.amukoto', role: 'OPERATOR', lastLogin: '2026-03-12 07:45', status: 'Online' },
  { name: 'Maria Nghidi', username: 'm.nghidi', role: 'OPERATOR', lastLogin: '2026-03-12 07:58', status: 'Online' },
  { name: 'Thomas Hamutenya', username: 't.hamutenya', role: 'SUPERVISOR', lastLogin: '2026-03-12 06:30', status: 'Online' },
  { name: 'Anna Uahengo', username: 'a.uahengo', role: 'VIEWER', lastLogin: '2026-03-11 16:22', status: 'Offline' },
  { name: 'Frans Nghifikepunye', username: 'f.nghifikep', role: 'OPERATOR', lastLogin: '2026-03-10 09:10', status: 'Suspended' },
];

const MOCK_AUDIT = [
  { type: 'vend', time: '2026-03-12 08:47:22', desc: 'Token vended: N$200.00 → 01234567890 (Johannes Shikongo)', user: 'admin • IP: 10.0.1.55' },
  { type: 'login', time: '2026-03-12 08:01:00', desc: 'Admin login successful', user: 'admin • IP: 10.0.1.55 • Session: SES-0847' },
  { type: 'delete', time: '2026-03-11 16:30:00', desc: 'Reversed transaction TXN-2026031100189', user: 'admin • Reason: Customer dispute' },
  { type: 'update', time: '2026-03-11 14:15:00', desc: 'Updated vendor commission rate: Grunau Post 1.0% → 1.2%', user: 't.hamutenya • Approved by: admin' },
  { type: 'create', time: '2026-03-11 10:00:00', desc: 'New customer registered: ACC-2023-009001 (Lahja Uusiku)', user: 'j.amukoto • Area: Groot Aub' },
  { type: 'vend', time: '2026-03-11 09:30:00', desc: 'Token vended: N$500.00 → 01234568001 (Thomas Amukoto)', user: 'j.amukoto • IP: 10.0.1.42' },
  { type: 'login', time: '2026-03-11 07:45:00', desc: 'Failed login attempt for user: unknown_user', user: 'IP: 203.0.113.42 • Blocked after 5 attempts' },
  { type: 'update', time: '2026-03-10 15:00:00', desc: 'System backup completed successfully', user: 'System • Size: 2.4 GB • Duration: 4m 12s' },
];

const PERMISSIONS = [
  { name: 'Vend Tokens', admin: '\u2713', supervisor: '\u2713', operator: '\u2713', viewer: '\u2717' },
  { name: 'View Transactions', admin: '\u2713', supervisor: '\u2713', operator: '\u2713', viewer: '\u2713' },
  { name: 'Reverse Transactions', admin: '\u2713', supervisor: '\u2713', operator: '\u2717', viewer: '\u2717' },
  { name: 'Customer Management', admin: '\u2713', supervisor: '\u2713', operator: 'R/O', viewer: 'R/O' },
  { name: 'Vendor Management', admin: '\u2713', supervisor: '\u2713', operator: '\u2717', viewer: '\u2717' },
  { name: 'Tariff Configuration', admin: '\u2713', supervisor: '\u2717', operator: '\u2717', viewer: '\u2717' },
  { name: 'Reports Access', admin: '\u2713', supervisor: '\u2713', operator: 'Own', viewer: '\u2713' },
  { name: 'System Admin', admin: '\u2713', supervisor: '\u2717', operator: '\u2717', viewer: '\u2717' },
  { name: 'API Access', admin: '\u2713', supervisor: '\u2713', operator: '\u2717', viewer: '\u2717' },
];

/* ---- Helpers ---- */
function roleBadgeClass(role) {
  switch (role) {
    case 'ADMIN': return 'role-badge role-admin';
    case 'OPERATOR': return 'role-badge role-operator';
    case 'SUPERVISOR': return 'role-badge role-supervisor';
    case 'VIEWER': return 'role-badge role-viewer';
    default: return 'role-badge role-viewer';
  }
}

function statusBadgeClass(status) {
  switch (status) {
    case 'Online': return 'badge badge-success';
    case 'Offline': return 'badge badge-muted';
    case 'Suspended': return 'badge badge-danger';
    default: return 'badge badge-muted';
  }
}

function permCellStyle(val) {
  if (val === '\u2713') return { color: '#16a34a', fontWeight: 700, fontSize: 16 };
  if (val === '\u2717') return { color: '#dc2626', fontWeight: 700, fontSize: 16 };
  if (val === 'R/O') return { color: '#2563eb', fontWeight: 600, fontSize: 12 };
  if (val === 'Own') return { color: '#64748b', fontWeight: 600, fontSize: 12 };
  return {};
}

/* ==================================================================== */
/* Admin Page                                                           */
/* ==================================================================== */
export default function Admin() {
  const [operators, setOperators] = useState(MOCK_OPERATORS);
  const [auditLog, setAuditLog] = useState(MOCK_AUDIT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendingAPI.getAuditLog()
      .then((r) => {
        if (r.success && r.data?.length > 0) setAuditLog(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* ===== Page Header ===== */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
          System Administration
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
          Operator management, permissions, configuration, and audit trail
        </p>
      </div>

      {/* ===== Top Section — 2 columns ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* ---- LEFT: Operator Management ---- */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{"\uD83D\uDC65"} Operator Management</div>
              <div className="card-subtitle">Role-based access control</div>
            </div>
            <button className="btn btn-primary btn-sm">+ Add Operator</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="vend-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Last Login</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((op, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{op.name}</td>
                      <td style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "var(--text-secondary)" }}>
                        {op.username}
                      </td>
                      <td>
                        <span className={roleBadgeClass(op.role)}>{op.role}</span>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{op.lastLogin}</td>
                      <td>
                        <span className={statusBadgeClass(op.status)}>{op.status}</span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ---- RIGHT: Role Permissions Matrix ---- */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{"\uD83D\uDD12"} Role Permissions Matrix</div>
              <div className="card-subtitle">Access control by role</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="vend-table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th style={{ textAlign: "center" }}>Admin</th>
                    <th style={{ textAlign: "center" }}>Supervisor</th>
                    <th style={{ textAlign: "center" }}>Operator</th>
                    <th style={{ textAlign: "center" }}>Viewer</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS.map((perm, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{perm.name}</td>
                      <td style={{ textAlign: "center", ...permCellStyle(perm.admin) }}>{perm.admin}</td>
                      <td style={{ textAlign: "center", ...permCellStyle(perm.supervisor) }}>{perm.supervisor}</td>
                      <td style={{ textAlign: "center", ...permCellStyle(perm.operator) }}>{perm.operator}</td>
                      <td style={{ textAlign: "center", ...permCellStyle(perm.viewer) }}>{perm.viewer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Bottom Section — 2 columns ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* ---- LEFT: System Configuration ---- */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{"\u2699\uFE0F"} System Configuration</div>
            </div>
          </div>
          <div className="card-body">
            <div className="form-row col-2">
              <div className="field">
                <label>STS Gateway Host</label>
                <input type="text" defaultValue="sts-gateway.nampower.com.na" readOnly />
              </div>
              <div className="field">
                <label>Port</label>
                <input type="text" defaultValue="8583" readOnly />
              </div>
            </div>
            <div className="form-row col-2">
              <div className="field">
                <label>Token Algorithm</label>
                <input type="text" defaultValue="STS Standard (IEC 62055-41)" readOnly />
              </div>
              <div className="field">
                <label>Encryption Standard</label>
                <input type="text" defaultValue="DES/3DES with DKGA04" readOnly />
              </div>
            </div>
            <div className="form-row col-2">
              <div className="field">
                <label>Session Timeout</label>
                <input type="text" defaultValue="30 minutes" />
              </div>
              <div className="field">
                <label>Max Login Attempts</label>
                <input type="number" defaultValue="5" />
              </div>
            </div>
            <div className="form-row col-2">
              <div className="field">
                <label>Backup Schedule</label>
                <input type="text" defaultValue="Daily at 02:00 AM" />
              </div>
              <div className="field">
                <label>Retention</label>
                <input type="text" defaultValue="90 days" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary">Save Settings</button>
              <button className="btn btn-secondary">Test Gateway</button>
              <button className="btn btn-danger btn-sm">Restart Services</button>
            </div>
          </div>
        </div>

        {/* ---- RIGHT: Audit Log ---- */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{"\uD83D\uDCCB"} Audit Log</div>
              <div className="card-subtitle">Recent system activity</div>
            </div>
          </div>
          <div className="card-body" style={{ maxHeight: 420, overflowY: "auto", padding: "16px 24px" }}>
            {auditLog.map((entry, idx) => (
              <div key={idx} className={`audit-item ${entry.type}`}>
                <div className="audit-time">{entry.time}</div>
                <div className="audit-desc">{entry.desc}</div>
                <div className="audit-user">{entry.user}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
