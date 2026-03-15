import { useState, useEffect } from "react";
import { vendingAPI } from "../services/api";

// ---- Mock Data ----
const MOCK_GROUPS = [
  { id: 1, name: 'R1 — Residential Block Tariff', sgc: '000001', customerCount: 2241, type: 'Step', effectiveDate: '2025-07-01', blocks: [
    { name: 'Block 1', rangeLabel: '0 – 50 kWh', rate: 1.28, minKwh: 0, maxKwh: 50 },
    { name: 'Block 2', rangeLabel: '51 – 350 kWh', rate: 1.56, minKwh: 51, maxKwh: 350 },
    { name: 'Block 3', rangeLabel: '351+ kWh', rate: 1.89, minKwh: 351, maxKwh: 999999 },
  ]},
  { id: 2, name: 'R2 — Residential High Consumption', sgc: '000002', customerCount: 512, type: 'Step', effectiveDate: '2025-07-01', blocks: [
    { name: 'Block 1', rangeLabel: '0 – 100 kWh', rate: 1.45, minKwh: 0, maxKwh: 100 },
    { name: 'Block 2', rangeLabel: '101 – 500 kWh', rate: 1.72, minKwh: 101, maxKwh: 500 },
    { name: 'Block 3', rangeLabel: '501+ kWh', rate: 2.10, minKwh: 501, maxKwh: 999999 },
  ]},
  { id: 3, name: 'C1 — Commercial Tariff', sgc: '000003', customerCount: 247, type: 'Flat', effectiveDate: '2025-07-01', blocks: [
    { name: 'Flat Rate', rangeLabel: 'All usage', rate: 1.98, minKwh: 0, maxKwh: 999999 },
  ]},
];

const MOCK_CONFIG = {
  vatRate: 15.0,
  fixedCharge: 8.50,
  relLevy: 2.40,
  minPurchase: 10.00,
  arrearsMode: 'auto-deduct',
  arrearsThreshold: 500.00,
};

const MOCK_LOG = [
  { type: 'update', time: '2026-01-01 00:00:00', desc: 'R1 Block 1 rate updated: N$1.22 → N$1.28/kWh', detail: 'Approved by: NamPower Tariff Division • Ref: TAR-2026-001' },
  { type: 'update', time: '2025-07-01 00:00:00', desc: 'VAT rate maintained at 15.0% — Annual Review', detail: 'No change required • Ref: VAT-2025-R' },
  { type: 'create', time: '2025-01-15 00:00:00', desc: 'New tariff group C1 created for commercial meters', detail: 'Approved by: Board Resolution BR-2025-003' },
];

function blockBorderClass(idx) {
  if (idx === 0) return 'tariff-block';
  if (idx === 1) return 'tariff-block b2';
  return 'tariff-block b3';
}

function auditItemClass(type) {
  return `audit-item ${type}`;
}

export default function Tariffs() {
  const [tariffGroups, setTariffGroups] = useState(MOCK_GROUPS);
  const [config, setConfig] = useState({ ...MOCK_CONFIG });
  const [changeLog] = useState(MOCK_LOG);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    vendingAPI.getTariffGroups()
      .then((r) => {
        if (r.success && r.data?.length > 0) setTariffGroups(r.data);
      })
      .catch(() => {});

    vendingAPI.getTariffConfig()
      .then((r) => {
        if (r.success && r.data) {
          setConfig({
            vatRate: r.data.vatRate ?? MOCK_CONFIG.vatRate,
            fixedCharge: r.data.fixedCharge ?? MOCK_CONFIG.fixedCharge,
            relLevy: r.data.relLevy ?? MOCK_CONFIG.relLevy,
            minPurchase: r.data.minPurchase ?? MOCK_CONFIG.minPurchase,
            arrearsMode: r.data.arrearsMode ?? MOCK_CONFIG.arrearsMode,
            arrearsThreshold: r.data.arrearsThreshold ?? MOCK_CONFIG.arrearsThreshold,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (field) => (e) => {
    setConfig((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await vendingAPI.updateTariffConfig(config);
      setSaveMsg('Configuration saved successfully.');
    } catch (err) {
      setSaveMsg(err.message || 'Save failed.');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 4000);
  };

  return (
    <div>
      {/* ===== Page Header ===== */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
          Tariff Management
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
          Step tariff configuration per IEC 62055-41
        </p>
      </div>

      {/* ===== Two-Column Layout ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* LEFT - Tariff Groups */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Tariff Groups</div>
              <div className="card-subtitle">Step tariff configuration per IEC 62055-41</div>
            </div>
            <button className="btn btn-primary btn-sm">+ Add Group</button>
          </div>
          <div className="card-body">
            {tariffGroups.map((group) => (
              <div key={group.id} style={{ marginBottom: 24 }}>
                {/* Group header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                      {group.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      SGC: <span className="mono" style={{ color: "var(--accent)" }}>{group.sgc}</span>
                      &nbsp;&middot;&nbsp;
                      {Number(group.customerCount).toLocaleString()} customers
                    </div>
                  </div>
                  <span className="badge badge-success">Active</span>
                </div>

                {/* Tariff blocks */}
                {group.blocks.map((block, idx) => (
                  <div key={idx} className={blockBorderClass(idx)}>
                    <div className="tariff-range">
                      {block.name}: {block.rangeLabel}
                    </div>
                    <div className="tariff-rate">
                      N${Number(block.rate).toFixed(2)}
                      <span className="tariff-unit">/kWh</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT - Stacked: Config + Change Log */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Fixed Charges & Levies */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Fixed Charges & Levies</div>
            </div>
            <div className="card-body">
              <div className="form-row col-2">
                <div className="field">
                  <label>VAT Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.vatRate}
                    onChange={handleChange('vatRate')}
                  />
                </div>
                <div className="field">
                  <label>Fixed Monthly Charge (N$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.fixedCharge}
                    onChange={handleChange('fixedCharge')}
                  />
                </div>
              </div>
              <div className="form-row col-2">
                <div className="field">
                  <label>REL Levy (N$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.relLevy}
                    onChange={handleChange('relLevy')}
                  />
                </div>
                <div className="field">
                  <label>Min. Purchase Amount (N$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.minPurchase}
                    onChange={handleChange('minPurchase')}
                  />
                </div>
              </div>
              <div className="form-row col-2">
                <div className="field">
                  <label>Arrears Collection Mode</label>
                  <select value={config.arrearsMode} onChange={handleChange('arrearsMode')}>
                    <option value="auto-deduct">Auto-Deduct</option>
                    <option value="manual">Manual</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div className="field">
                  <label>Arrears Threshold (N$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.arrearsThreshold}
                    onChange={handleChange('arrearsThreshold')}
                  />
                </div>
              </div>

              {saveMsg && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  marginBottom: 12,
                  fontSize: 13,
                  background: saveMsg.includes('fail') ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                  color: saveMsg.includes('fail') ? "var(--danger)" : "var(--success)",
                  border: `1px solid ${saveMsg.includes('fail') ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                }}>
                  {saveMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-success" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary">Tariff History</button>
              </div>
            </div>
          </div>

          {/* Tariff Change Log */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Tariff Change Log</div>
            </div>
            <div className="card-body">
              {changeLog.map((item, idx) => (
                <div key={idx} className={auditItemClass(item.type)}>
                  <div className="audit-time">{item.time}</div>
                  <div className="audit-desc">{item.desc}</div>
                  <div className="audit-user">{item.detail}</div>
                </div>
              ))}
              {changeLog.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px 0" }}>
                  No tariff changes recorded.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
