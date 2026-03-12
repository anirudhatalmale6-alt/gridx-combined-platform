import { Box, Card, CardContent, Typography, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import {
  SpeedOutlined,
  CheckCircleOutlined,
  AccountBalanceWalletOutlined,
  ConfirmationNumberOutlined,
  BoltOutlined,
  ElectricalServicesOutlined,
  PowerOutlined,
  GraphicEqOutlined,
  SpeedOutlined as PfIcon,
  ThermostatOutlined,
  FiberManualRecord,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Header from '../components/Header';
import StatBox from '../components/StatBox';
import { dashboardData } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Helpers ----
const fmt = (n) => Number(n).toLocaleString();
const fmtCurrency = (n) => `N$ ${Number(n).toLocaleString()}`;

// ---- Pie data derived from mock ----
const meterStatusData = [
  { name: 'Online', value: dashboardData.meterStatus.online, color: '#4cceac' },
  { name: 'Offline', value: dashboardData.meterStatus.offline, color: '#6c757d' },
  { name: 'Tampered', value: dashboardData.meterStatus.tampered, color: '#db4f4a' },
  { name: 'Suspended', value: dashboardData.meterStatus.suspended, color: '#f2b705' },
];

// ---- Status chip color map ----
const statusColor = {
  Completed: { bg: 'rgba(76, 206, 172, 0.15)', text: '#4cceac' },
  Failed: { bg: 'rgba(219, 79, 74, 0.15)', text: '#db4f4a' },
  Reversed: { bg: 'rgba(242, 183, 5, 0.15)', text: '#f2b705' },
  Pending: { bg: 'rgba(104, 112, 250, 0.15)', text: '#6870fa' },
};

// ---- Power metric items ----
const powerMetrics = [
  { label: 'Voltage', value: `${dashboardData.powerData.voltage} V`, icon: <BoltOutlined />, color: '#f2b705' },
  { label: 'Current', value: `${dashboardData.powerData.current} A`, icon: <ElectricalServicesOutlined />, color: '#00b4d8' },
  { label: 'Active Power', value: `${dashboardData.powerData.activePower} kW`, icon: <PowerOutlined />, color: '#4cceac' },
  { label: 'Frequency', value: `${dashboardData.powerData.frequency} Hz`, icon: <GraphicEqOutlined />, color: '#6870fa' },
  { label: 'Power Factor', value: dashboardData.powerData.powerFactor, icon: <SpeedOutlined />, color: '#00b4d8' },
  { label: 'Temperature', value: `${dashboardData.powerData.temperature}\u00B0C`, icon: <ThermostatOutlined />, color: '#db4f4a' },
];

// ---- System statuses ----
const systemStatuses = [
  { label: 'STS Gateway', status: 'Connected' },
  { label: 'Database', status: 'Online' },
  { label: 'SMS Gateway', status: 'Active' },
  { label: 'Application Server', status: 'Running' },
];

// ---- Custom tooltip for AreaChart ----
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        ...darkCard,
        p: 1.5,
        minWidth: 160,
      }}
    >
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      {payload.map((entry) => (
        <Typography key={entry.dataKey} variant="body2" sx={{ color: entry.color, fontWeight: 600, fontSize: '0.8rem' }}>
          {entry.dataKey === 'revenue' ? fmtCurrency(entry.value) : `${fmt(entry.value)} kWh`}
        </Typography>
      ))}
    </Box>
  );
}

