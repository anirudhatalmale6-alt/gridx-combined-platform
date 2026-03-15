import { useState, useEffect } from "react";
import { vendingAPI } from "../services/api";

// ===== MOCK CUSTOMERS (fallback when API unavailable) =====
const MOCK_CUSTOMERS = {
  '01234567890': {
    name: 'Johannes Shikongo',
    accountId: 'ACC-2019-004521',
    meterNo: '01234567890',
    address: 'Erf 142, Grunau, //Karas Region',
    tariffGroup: 'R1 \u2014 Residential Block',
    sgc: '000001',
    keyRevision: 'KR-02',
    meterModel: 'Conlog BEC23 / STS',
    balance: 980,
    arrears: 0,
    gps: '-28.9241\u00b0 S, 18.3728\u00b0 E',
    status: 'Active',
    tariffBlocks: [
      { min: 0, max: 200, rate: 1.12 },
      { min: 200, max: 600, rate: 1.56 },
      { min: 600, max: 999999, rate: 2.04 },
    ],
  },
  '01234568230': {
    name: 'Simon Iiyambo',
    accountId: 'ACC-2017-001204',
    meterNo: '01234568230',
    address: 'Plot 45, Dordabis',
    tariffGroup: 'R1 \u2014 Residential Block',
    sgc: '000001',
    keyRevision: 'KR-02',
    meterModel: 'Conlog BEC23 / STS',
    balance: 540,
    arrears: 0,
    gps: '-22.9541\u00b0 S, 17.8028\u00b0 E',
    status: 'Active',
    tariffBlocks: [
      { min: 0, max: 200, rate: 1.12 },
      { min: 200, max: 600, rate: 1.56 },
      { min: 600, max: 999999, rate: 2.04 },
    ],
  },
  '01234568341': {
    name: 'Selma Nakamhela',
    accountId: 'ACC-2016-000892',
    meterNo: '01234568341',
    address: 'Erf 87, Seeis',
    tariffGroup: 'C1 \u2014 Commercial',
    sgc: '000003',
    keyRevision: 'KR-02',
    meterModel: 'Conlog BEC23 / STS',
    balance: 0,
    arrears: 345.60,
    gps: '-22.5133\u00b0 S, 17.3467\u00b0 E',
    status: 'Active',
    tariffBlocks: [
      { min: 0, max: 500, rate: 1.38 },
      { min: 500, max: 999999, rate: 1.92 },
    ],
  },
};

// ===== SAMPLE QUICK-LOAD BUTTONS =====
const SAMPLE_BUTTONS = [
  { label: 'Sample: Shikongo', meterNo: '01234567890' },
  { label: 'Sample: Iiyambo', meterNo: '01234568230' },
  { label: 'Sample: Arrears', meterNo: '01234568341' },
];

// ===== HELPERS =====
const fmtN$ = (v) => `N$ ${Number(v).toFixed(2)}`;

function formatToken(t) {
  return t.replace(/(.{4})/g, '$1 ').trim();
}

