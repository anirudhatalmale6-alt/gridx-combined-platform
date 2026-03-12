import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  ElectricMeterOutlined,
  PointOfSaleOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Header from '../components/Header';
import { customers } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Helpers ----
const fmt = (n) => Number(n).toLocaleString();
const fmtCurrency = (n) => `N$ ${Number(n).toLocaleString()}`;

// ---- Prepaid billing rows (derived from customers) ----
const prepaidRows = customers.slice(0, 12).map((c) => ({
  accountNo: c.accountNo,
  customer: c.name,
  meterNo: c.meterNo,
  billingType: 'Prepaid',
  lastPurchaseAmount: c.lastPurchaseAmount,
  lastPurchaseDate: c.lastPurchaseDate,
  balance: Math.round(c.lastPurchaseAmount * 0.595),
  status: c.status,
}));

// ---- Postpaid billing rows ----
const postpaidRows = [
  { accountNo: 'ACC-2026-200001', customer: 'Windhoek Municipality HQ', meterNo: '04040520001', billAmount: 125400, dueDate: '2026-03-25', paid: 125400, status: 'Paid' },
  { accountNo: 'ACC-2026-200002', customer: 'Namibia Breweries Ltd', meterNo: '04040520002', billAmount: 284500, dueDate: '2026-03-25', paid: 284500, status: 'Paid' },
  { accountNo: 'ACC-2026-200003', customer: 'TransNamib Holdings', meterNo: '04040520003', billAmount: 198700, dueDate: '2026-03-25', paid: 0, status: 'Pending' },
  { accountNo: 'ACC-2026-200004', customer: 'Namibia Post & Telecom', meterNo: '04040520004', billAmount: 67300, dueDate: '2026-02-28', paid: 0, status: 'Overdue' },
  { accountNo: 'ACC-2026-200005', customer: 'FNB Namibia Campus', meterNo: '04040520005', billAmount: 145200, dueDate: '2026-03-25', paid: 145200, status: 'Paid' },
  { accountNo: 'ACC-2026-200006', customer: 'Pupkewitz Megabuild', meterNo: '04040520006', billAmount: 312800, dueDate: '2026-02-28', paid: 150000, status: 'Overdue' },
  { accountNo: 'ACC-2026-200007', customer: 'Checkers Windhoek', meterNo: '04040520007', billAmount: 89400, dueDate: '2026-03-25', paid: 89400, status: 'Paid' },
  { accountNo: 'ACC-2026-200008', customer: 'Hilton Garden Inn WHK', meterNo: '04040520008', billAmount: 234100, dueDate: '2026-03-25', paid: 0, status: 'Pending' },
  { accountNo: 'ACC-2026-200009', customer: 'MTC Head Office', meterNo: '04040520009', billAmount: 178900, dueDate: '2026-03-25', paid: 178900, status: 'Paid' },
  { accountNo: 'ACC-2026-200010', customer: 'UNAM Main Campus', meterNo: '04040520010', billAmount: 410500, dueDate: '2026-02-28', paid: 200000, status: 'Overdue' },
];

// ---- Revenue by area chart data ----
const areaRevenue = [
  { area: 'Katutura', revenue: 42500 },
  { area: 'Windhoek West', revenue: 38200 },
  { area: 'Khomasdal', revenue: 28400 },
  { area: 'Groot Aub', revenue: 12800 },
  { area: 'Dordabis', revenue: 8900 },
  { area: 'Seeis', revenue: 7200 },
  { area: 'Grunau', revenue: 4300 },
];

// ---- Status chip styles ----
const statusChipSx = {
  Active: { bg: 'rgba(76, 206, 172, 0.15)', text: '#4cceac' },
  Arrears: { bg: 'rgba(242, 183, 5, 0.15)', text: '#f2b705' },
  Suspended: { bg: 'rgba(219, 79, 74, 0.15)', text: '#db4f4a' },
  Paid: { bg: 'rgba(76, 206, 172, 0.15)', text: '#4cceac' },
  Pending: { bg: 'rgba(104, 112, 250, 0.15)', text: '#6870fa' },
  Overdue: { bg: 'rgba(219, 79, 74, 0.15)', text: '#db4f4a' },
};

// ---- Table cell styles ----
const thSx = {
  color: 'rgba(255,255,255,0.55)',
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  py: 1.2,
};

const tdSx = {
  color: '#fff',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  fontSize: '0.85rem',
  py: 1.3,
};

// ---- Custom tooltip ----
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ background: '#0d1b2a', border: '1px solid rgba(0,180,216,0.3)', borderRadius: 1, px: 1.5, py: 1 }}>
      <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>{label}</Typography>
      {payload.map((p, i) => (
        <Typography key={i} variant="caption" sx={{ display: 'block', color: p.color || '#00b4d8' }}>
          {p.name}: N$ {Number(p.value).toLocaleString()}
        </Typography>
      ))}
    </Box>
  );
}

