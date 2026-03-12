import { useState, useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  BoltOutlined,
  ElectricalServicesOutlined,
  PowerOutlined,
  GraphicEqOutlined,
  SpeedOutlined,
  ThermostatOutlined,
  SignalCellularAltOutlined,
  SimCardOutlined,
  AccountBalanceWalletOutlined,
  ConfirmationNumberOutlined,
  ShoppingCartOutlined,
  HistoryOutlined,
  TuneOutlined,
  BarChartOutlined,
  PowerSettingsNewOutlined,
  ContentCopyOutlined,
  PrintOutlined,
  SmsOutlined,
  SendOutlined,
  RestartAltOutlined,
  BluetoothOutlined,
  LockResetOutlined,
  WaterDropOutlined,
  WarningAmberOutlined,
  CheckCircleOutlined,
  ArrowBackOutlined,
  FiberManualRecord,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import Header from '../components/Header';
import { meters, transactions, tariffGroups, tariffConfig, customers } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Helpers ----
const fmt = (n) => Number(n).toLocaleString();
const fmtCurrency = (n) => `N$ ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function formatDateTime(isoStr) {
  if (!isoStr) return '---';
  const d = new Date(isoStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ---- Status color map ----
const statusColors = {
  Online: { bg: 'rgba(76, 206, 172, 0.15)', text: '#4cceac', label: 'Online' },
  Offline: { bg: 'rgba(108, 117, 125, 0.2)', text: '#6c757d', label: 'Offline' },
  Tampered: { bg: 'rgba(219, 79, 74, 0.15)', text: '#db4f4a', label: 'Tampered' },
};

const txnStatusColor = {
  Completed: { bg: 'rgba(76, 206, 172, 0.15)', text: '#4cceac' },
  Failed: { bg: 'rgba(219, 79, 74, 0.15)', text: '#db4f4a' },
  Reversed: { bg: 'rgba(242, 183, 5, 0.15)', text: '#f2b705' },
  Pending: { bg: 'rgba(104, 112, 250, 0.15)', text: '#6870fa' },
};

// ---- Signal strength helper ----
function signalLabel(dbm) {
  if (dbm >= -50) return { label: 'Excellent', color: '#4cceac' };
  if (dbm >= -70) return { label: 'Good', color: '#00b4d8' };
  if (dbm >= -85) return { label: 'Fair', color: '#f2b705' };
  return { label: 'Weak', color: '#db4f4a' };
}

// ---- Mock 24-hour energy data ----
function generateHourlyData() {
  const basePattern = [
    0.3, 0.2, 0.15, 0.12, 0.1, 0.15, 0.4, 0.8, 1.2, 1.5, 1.8, 2.0,
    2.2, 2.1, 1.9, 1.7, 1.5, 1.8, 2.5, 3.0, 2.8, 2.2, 1.5, 0.8,
  ];
  return basePattern.map((val, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    kWh: +(val + Math.random() * 0.5).toFixed(2),
  }));
}

// ---- Small stat box ----
function MiniStat({ icon, label, value, color = '#00e5ff', unit = '' }) {
  return (
    <Box
      sx={{
        bgcolor: 'rgba(10, 22, 40, 0.6)',
        border: '1px solid rgba(30,58,95,0.4)',
        borderRadius: 2,
        p: 1.5,
        textAlign: 'center',
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 0.5,
          '& .MuiSvgIcon-root': { fontSize: 20, color },
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="body2"
        sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', mb: 0.3 }}
      >
        {label}
      </Typography>
      <Typography variant="h6" sx={{ color, fontWeight: 700, fontSize: '1rem' }}>
        {value}{unit && <Typography component="span" sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', ml: 0.3 }}>{unit}</Typography>}
      </Typography>
    </Box>
  );
}

// ---- Tab panel wrapper ----
function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2.5 }}>{children}</Box> : null;
}

// ---- Chart tooltip ----
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ ...darkCard, p: 1.5, minWidth: 120 }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 0.3 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#00e5ff', fontWeight: 600, fontSize: '0.85rem' }}>
        {payload[0].value} kWh
      </Typography>
    </Box>
  );
}

// ===========================================================================
// MeterProfile Page
// ===========================================================================
export default function MeterProfile() {
  const { drn } = useParams();
  const meter = meters.find((m) => m.drn === drn);

  const [tabIndex, setTabIndex] = useState(0);

  // Vend tab state
  const [vendAmount, setVendAmount] = useState('');
  const [vendToken, setVendToken] = useState('');
  const [vendGenerated, setVendGenerated] = useState(false);

  // Config tab state
  const [configToken, setConfigToken] = useState('');

  // Hourly energy data
  const hourlyData = useMemo(() => generateHourlyData(), []);

  // ---- Not found ----
  if (!meter) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Header title="Meter Not Found" subtitle="The requested meter could not be found" />
        <Card sx={darkCard}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <WarningAmberOutlined sx={{ fontSize: 64, color: '#f2b705', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
              Meter DRN &ldquo;{drn}&rdquo; not found
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}>
              Please check the DRN and try again, or return to the meter summary.
            </Typography>
            <Button
              component={RouterLink}
              to="/meter-summary"
              variant="contained"
              startIcon={<ArrowBackOutlined />}
            >
              Back to Meter Summary
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ---- Derived data ----
  const sc = statusColors[meter.status] || statusColors.Online;
  const customer = customers.find((c) => c.meterNo === meter.meterNo);
  const meterTransactions = transactions.filter((t) => t.meterNo === meter.meterNo);
  const tariff = tariffGroups.find((t) => t.name === meter.billing.tariffGroup) || tariffGroups[0];
  const sig = signalLabel(meter.network.signalStrength);

  // ---- Vend calculation ----
  const calculateVend = (amountStr) => {
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) return null;

    const vat = amount * (tariffConfig.vatRate / (100 + tariffConfig.vatRate));
    const fixedCharge = tariffConfig.fixedCharge;
    const relLevy = tariffConfig.relLevy;

    let arrearsDeduction = 0;
    if (customer?.arrears > 0) {
      arrearsDeduction = Math.min(
        customer.arrears,
        amount * (tariffConfig.arrearsPercentage / 100)
      );
    }

    const energyAmount = amount - vat - fixedCharge - relLevy - arrearsDeduction;
    let remainingAmount = Math.max(0, energyAmount);
    let totalKwh = 0;

    for (const block of tariff.blocks) {
      if (remainingAmount <= 0) break;
      const blockRange = block.max === Infinity ? Infinity : block.max - (block.min > 0 ? block.min - 1 : 0);
      const maxKwhInBlock = blockRange === Infinity ? remainingAmount / block.rate : blockRange;
      const kwhFromBlock = Math.min(remainingAmount / block.rate, maxKwhInBlock);
      totalKwh += kwhFromBlock;
      remainingAmount -= kwhFromBlock * block.rate;
    }

    return {
      grossAmount: amount,
      vat,
      fixedCharge,
      relLevy,
      arrearsDeduction,
      energyAmount: Math.max(0, energyAmount),
      kWh: +totalKwh.toFixed(2),
    };
  };

  const vendCalc = calculateVend(vendAmount);

  const handleGenerateToken = () => {
    // Generate mock 20-digit STS token
    const digits = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join('');
    setVendToken(digits);
    setVendGenerated(true);
  };

  const handleCopyToken = () => {
    navigator.clipboard?.writeText(vendToken);
  };

  const presets = [10, 25, 50, 100, 200, 500];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ----------------------------------------------------------------- */}
      {/* Page Header                                                       */}
      {/* ----------------------------------------------------------------- */}
      <Header
        title="Meter Profile"
        subtitle={`Device Reference: ${meter.drn}`}
        action={
          <Button
            component={RouterLink}
            to="/meter-summary"
            variant="outlined"
            size="small"
            startIcon={<ArrowBackOutlined />}
          >
            All Meters
          </Button>
        }
      />

      {/* ================================================================= */}
      {/* Meter Header Bar                                                   */}
      {/* ================================================================= */}
      <Card sx={{ ...darkCard, mb: 2.5 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            {/* Left: Meter number, customer, account */}
            <Grid item xs={12} md={4}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Roboto Mono", "Courier New", monospace',
                  color: '#00e5ff',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  letterSpacing: '0.05em',
                }}
              >
                {meter.meterNo}
              </Typography>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, mt: 0.3 }}>
                {meter.customerName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                Account: {meter.accountNo}
              </Typography>
            </Grid>

            {/* Center: Status */}
            <Grid item xs={12} md={4} sx={{ textAlign: { md: 'center' } }}>
              <Chip
                icon={<FiberManualRecord sx={{ fontSize: '10px !important' }} />}
                label={sc.label}
                sx={{
                  bgcolor: sc.bg,
                  color: sc.text,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  height: 32,
                  px: 1,
                  '& .MuiChip-icon': { color: sc.text },
                }}
              />
            </Grid>

            {/* Right: Last update, area */}
            <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
                Last Update: {formatDateTime(meter.lastUpdate)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                {meter.area} &bull; {meter.suburb}
              </Typography>
            </Grid>
          </Grid>

          {/* Quick action buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<ConfirmationNumberOutlined />}
              onClick={() => setTabIndex(1)}
            >
              Vend Token
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PowerSettingsNewOutlined />}
              onClick={() => setTabIndex(2)}
            >
              Load Control
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneOutlined />}
              onClick={() => setTabIndex(4)}
            >
              Calibrate
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<HistoryOutlined />}
              onClick={() => setTabIndex(6)}
            >
              View History
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Tabbed Interface                                                   */}
      {/* ================================================================= */}
      <Card sx={darkCard}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid rgba(30,58,95,0.5)',
            px: 2,
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'none',
              minHeight: 48,
              '&.Mui-selected': { color: '#00e5ff' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#00e5ff' },
          }}
        >
          <Tab label="Overview" />
          <Tab label="Vend Token" />
          <Tab label="Load Control" />
          <Tab label="Billing & Tariff" />
          <Tab label="Configuration" />
          <Tab label="Energy Charts" />
          <Tab label="History" />
        </Tabs>

        <CardContent>
          {/* ============================================================= */}
          {/* Tab 0: Overview                                                */}
          {/* ============================================================= */}
          <TabPanel value={tabIndex} index={0}>
            <Grid container spacing={2.5}>
              {/* Power Measurements */}
              <Grid item xs={12} md={6}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                      Power Measurements
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={4}>
                        <MiniStat icon={<BoltOutlined />} label="Voltage" value={meter.power.voltage} unit="V" color="#f2b705" />
                      </Grid>
                      <Grid item xs={4}>
                        <MiniStat icon={<ElectricalServicesOutlined />} label="Current" value={meter.power.current} unit="A" color="#00b4d8" />
                      </Grid>
                      <Grid item xs={4}>
                        <MiniStat icon={<PowerOutlined />} label="Active Power" value={meter.power.activePower} unit="kW" color="#4cceac" />
                      </Grid>
                      <Grid item xs={4}>
                        <MiniStat icon={<PowerOutlined />} label="Reactive Power" value={meter.power.reactivePower} unit="kVAr" color="#6870fa" />
                      </Grid>
                      <Grid item xs={4}>
                        <MiniStat icon={<PowerOutlined />} label="Apparent Power" value={meter.power.apparentPower} unit="kVA" color="#e2726e" />
                      </Grid>
                      <Grid item xs={4}>
                        <MiniStat icon={<GraphicEqOutlined />} label="Frequency" value={meter.power.frequency} unit="Hz" color="#00b4d8" />
                      </Grid>
                      <Grid item xs={6}>
                        <MiniStat icon={<SpeedOutlined />} label="Power Factor" value={meter.power.powerFactor} color="#4cceac" />
                      </Grid>
                      <Grid item xs={6}>
                        <MiniStat icon={<ThermostatOutlined />} label="Temperature" value={`${meter.power.temperature}\u00B0C`} color="#db4f4a" />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Energy Readings */}
              <Grid item xs={12} md={6}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)', mb: 2.5 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                      Energy Readings
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <MiniStat icon={<BoltOutlined />} label="Active Energy" value={fmt(meter.energy.activeEnergy)} unit="kWh" color="#00b4d8" />
                      </Grid>
                      <Grid item xs={6}>
                        <MiniStat icon={<BoltOutlined />} label="Reactive Energy" value={fmt(meter.energy.reactiveEnergy)} unit="kVArh" color="#6870fa" />
                      </Grid>
                      <Grid item xs={6}>
                        <MiniStat icon={<SpeedOutlined />} label="Units Consumed" value={fmt(meter.energy.activeEnergy)} unit="kWh" color="#f2b705" />
                      </Grid>
                      <Grid item xs={6}>
                        <MiniStat
                          icon={meter.energy.tamperState === 'Normal' ? <CheckCircleOutlined /> : <WarningAmberOutlined />}
                          label="Tamper State"
                          value={meter.energy.tamperState}
                          color={meter.energy.tamperState === 'Normal' ? '#4cceac' : '#db4f4a'}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Network Info */}
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                      Network Info
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <MiniStat
                          icon={<SignalCellularAltOutlined />}
                          label="Signal Strength"
                          value={`${meter.network.signalStrength} dBm`}
                          color={sig.color}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <MiniStat icon={<SimCardOutlined />} label="Provider" value={meter.network.serviceProvider.split(' ')[0]} color="#00b4d8" />
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 1.5 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block' }}>SIM Phone</Typography>
                          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'monospace' }}>{meter.network.simPhone}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 1.5 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block' }}>IMEI</Typography>
                          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'monospace' }}>{meter.network.imei}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Quick Stats */}
              <Grid item xs={12}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                      Quick Stats
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6} sm={3}>
                        <MiniStat icon={<ConfirmationNumberOutlined />} label="Last Token Amount" value={fmtCurrency(customer?.lastPurchaseAmount || 0)} color="#00b4d8" />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <MiniStat icon={<AccountBalanceWalletOutlined />} label="Current Balance" value={fmtCurrency(meter.billing.balance)} color="#4cceac" />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <MiniStat icon={<ShoppingCartOutlined />} label="Tariff Group" value={meter.billing.tariffGroup} color="#6870fa" />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <MiniStat
                          icon={<WarningAmberOutlined />}
                          label="Arrears"
                          value={customer?.arrears > 0 ? fmtCurrency(customer.arrears) : 'None'}
                          color={customer?.arrears > 0 ? '#db4f4a' : '#4cceac'}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ============================================================= */}
          {/* Tab 1: Vend Token                                              */}
          {/* ============================================================= */}
          <TabPanel value={tabIndex} index={1}>
            <Grid container spacing={2.5}>
              {/* Left: Customer Info + Amount */}
              <Grid item xs={12} md={6}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                      Vend Token for {meter.customerName}
                    </Typography>

                    {/* Pre-filled customer info */}
                    <Box sx={{ mb: 2.5 }}>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Customer Name"
                            value={meter.customerName}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Meter Number"
                            value={meter.meterNo}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Account No"
                            value={meter.accountNo}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Tariff Group"
                            value={meter.billing.tariffGroup}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(30,58,95,0.4)', mb: 2 }} />

                    {/* Amount input */}
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1, fontSize: '0.82rem' }}>
                      Purchase Amount (N$)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="Enter amount"
                      value={vendAmount}
                      onChange={(e) => {
                        setVendAmount(e.target.value);
                        setVendGenerated(false);
                        setVendToken('');
                      }}
                      sx={{ mb: 2 }}
                      inputProps={{ min: 5 }}
                    />

                    {/* Quick presets */}
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', mb: 1, display: 'block' }}>
                      Quick Amounts
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {presets.map((p) => (
                        <Button
                          key={p}
                          variant={vendAmount === String(p) ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => {
                            setVendAmount(String(p));
                            setVendGenerated(false);
                            setVendToken('');
                          }}
                          sx={{ minWidth: 64, fontSize: '0.78rem' }}
                        >
                          N${p}
                        </Button>
                      ))}
                    </Box>

                    {/* Generate button */}
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<ConfirmationNumberOutlined />}
                      disabled={!vendCalc || vendCalc.grossAmount < tariffConfig.minPurchase}
                      onClick={handleGenerateToken}
                      sx={{ mt: 1 }}
                    >
                      Generate Token
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right: Transaction Breakdown + Token Display */}
              <Grid item xs={12} md={6}>
                {/* Transaction Breakdown */}
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)', mb: 2.5 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                      Transaction Breakdown
                    </Typography>
                    {vendCalc ? (
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            {[
                              { label: 'Gross Amount', value: fmtCurrency(vendCalc.grossAmount), bold: true },
                              { label: `VAT (${tariffConfig.vatRate}%)`, value: `- ${fmtCurrency(vendCalc.vat)}` },
                              { label: 'Fixed Charge', value: `- ${fmtCurrency(vendCalc.fixedCharge)}` },
                              { label: 'REL Levy', value: `- ${fmtCurrency(vendCalc.relLevy)}` },
                              ...(vendCalc.arrearsDeduction > 0
                                ? [{ label: 'Arrears Deduction', value: `- ${fmtCurrency(vendCalc.arrearsDeduction)}`, color: '#db4f4a' }]
                                : []),
                              { label: 'Energy Amount', value: fmtCurrency(vendCalc.energyAmount), bold: true, color: '#4cceac' },
                            ].map((row, i) => (
                              <TableRow key={i} sx={{ '& td': { borderBottom: '1px solid rgba(30,58,95,0.3)', py: 0.8 } }}>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{row.label}</TableCell>
                                <TableCell
                                  align="right"
                                  sx={{
                                    color: row.color || '#fff',
                                    fontWeight: row.bold ? 700 : 400,
                                    fontSize: '0.82rem',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {row.value}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', py: 3 }}>
                        Enter an amount to see the breakdown
                      </Typography>
                    )}

                    {/* kWh Calculation */}
                    {vendCalc && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: 'rgba(0, 229, 255, 0.06)',
                          border: '1px solid rgba(0, 229, 255, 0.2)',
                          borderRadius: 2,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                          Estimated kWh ({tariff.type} Tariff)
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{ color: '#00e5ff', fontWeight: 700, fontSize: '2rem', fontFamily: 'monospace' }}
                        >
                          {vendCalc.kWh} kWh
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Token Display */}
                {vendGenerated && vendToken && (
                  <Card sx={{ ...darkCard, border: '1px solid rgba(76, 206, 172, 0.3)' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <CheckCircleOutlined sx={{ fontSize: 40, color: '#4cceac', mb: 1 }} />
                      <Typography variant="body2" sx={{ color: '#4cceac', fontWeight: 600, mb: 2 }}>
                        Token Generated Successfully
                      </Typography>

                      {/* 20-digit token display */}
                      <Box
                        sx={{
                          bgcolor: 'rgba(10, 22, 40, 0.8)',
                          border: '2px solid rgba(0, 229, 255, 0.3)',
                          borderRadius: 2,
                          p: 2.5,
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            fontFamily: '"Roboto Mono", "Courier New", monospace',
                            color: '#00e5ff',
                            fontWeight: 700,
                            fontSize: { xs: '1.3rem', sm: '1.8rem' },
                            letterSpacing: '0.15em',
                            wordBreak: 'break-all',
                          }}
                        >
                          {vendToken.replace(/(.{4})/g, '$1 ').trim()}
                        </Typography>
                      </Box>

                      {/* Action buttons */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Copy Token">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ContentCopyOutlined />}
                            onClick={handleCopyToken}
                          >
                            Copy
                          </Button>
                        </Tooltip>
                        <Tooltip title="Print Receipt">
                          <Button variant="outlined" size="small" startIcon={<PrintOutlined />}>
                            Print
                          </Button>
                        </Tooltip>
                        <Tooltip title="Send via SMS">
                          <Button variant="outlined" size="small" startIcon={<SmsOutlined />}>
                            SMS
                          </Button>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          {/* ============================================================= */}
          {/* Tab 2: Load Control                                            */}
          {/* ============================================================= */}
          <TabPanel value={tabIndex} index={2}>
            <Grid container spacing={2.5}>
              {/* Mains Relay */}
              <Grid item xs={12} md={6}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                      Mains Relay
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                      <FiberManualRecord
                        sx={{
                          fontSize: 16,
                          color: meter.loadControl.mainsState === 'ON' ? '#4cceac' : '#db4f4a',
                        }}
                      />
                      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                        Mains: {meter.loadControl.mainsState}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2, fontSize: '0.82rem' }}>
                      Control Mode: {meter.loadControl.mainsControl}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Button
                        variant="contained"
                        sx={{
                          bgcolor: '#4cceac',
                          '&:hover': { bgcolor: '#3da58a' },
                          flex: 1,
                        }}
                        startIcon={<PowerSettingsNewOutlined />}
                      >
                        Turn ON
                      </Button>
                      <Button
                        variant="contained"
                        sx={{
                          bgcolor: '#db4f4a',
                          '&:hover': { bgcolor: '#af3f3b' },
                          flex: 1,
                        }}
                        startIcon={<PowerSettingsNewOutlined />}
                      >
                        Turn OFF
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Geyser / Heater Relay */}
              <Grid item xs={12} md={6}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                      Geyser / Heater Relay
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                      <FiberManualRecord
                        sx={{
                          fontSize: 16,
                          color: meter.loadControl.geyserState === 'ON' ? '#4cceac' : meter.loadControl.geyserState === 'N/A' ? '#6c757d' : '#db4f4a',
                        }}
                      />
                      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                        Geyser: {meter.loadControl.geyserState}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2, fontSize: '0.82rem' }}>
                      Control Mode: {meter.loadControl.geyserControl}
                    </Typography>
                    {meter.loadControl.geyserState !== 'N/A' ? (
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                          variant="contained"
                          sx={{
                            bgcolor: '#4cceac',
                            '&:hover': { bgcolor: '#3da58a' },
                            flex: 1,
                          }}
                          startIcon={<WaterDropOutlined />}
                        >
                          Turn ON
                        </Button>
                        <Button
                          variant="contained"
                          sx={{
                            bgcolor: '#db4f4a',
                            '&:hover': { bgcolor: '#af3f3b' },
                            flex: 1,
                          }}
                          startIcon={<WaterDropOutlined />}
                        >
                          Turn OFF
                        </Button>
                      </Box>
                    ) : (
                      <Alert severity="info" sx={{ bgcolor: 'rgba(0,180,216,0.08)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.2)' }}>
                        Geyser relay not available on this meter
                      </Alert>
                    )}

                    {meter.loadControl.geyserState !== 'N/A' && (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(10,22,40,0.6)', borderRadius: 1, border: '1px solid rgba(30,58,95,0.3)' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block' }}>
                          Schedule: Weekdays 06:00-08:00, 17:00-21:00 (if Auto)
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ============================================================= */}
          {/* Tab 3: Billing & Tariff                                        */}
          {/* ============================================================= */}
          <TabPanel value={tabIndex} index={3}>
            <Grid container spacing={2.5}>
              {/* Billing Model */}
              <Grid item xs={12} md={6}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                      Current Billing Model
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 1.5 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block' }}>Billing Type</Typography>
                          <Typography variant="body1" sx={{ color: '#00e5ff', fontWeight: 700 }}>{meter.billing.type}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 1.5 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block' }}>Credit Option</Typography>
                          <Typography variant="body1" sx={{ color: '#00e5ff', fontWeight: 700 }}>{meter.billing.creditOption}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 1.5 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block' }}>Current Balance</Typography>
                          <Typography variant="body1" sx={{ color: '#4cceac', fontWeight: 700 }}>{fmtCurrency(meter.billing.balance)}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 1.5 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block' }}>Arrears</Typography>
                          <Typography variant="body1" sx={{ color: customer?.arrears > 0 ? '#db4f4a' : '#4cceac', fontWeight: 700 }}>
                            {customer?.arrears > 0 ? fmtCurrency(customer.arrears) : 'None'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Tariff Group Info */}
              <Grid item xs={12} md={6}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1, fontSize: '0.95rem' }}>
                      Tariff: {tariff.name} ({tariff.type})
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 2, fontSize: '0.78rem' }}>
                      SGC: {tariff.sgc} &bull; Effective: {tariff.effectiveDate}
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.75rem', borderBottom: '2px solid rgba(30,58,95,0.5)', bgcolor: 'transparent' }}>Block</TableCell>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.75rem', borderBottom: '2px solid rgba(30,58,95,0.5)', bgcolor: 'transparent' }}>Range</TableCell>
                            <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.75rem', borderBottom: '2px solid rgba(30,58,95,0.5)', bgcolor: 'transparent' }}>Rate (N$/kWh)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tariff.blocks.map((block, i) => (
                            <TableRow key={i} sx={{ '& td': { borderBottom: '1px solid rgba(30,58,95,0.3)', py: 0.8 } }}>
                              <TableCell sx={{ color: '#fff', fontSize: '0.78rem' }}>{block.name}</TableCell>
                              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>{block.range}</TableCell>
                              <TableCell align="right" sx={{ color: '#00e5ff', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'monospace' }}>
                                {block.rate.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Billing History */}
              <Grid item xs={12}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                      Recent Purchase History
                    </Typography>
                    {meterTransactions.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              {['Date', 'Ref', 'Amount (N$)', 'kWh', 'Status'].map((col) => (
                                <TableCell
                                  key={col}
                                  sx={{
                                    color: 'rgba(255,255,255,0.6)',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    borderBottom: '2px solid rgba(30,58,95,0.5)',
                                    bgcolor: 'transparent',
                                  }}
                                >
                                  {col}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {meterTransactions.slice(0, 5).map((txn) => {
                              const tsc = txnStatusColor[txn.status] || txnStatusColor.Completed;
                              return (
                                <TableRow
                                  key={txn.id}
                                  sx={{
                                    '& td': { borderBottom: '1px solid rgba(30,58,95,0.3)', color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', py: 0.8 },
                                  }}
                                >
                                  <TableCell>{formatDateTime(txn.dateTime)}</TableCell>
                                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem !important' }}>{txn.refNo}</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>{fmtCurrency(txn.amount)}</TableCell>
                                  <TableCell>{txn.kWh.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={txn.status}
                                      size="small"
                                      sx={{ bgcolor: tsc.bg, color: tsc.text, fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', py: 3 }}>
                        No recent transactions for this meter
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ============================================================= */}
          {/* Tab 4: Configuration                                           */}
          {/* ============================================================= */}
          <TabPanel value={tabIndex} index={4}>
            <Grid container spacing={2.5}>
              {/* Send STS Token */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <SendOutlined sx={{ color: '#00b4d8', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                        Send STS Token
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 2, fontSize: '0.78rem' }}>
                      Manually send a 20-digit STS token to this meter
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter 20-digit token"
                      value={configToken}
                      onChange={(e) => setConfigToken(e.target.value)}
                      inputProps={{ maxLength: 20 }}
                      sx={{ mb: 1.5 }}
                    />
                    <Button variant="contained" fullWidth size="small" startIcon={<SendOutlined />} disabled={configToken.length !== 20}>
                      Send Token
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Calibration */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <TuneOutlined sx={{ color: '#4cceac', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                        Calibration
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 2, fontSize: '0.78rem' }}>
                      Initiate remote calibration for voltage and current accuracy
                    </Typography>
                    <Button variant="outlined" fullWidth size="small" startIcon={<TuneOutlined />}>
                      Start Calibration
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Reset Meter */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(219, 79, 74, 0.2)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <RestartAltOutlined sx={{ color: '#db4f4a', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                        Reset Meter
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 2, fontSize: '0.78rem' }}>
                      Perform a remote meter reset. This will clear all stored readings.
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 1.5, bgcolor: 'rgba(242,183,5,0.08)', color: '#f2b705', fontSize: '0.72rem', border: '1px solid rgba(242,183,5,0.2)' }}>
                      Warning: This action cannot be undone
                    </Alert>
                    <Button variant="outlined" fullWidth size="small" color="error" startIcon={<RestartAltOutlined />}>
                      Reset Meter
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* BLE Reset */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <BluetoothOutlined sx={{ color: '#6870fa', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                        BLE Reset
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 2, fontSize: '0.78rem' }}>
                      Reset the Bluetooth Low Energy module on this meter
                    </Typography>
                    <Button variant="outlined" fullWidth size="small" startIcon={<BluetoothOutlined />}>
                      Reset BLE
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Reset Auth Numbers */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LockResetOutlined sx={{ color: '#f2b705', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                        Reset Auth Numbers
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 2, fontSize: '0.78rem' }}>
                      Reset authentication numbers to re-establish secure communication
                    </Typography>
                    <Button variant="outlined" fullWidth size="small" startIcon={<LockResetOutlined />}>
                      Reset Auth
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ============================================================= */}
          {/* Tab 5: Energy Charts                                           */}
          {/* ============================================================= */}
          <TabPanel value={tabIndex} index={5}>
            <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                  24-Hour Energy Consumption Pattern
                </Typography>
                <Box sx={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <AreaChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradEnergy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.4)" />
                      <XAxis
                        dataKey="hour"
                        stroke="rgba(255,255,255,0.4)"
                        tick={{ fontSize: 11 }}
                        interval={2}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.4)"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${v} kWh`}
                      />
                      <RechartsTooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="kWh"
                        stroke="#00e5ff"
                        strokeWidth={2.5}
                        fill="url(#gradEnergy)"
                        name="Energy"
                        dot={{ r: 3, fill: '#00e5ff', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#00e5ff', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          {/* ============================================================= */}
          {/* Tab 6: History                                                 */}
          {/* ============================================================= */}
          <TabPanel value={tabIndex} index={6}>
            <Card sx={{ ...darkCard, border: '1px solid rgba(30,58,95,0.3)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
                  Transaction History for Meter {meter.meterNo}
                </Typography>
                {meterTransactions.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {['Date', 'Type', 'Amount (N$)', 'kWh', 'Token', 'Status'].map((col) => (
                            <TableCell
                              key={col}
                              sx={{
                                bgcolor: '#1a2540',
                                color: 'rgba(255,255,255,0.7)',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                borderBottom: '2px solid rgba(30,58,95,0.6)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {col}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {meterTransactions.map((txn) => {
                          const tsc = txnStatusColor[txn.status] || txnStatusColor.Completed;
                          return (
                            <TableRow
                              key={txn.id}
                              sx={{
                                '&:hover': { bgcolor: 'rgba(0,180,216,0.06)' },
                                '& td': {
                                  borderBottom: '1px solid rgba(30,58,95,0.3)',
                                  color: 'rgba(255,255,255,0.85)',
                                  fontSize: '0.78rem',
                                  py: 1,
                                },
                              }}
                            >
                              <TableCell>{formatDateTime(txn.dateTime)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={txn.type}
                                  size="small"
                                  sx={{
                                    bgcolor: 'rgba(0,180,216,0.12)',
                                    color: '#00b4d8',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    height: 22,
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{fmtCurrency(txn.amount)}</TableCell>
                              <TableCell>{txn.kWh.toFixed(2)}</TableCell>
                              <TableCell sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.7rem !important', letterSpacing: '0.03em' }}>
                                {txn.token}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={txn.status}
                                  size="small"
                                  sx={{ bgcolor: tsc.bg, color: tsc.text, fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', py: 4 }}>
                    No transactions found for this meter
                  </Typography>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