// ---- Format time helper ----
function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ===========================================================================
// Dashboard Page
// ===========================================================================
export default function Dashboard() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <Header title="Dashboard" subtitle="GRIDx Smart Metering Platform Overview" />

      {/* ================================================================= */}
      {/* ROW 1 - KPI Cards                                                 */}
      {/* ================================================================= */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatBox
            title="Total Meters"
            value={fmt(dashboardData.kpis.totalMeters)}
            icon={<SpeedOutlined />}
            color="#00b4d8"
            change={2.4}
            changeType="increase"
            subtitle="all registered"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatBox
            title="Active Meters"
            value={fmt(dashboardData.kpis.activeMeters)}
            icon={<CheckCircleOutlined />}
            color="#4cceac"
            change={1.2}
            changeType="increase"
            subtitle="communicating"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatBox
            title="Today's Revenue"
            value={fmtCurrency(dashboardData.kpis.todayRevenue)}
            icon={<AccountBalanceWalletOutlined />}
            color="#f2b705"
            change={8.3}
            changeType="increase"
            subtitle="vs yesterday"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatBox
            title="Tokens Generated"
            value={fmt(dashboardData.kpis.todayTokens)}
            icon={<ConfirmationNumberOutlined />}
            color="#6870fa"
            change={5.7}
            changeType="increase"
            subtitle="today"
          />
        </Grid>
      </Grid>

      {/* ================================================================= */}
      {/* ROW 2 - Revenue Trend (8 cols) + Meter Status Pie (4 cols)        */}
      {/* ================================================================= */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* ---- Revenue & Energy Trend AreaChart ---- */}
        <Grid item xs={12} md={8}>
          <Card sx={darkCard}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                Revenue &amp; Energy Trend
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={dashboardData.salesTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#00b4d8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradKwh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4cceac" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#4cceac" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.4)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
                    <YAxis
                      yAxisId="left"
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `N$${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="rgba(255,255,255,0.4)"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#00b4d8"
                      strokeWidth={2}
                      fill="url(#gradRevenue)"
                      name="Revenue"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="kWh"
                      stroke="#4cceac"
                      strokeWidth={2}
                      fill="url(#gradKwh)"
                      name="kWh"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ---- Meter Status PieChart (donut) ---- */}
        <Grid item xs={12} md={4}>
          <Card sx={{ ...darkCard, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                Meter Status
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={meterStatusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {meterStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#152238',
                        border: '1px solid rgba(30,58,95,0.5)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 12,
                      }}
                      formatter={(value, name) => [`${fmt(value)} meters`, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ================================================================= */}
      {/* ROW 3 - Recent Transactions (8 cols) + Live Power Metrics (4 cols) */}
      {/* ================================================================= */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* ---- Recent Transactions Table ---- */}
        <Grid item xs={12} md={8}>
          <Card sx={darkCard}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                Recent Transactions
              </Typography>
              <TableContainer sx={{ maxHeight: 340 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Time', 'Customer', 'Meter No', 'Amount (N$)', 'kWh', 'Status'].map((col) => (
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
                    {dashboardData.recentTransactions.slice(0, 10).map((txn) => {
                      const sc = statusColor[txn.status] || statusColor.Completed;
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
                          <TableCell>{formatTime(txn.time)}</TableCell>
                          <TableCell>{txn.customer}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem !important' }}>
                            {txn.meterNo}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{fmt(txn.amount.toFixed(2))}</TableCell>
                          <TableCell>{fmt(txn.kWh.toFixed(2))}</TableCell>
                          <TableCell>
                            <Chip
                              label={txn.status}
                              size="small"
                              sx={{
                                bgcolor: sc.bg,
                                color: sc.text,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 24,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ---- Live Power Metrics ---- */}
        <Grid item xs={12} md={4}>
          <Card sx={{ ...darkCard, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                Live Power Metrics
              </Typography>
              <Grid container spacing={1.5}>
                {powerMetrics.map((m) => (
                  <Grid item xs={6} key={m.label}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(10, 22, 40, 0.6)',
                        border: '1px solid rgba(30,58,95,0.4)',
                        borderRadius: 2,
                        p: 1.5,
                        textAlign: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mb: 0.5,
                          '& .MuiSvgIcon-root': { fontSize: 20, color: m.color },
                        }}
                      >
                        {m.icon}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', mb: 0.3 }}
                      >
                        {m.label}
                      </Typography>
                      <Typography variant="h6" sx={{ color: m.color, fontWeight: 700, fontSize: '1rem' }}>
                        {m.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ================================================================= */}
      {/* ROW 4 - System Status                                             */}
      {/* ================================================================= */}
      <Grid container spacing={2.5}>
        {systemStatuses.map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card sx={darkCard}>
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: '12px !important',
                  '&:last-child': { pb: '12px !important' },
                }}
              >
                <FiberManualRecord sx={{ fontSize: 12, color: '#4cceac', animation: 'pulse 2s infinite' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', display: 'block' }}>
                    {s.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4cceac', fontWeight: 600, fontSize: '0.82rem' }}>
                    {s.status}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Box>
  );
}