export default function Billing() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Header
        title="Billing Summary"
        subtitle="Prepaid and postpaid billing overview with revenue analytics"
      />

      {/* ---- Tabs ---- */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'none',
              fontWeight: 600,
              '&.Mui-selected': { color: '#00b4d8' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#00b4d8' },
          }}
        >
          <Tab label="Prepaid Billing" />
          <Tab label="Postpaid Billing" />
        </Tabs>
      </Box>

      {/* ================================ */}
      {/* PREPAID TAB                      */}
      {/* ================================ */}
      {tab === 0 && (
        <Box>
          {/* Summary cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Active Prepaid Meters', value: '2,450', icon: <ElectricMeterOutlined />, color: '#00b4d8' },
              { label: "Today's Token Sales", value: 'N$ 125,400', icon: <PointOfSaleOutlined />, color: '#4cceac' },
              { label: 'Average Purchase', value: 'N$ 87.50', icon: <TrendingUpOutlined />, color: '#6870fa' },
            ].map((card) => (
              <Grid item xs={12} sm={4} key={card.label}>
                <Card sx={darkCard}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${card.color}20`,
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>
                        {card.label}
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
                        {card.value}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Prepaid billing table */}
          <Card sx={{ ...darkCard, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                Prepaid Billing Records
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={thSx}>Account No</TableCell>
                      <TableCell sx={thSx}>Customer</TableCell>
                      <TableCell sx={thSx}>Meter No</TableCell>
                      <TableCell sx={thSx}>Billing Type</TableCell>
                      <TableCell sx={thSx} align="right">Last Purchase</TableCell>
                      <TableCell sx={thSx}>Last Purchase Date</TableCell>
                      <TableCell sx={thSx} align="right">Balance (kWh)</TableCell>
                      <TableCell sx={thSx}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prepaidRows.map((row) => {
                      const chipStyle = statusChipSx[row.status] || statusChipSx.Active;
                      return (
                        <TableRow key={row.accountNo} sx={{ '&:hover': { background: 'rgba(0,180,216,0.05)' } }}>
                          <TableCell sx={{ ...tdSx, fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.accountNo}</TableCell>
                          <TableCell sx={{ ...tdSx, fontWeight: 600 }}>{row.customer}</TableCell>
                          <TableCell sx={{ ...tdSx, fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.meterNo}</TableCell>
                          <TableCell sx={tdSx}>{row.billingType}</TableCell>
                          <TableCell sx={tdSx} align="right">{fmtCurrency(row.lastPurchaseAmount)}</TableCell>
                          <TableCell sx={tdSx}>
                            {new Date(row.lastPurchaseDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </TableCell>
                          <TableCell sx={tdSx} align="right">{fmt(row.balance)}</TableCell>
                          <TableCell sx={tdSx}>
                            <Chip
                              label={row.status}
                              size="small"
                              sx={{
                                backgroundColor: chipStyle.bg,
                                color: chipStyle.text,
                                fontWeight: 600,
                                fontSize: '0.72rem',
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

          {/* Prepaid Revenue by Area chart */}
          <Card sx={darkCard}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                Prepaid Revenue by Area
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={areaRevenue} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="area"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                    tickFormatter={(v) => `N$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#00b4d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ================================ */}
      {/* POSTPAID TAB                     */}
      {/* ================================ */}
      {tab === 1 && (
        <Box>
          {/* Summary cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Active Postpaid Meters', value: '797', icon: <ElectricMeterOutlined />, color: '#6870fa' },
              { label: 'Outstanding Bills', value: 'N$ 2,340,000', icon: <PointOfSaleOutlined />, color: '#f2b705' },
              { label: 'Collection Rate', value: '87.3%', icon: <TrendingUpOutlined />, color: '#4cceac' },
            ].map((card) => (
              <Grid item xs={12} sm={4} key={card.label}>
                <Card sx={darkCard}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${card.color}20`,
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>
                        {card.label}
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
                        {card.value}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Postpaid billing table */}
          <Card sx={darkCard}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                Postpaid Billing Records
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={thSx}>Account No</TableCell>
                      <TableCell sx={thSx}>Customer</TableCell>
                      <TableCell sx={thSx}>Meter No</TableCell>
                      <TableCell sx={thSx} align="right">Bill Amount</TableCell>
                      <TableCell sx={thSx}>Due Date</TableCell>
                      <TableCell sx={thSx} align="right">Paid</TableCell>
                      <TableCell sx={thSx}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {postpaidRows.map((row) => {
                      const chipStyle = statusChipSx[row.status] || statusChipSx.Pending;
                      return (
                        <TableRow key={row.accountNo} sx={{ '&:hover': { background: 'rgba(0,180,216,0.05)' } }}>
                          <TableCell sx={{ ...tdSx, fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.accountNo}</TableCell>
                          <TableCell sx={{ ...tdSx, fontWeight: 600 }}>{row.customer}</TableCell>
                          <TableCell sx={{ ...tdSx, fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.meterNo}</TableCell>
                          <TableCell sx={tdSx} align="right">{fmtCurrency(row.billAmount)}</TableCell>
                          <TableCell sx={tdSx}>
                            {new Date(row.dueDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </TableCell>
                          <TableCell sx={tdSx} align="right">{fmtCurrency(row.paid)}</TableCell>
                          <TableCell sx={tdSx}>
                            <Chip
                              label={row.status}
                              size="small"
                              sx={{
                                backgroundColor: chipStyle.bg,
                                color: chipStyle.text,
                                fontWeight: 600,
                                fontSize: '0.72rem',
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
        </Box>
      )}
    </Box>
  );
}