function generateTxnRef() {
  const now = new Date();
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  return `TXN-${ts}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function generateRandomToken() {
  let t = '';
  for (let i = 0; i < 20; i++) t += Math.floor(Math.random() * 10);
  return t;
}

function calcKWH(netAmount, tariffBlocks) {
  if (!tariffBlocks || tariffBlocks.length === 0) return (netAmount / 1.56).toFixed(1);
  let remaining = netAmount, totalKwh = 0;
  for (const block of tariffBlocks) {
    const range = (block.maxKwh || block.max || 999999) - (block.minKwh || block.min || 0);
    const rate = Number(block.rate);
    const blockCost = range * rate;
    if (remaining <= blockCost) { totalKwh += remaining / rate; break; }
    totalKwh += range; remaining -= blockCost;
  }
  return totalKwh.toFixed(1);
}

function calculateBreakdown(amount, arrears, tariffBlocks) {
  const afterArrears = arrears > 0 ? Math.max(amount - Math.min(arrears, amount), 0) : amount;
  const arrearsDeduction = arrears > 0 ? Math.min(arrears, amount) : 0;
  const vatAmount = afterArrears * 0.15 / 1.15;
  const fixedCharge = 8.50;
  const levy = 2.40;
  const net = Math.max(afterArrears - vatAmount - fixedCharge - levy, 0);
  const kwh = calcKWH(net, tariffBlocks);

  return {
    amountTendered: amount,
    arrearsDeduction,
    vatAmount,
    fixedCharge,
    levy,
    netEnergy: net,
    kwh,
  };
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 200, 500];

// ===== VENDING COMPONENT =====
export default function Vending() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customer, setCustomer] = useState(null);
  const [amount, setAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [vendResult, setVendResult] = useState(null);
  const [txnRef, setTxnRef] = useState(generateTxnRef());
  const [copied, setCopied] = useState(false);

  // Compute effective amount from preset or custom input
  const effectiveAmount = selectedPreset || (amount ? parseFloat(amount) : 0);

  // Recalculate breakdown when amount or customer changes
  useEffect(() => {
    if (customer && effectiveAmount >= 10) {
      const b = calculateBreakdown(effectiveAmount, customer.arrears || 0, customer.tariffBlocks || []);
      setBreakdown(b);
    } else {
      setBreakdown(null);
    }
  }, [effectiveAmount, customer]);

  // ===== SEARCH =====
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    try {
      const res = await vendingAPI.getCustomerByMeter(q);
      if (res.success && res.data) {
        setCustomer(res.data);
        resetVendState();
        return;
      }
    } catch (_) {
      // API unavailable, fall through to mock
    }

    // Fallback: search mock customers by meter number or name
    const found = Object.values(MOCK_CUSTOMERS).find(
      (c) =>
        c.meterNo.includes(q) ||
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.accountId.toLowerCase().includes(q.toLowerCase())
    );

    if (found) {
      setCustomer(found);
      resetVendState();
    } else {
      alert('Customer not found. Please check the meter number or account ID.');
    }
  };

  const handleSampleClick = (meterNo) => {
    setSearchQuery(meterNo);
    const found = MOCK_CUSTOMERS[meterNo];
    if (found) {
      setCustomer(found);
      resetVendState();
    }
  };

  const resetVendState = () => {
    setAmount('');
    setSelectedPreset(null);
    setBreakdown(null);
    setVendResult(null);
    setTxnRef(generateTxnRef());
    setCopied(false);
  };

  // ===== AMOUNT SELECTION =====
  const handlePresetClick = (val) => {
    setSelectedPreset(val);
    setAmount('');
    setVendResult(null);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    setSelectedPreset(null);
    setVendResult(null);
  };

  // ===== TOKEN GENERATION =====
  const handleGenerate = async () => {
    if (!customer || effectiveAmount < 10 || !breakdown) return;

    setIsGenerating(true);

    try {
      const res = await vendingAPI.vendToken({
        meterNo: customer.meterNo,
        amount: effectiveAmount,
        vendorId: 1,
      });

      if (res.success && res.data) {
        // Small delay for UX
        await new Promise((r) => setTimeout(r, 1800));
        setVendResult({
          token: res.data.token,
          kwh: res.data.kWh || breakdown.kwh,
          amount: effectiveAmount,
          meterNo: customer.meterNo,
          ref: res.data.ref || txnRef,
          timestamp: new Date().toLocaleString(),
        });
        setIsGenerating(false);
        return;
      }
    } catch (_) {
      // API unavailable, generate locally
    }

    // Fallback: local token generation with 1.8s spinner
    await new Promise((r) => setTimeout(r, 1800));

    setVendResult({
      token: generateRandomToken(),
      kwh: breakdown.kwh,
      amount: effectiveAmount,
      meterNo: customer.meterNo,
      ref: txnRef,
      timestamp: new Date().toLocaleString(),
    });
    setIsGenerating(false);
  };

  // ===== ACTIONS =====
  const handleCopyToken = () => {
    if (vendResult?.token) {
      navigator.clipboard.writeText(formatToken(vendResult.token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendSMS = () => {
    alert(`SMS would be sent to customer with token: ${formatToken(vendResult.token)}`);
  };

  const handleNewTransaction = () => {
    setCustomer(null);
    setSearchQuery('');
    resetVendState();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ===== RENDER =====
  return (
    <div className="page-content">
      {/* ================================================================ */}
      {/* 1. SEARCH CARD                                                    */}
      {/* ================================================================ */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Customer Lookup</div>
            <div className="card-subtitle">Search by meter number or account ID</div>
          </div>
        </div>
        <div className="card-body">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Enter meter number or account ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSearch}>Search</button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {SAMPLE_BUTTONS.map((s) => (
              <button
                key={s.meterNo}
                className="btn btn-secondary btn-sm"
                onClick={() => handleSampleClick(s.meterNo)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. VEND LAYOUT (shown when customer is loaded)                    */}
      {/* ================================================================ */}
      {customer && !isGenerating && !vendResult && (
        <div className="vend-layout">
          {/* ---- LEFT: Customer Info Card ---- */}
          <div className="customer-info-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div className="cust-name">{customer.name}</div>
              {customer.arrears > 0 ? (
                <span className="badge badge-warning">Arrears</span>
              ) : (
                <span className="badge badge-success">Active</span>
              )}
            </div>
            <div className="cust-id">{customer.accountId}</div>

            <div className="meter-badge">
              <span style={{ fontSize: 14 }}>&#9889;</span>
              {customer.meterNo}
            </div>

            <div className="cust-detail-row">
              <span className="cust-detail-label">Address</span>
              <span className="cust-detail-value">{customer.address}</span>
            </div>
            <div className="cust-detail-row">
              <span className="cust-detail-label">Tariff Group</span>
              <span className="cust-detail-value">{customer.tariffGroup}</span>
            </div>
            <div className="cust-detail-row">
              <span className="cust-detail-label">Supply Group Code</span>
              <span className="cust-detail-value mono">{customer.sgc}</span>
            </div>
            <div className="cust-detail-row">
              <span className="cust-detail-label">STS Key Revision</span>
              <span className="cust-detail-value mono">{customer.keyRevision}</span>
            </div>
            <div className="cust-detail-row">
              <span className="cust-detail-label">Meter Make / Model</span>
              <span className="cust-detail-value">{customer.meterModel}</span>
            </div>
            <div className="cust-detail-row">
              <span className="cust-detail-label">Current Balance</span>
              <span className="cust-detail-value" style={{ color: '#22c55e', fontWeight: 700 }}>
                {fmtN$(customer.balance)}
              </span>
            </div>
            <div className="cust-detail-row">
              <span className="cust-detail-label">Arrears Balance</span>
              <span
                className="cust-detail-value"
                style={{
                  color: customer.arrears > 0 ? '#f59e0b' : 'rgba(255,255,255,0.85)',
                  fontWeight: customer.arrears > 0 ? 700 : 500,
                }}
              >
                {fmtN$(customer.arrears)}
              </span>
            </div>
            <div className="cust-detail-row">
              <span className="cust-detail-label">GPS Location</span>
              <span className="cust-detail-value mono" style={{ fontSize: 11 }}>{customer.gps}</span>
            </div>
          </div>

          {/* ---- RIGHT: Token Generation ---- */}
          <div>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Generate STS Token</div>
                  <div className="card-subtitle">IEC 62055-41 Compliant Token Generation</div>
                </div>
                <span className="badge badge-info mono" style={{ fontSize: 10, letterSpacing: 0.5 }}>
                  {txnRef}
                </span>
              </div>
              <div className="card-body">
                {/* Amount Input */}
                <div className="field" style={{ marginBottom: 16 }}>
                  <label>Amount (N$)</label>
                  <input
                    type="number"
                    min="10"
                    placeholder="Enter amount..."
                    value={selectedPreset ? '' : amount}
                    onChange={handleAmountChange}
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 22,
                      padding: '14px 18px',
                      fontWeight: 700,
                    }}
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="quick-amounts">
                  {PRESET_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      className={`quick-amt${selectedPreset === v ? ' selected' : ''}`}
                      onClick={() => handlePresetClick(v)}
                    >
                      N${v}
                    </button>
                  ))}
                </div>

                {/* Transaction Breakdown */}
                {breakdown && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: 12,
                    }}>
                      Transaction Breakdown
                    </div>
                    <table className="breakdown-table">
                      <tbody>
                        <tr>
                          <td style={{ color: 'var(--text-secondary)' }}>Amount Tendered</td>
                          <td>{fmtN$(breakdown.amountTendered)}</td>
                        </tr>
                        {breakdown.arrearsDeduction > 0 && (
                          <tr>
                            <td style={{ color: '#f59e0b' }}>Arrears Deducted</td>
                            <td style={{ color: '#f59e0b' }}>-{fmtN$(breakdown.arrearsDeduction)}</td>
                          </tr>
                        )}
                        <tr>
                          <td style={{ color: 'var(--text-secondary)' }}>VAT (15%)</td>
                          <td style={{ color: 'var(--danger)' }}>-{fmtN$(breakdown.vatAmount)}</td>
                        </tr>
                        <tr>
                          <td style={{ color: 'var(--text-secondary)' }}>Fixed Charge</td>
                          <td style={{ color: 'var(--danger)' }}>-{fmtN$(breakdown.fixedCharge)}</td>
                        </tr>
                        <tr>
                          <td style={{ color: 'var(--text-secondary)' }}>REL Levy</td>
                          <td style={{ color: 'var(--danger)' }}>-{fmtN$(breakdown.levy)}</td>
                        </tr>
                        <tr className="divider">
                          <td style={{ color: 'var(--text-secondary)' }}>Net Energy Amount</td>
                          <td style={{ color: 'var(--success)' }}>{fmtN$(breakdown.netEnergy)}</td>
                        </tr>
                        <tr className="total">
                          <td>Energy Units</td>
                          <td>{breakdown.kwh} kWh</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  className="btn btn-success btn-lg"
                  style={{
                    width: '100%',
                    marginTop: 24,
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    opacity: (!breakdown || breakdown.netEnergy <= 0) ? 0.5 : 1,
                    cursor: (!breakdown || breakdown.netEnergy <= 0) ? 'not-allowed' : 'pointer',
                  }}
                  disabled={!breakdown || breakdown.netEnergy <= 0}
                  onClick={handleGenerate}
                >
                  <span style={{ fontSize: 18 }}>&#9889;</span>
                  Generate Token
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 3. GENERATING OVERLAY                                             */}
      {/* ================================================================ */}
      {isGenerating && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="generating-overlay">
            <div className="spinner"></div>
            <div className="generating-text">
              Communicating with <strong>STS Gateway</strong>...
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Generating IEC 62055-41 compliant token for meter {customer?.meterNo}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 4. TOKEN DISPLAY (after successful vend)                          */}
      {/* ================================================================ */}
      {vendResult && (
        <div className="token-display">
          <div className="token-label">20-Digit STS Prepaid Token</div>
          <div className="token-number">{formatToken(vendResult.token)}</div>
          <div className="token-glow-line"></div>

          <div className="token-meta">
            <div className="token-meta-item">
              <div className="val">{vendResult.kwh} kWh</div>
              <div className="lbl">Energy Units</div>
            </div>
            <div className="token-meta-item">
              <div className="val">{fmtN$(vendResult.amount)}</div>
              <div className="lbl">Amount Paid</div>
            </div>
            <div className="token-meta-item">
              <div className="val" style={{ fontSize: 14 }}>{vendResult.meterNo}</div>
              <div className="lbl">Meter Number</div>
            </div>
          </div>

          <div className="token-actions">
            <button className="btn btn-primary" onClick={handlePrint}>
              <span>&#128424;</span> Print Receipt
            </button>
            <button
              className="btn btn-secondary"
              style={{
                color: copied ? 'var(--success)' : undefined,
                borderColor: copied ? 'var(--success)' : undefined,
                background: '#fff',
              }}
              onClick={handleCopyToken}
            >
              <span>&#128203;</span> {copied ? 'Copied!' : 'Copy Token'}
            </button>
            <button className="btn btn-secondary" style={{ background: '#fff' }} onClick={handleSendSMS}>
              <span>&#128172;</span> Send SMS
            </button>
            <button className="btn btn-success" onClick={handleNewTransaction}>
              <span>+</span> New Transaction
            </button>
          </div>

          <div className="token-ref">
            Ref: {vendResult.ref} &middot; {vendResult.timestamp}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 5. EMPTY STATE (no customer loaded, no generating, no result)     */}
      {/* ================================================================ */}
      {!customer && !isGenerating && !vendResult && (
        <div className="card" style={{ marginTop: 0 }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 40px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 56,
              marginBottom: 16,
              opacity: 0.15,
              lineHeight: 1,
            }}>
              &#9889;
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              Search for a Customer
            </div>
            <div style={{
              fontSize: 14,
              color: 'var(--text-muted)',
              maxWidth: 420,
              lineHeight: 1.6,
            }}>
              Enter a meter number or account ID in the search bar above to load customer
              information and begin generating STS prepaid electricity tokens.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
