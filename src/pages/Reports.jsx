import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TodayOutlined,
  CalendarMonthOutlined,
  StorefrontOutlined,
  ElectricBoltOutlined,
  MoneyOffOutlined,
  SecurityOutlined,
  PictureAsPdfOutlined,
  TableChartOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import { vendors } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Helpers ----
const fmt = (n) => Number(n).toLocaleString();
const fmtCurrency = (n) => `N$ ${Number(n).toLocaleString()}`;

// ---- Report types ----
const reportTypes = [
  { id: 'daily', label: 'Daily Sales', icon: <TodayOutlined sx={{ fontSize: 28 }} /> },
  { id: 'monthly', label: 'Monthly Revenue', icon: <CalendarMonthOutlined sx={{ fontSize: 28 }} /> },
  { id: 'vendor', label: 'Vendor Performance', icon: <StorefrontOutlined sx={{ fontSize: 28 }} /> },
  { id: 'consumption', label: 'Customer Consumption', icon: <ElectricBoltOutlined sx={{ fontSize: 28 }} /> },
  { id: 'arrears', label: 'Arrears Collection', icon: <MoneyOffOutlined sx={{ fontSize: 28 }} /> },
  { id: 'audit', label: 'System Audit', icon: <SecurityOutlined sx={{ fontSize: 28 }} /> },
];

// ---- Summary tile data ----
const summaryTiles = [
  { label: 'Total Transactions', value: '1,247', color: '#00b4d8' },
  { label: 'Total Revenue', value: 'N$ 847,520', color: '#4cceac' },
  { label: 'Energy Dispensed', value: '285,400 kWh', color: '#6870fa' },
  { label: 'Arrears Collected', value: 'N$ 34,250', color: '#f2b705' },
  { label: 'VAT Collected', value: 'N$ 110,400', color: '#00b4d8' },
  { label: 'Failed Transactions', value: '12', color: '#db4f4a' },
];

// ---- Vendor report rows (derived from mockData vendors) ----
const vendorRows = vendors
  .filter((v) => v.status === 'Active')
  .map((v) => {
    const transactions = Math.round(v.transactionCount / 10);
    const grossSales = Math.round(v.totalSales / 10);
    const arrearsCollected = Math.round(grossSales * 0.04);
    const vat = Math.round(grossSales * 0.15);
    const commission = Math.round(grossSales * (v.commissionRate / 100));
    const netRevenue = grossSales - commission;
    const energy = Math.round(grossSales / 1.68);
    return {
      vendor: v.name,
      transactions,
      grossSales,
      arrearsCollected,
      vat,
      commission,
      netRevenue,
      energy,
    };
  });

// ---- Totals ----
const totals = vendorRows.reduce(
  (acc, row) => ({
    transactions: acc.transactions + row.transactions,
    grossSales: acc.grossSales + row.grossSales,
    arrearsCollected: acc.arrearsCollected + row.arrearsCollected,
    vat: acc.vat + row.vat,
    commission: acc.commission + row.commission,
    netRevenue: acc.netRevenue + row.netRevenue,
    energy: acc.energy + row.energy,
  }),
  { transactions: 0, grossSales: 0, arrearsCollected: 0, vat: 0, commission: 0, netRevenue: 0, energy: 0 },
);

// ---- Table header cell style ----
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

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('daily');
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-03-12');
  const [vendorFilter, setVendorFilter] = useState('all');

  return (
    <Box>
      <Header
        title="Reports"
        subtitle="Generate, view, and export detailed operational and financial reports"
      />

      {/* ---- Report Type Selector ---- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {reportTypes.map((rt) => (
          <Grid item xs={6} sm={4} md={2} key={rt.id}>
            <Card
              onClick={() => setSelectedReport(rt.id)}
              sx={{
                ...darkCard,
                cursor: 'pointer',
                border: selectedReport === rt.id
                  ? '2px solid #00b4d8'
                  : '1px solid rgba(30, 58, 95, 0.5)',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: selectedReport === rt.id ? '#00b4d8' : 'rgba(0,180,216,0.4)',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ color: selectedReport === rt.id ? '#00b4d8' : 'rgba(255,255,255,0.4)', mb: 0.8 }}>
                  {rt.icon}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: selectedReport === rt.id ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  {rt.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ---- Filters Row ---- */}
      <Card sx={{ ...darkCard, mb: 3 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Date From"
                type="date"
                size="small"
                fullWidth
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true, sx: { color: 'rgba(255,255,255,0.5)' } }}
                InputProps={{ sx: { color: '#fff' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Date To"
                type="date"
                size="small"
                fullWidth
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true, sx: { color: 'rgba(255,255,255,0.5)' } }}
                InputProps={{ sx: { color: '#fff' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl
                size="small"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  },
                }}
              >
                <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Vendor</InputLabel>
                <Select
                  value={vendorFilter}
                  label="Vendor"
                  onChange={(e) => setVendorFilter(e.target.value)}
                  sx={{ color: '#fff' }}
                >
                  <MenuItem value="all">All Vendors</MenuItem>
                  {vendors.map((v) => (
                    <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  background: '#00b4d8',
                  '&:hover': { background: '#0096b7' },
                  fontWeight: 600,
                  textTransform: 'none',
                  height: 40,
                }}
              >
                Generate Report
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ---- Report Summary Tiles ---- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryTiles.map((tile) => (
          <Grid item xs={6} sm={4} md={2} key={tile.label}>
            <Card sx={darkCard}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                  {tile.label}
                </Typography>
                <Typography variant="h6" sx={{ color: tile.color, fontWeight: 700, fontSize: '1.1rem', mt: 0.3 }}>
                  {tile.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ---- Report Table: Daily Sales Breakdown ---- */}
      <Card sx={{ ...darkCard, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
            Daily Sales Breakdown by Vendor
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={thSx}>Vendor</TableCell>
                  <TableCell sx={thSx} align="right">Transactions</TableCell>
                  <TableCell sx={thSx} align="right">Gross Sales</TableCell>
                  <TableCell sx={thSx} align="right">Arrears Collected</TableCell>
                  <TableCell sx={thSx} align="right">VAT</TableCell>
                  <TableCell sx={thSx} align="right">Commission</TableCell>
                  <TableCell sx={thSx} align="right">Net Revenue</TableCell>
                  <TableCell sx={thSx} align="right">Energy (kWh)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendorRows.map((row) => (
                  <TableRow key={row.vendor} sx={{ '&:hover': { background: 'rgba(0,180,216,0.05)' } }}>
                    <TableCell sx={{ ...tdSx, fontWeight: 600 }}>{row.vendor}</TableCell>
                    <TableCell sx={tdSx} align="right">{fmt(row.transactions)}</TableCell>
                    <TableCell sx={tdSx} align="right">{fmtCurrency(row.grossSales)}</TableCell>
                    <TableCell sx={tdSx} align="right">{fmtCurrency(row.arrearsCollected)}</TableCell>
                    <TableCell sx={tdSx} align="right">{fmtCurrency(row.vat)}</TableCell>
                    <TableCell sx={tdSx} align="right">{fmtCurrency(row.commission)}</TableCell>
                    <TableCell sx={tdSx} align="right">{fmtCurrency(row.netRevenue)}</TableCell>
                    <TableCell sx={tdSx} align="right">{fmt(row.energy)}</TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow sx={{ background: 'rgba(0,180,216,0.08)' }}>
                  <TableCell sx={{ ...tdSx, fontWeight: 700, color: '#00b4d8', borderBottom: 'none' }}>TOTALS</TableCell>
                  <TableCell sx={{ ...tdSx, fontWeight: 700, color: '#00b4d8', borderBottom: 'none' }} align="right">{fmt(totals.transactions)}</TableCell>
                  <TableCell sx={{ ...tdSx, fontWeight: 700, color: '#00b4d8', borderBottom: 'none' }} align="right">{fmtCurrency(totals.grossSales)}</TableCell>
                  <TableCell sx={{ ...tdSx, fontWeight: 700, color: '#00b4d8', borderBottom: 'none' }} align="right">{fmtCurrency(totals.arrearsCollected)}</TableCell>
                  <TableCell sx={{ ...tdSx, fontWeight: 700, color: '#00b4d8', borderBottom: 'none' }} align="right">{fmtCurrency(totals.vat)}</TableCell>
                  <TableCell sx={{ ...tdSx, fontWeight: 700, color: '#00b4d8', borderBottom: 'none' }} align="right">{fmtCurrency(totals.commission)}</TableCell>
                  <TableCell sx={{ ...tdSx, fontWeight: 700, color: '#00b4d8', borderBottom: 'none' }} align="right">{fmtCurrency(totals.netRevenue)}</TableCell>
                  <TableCell sx={{ ...tdSx, fontWeight: 700, color: '#00b4d8', borderBottom: 'none' }} align="right">{fmt(totals.energy)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ---- Export Buttons ---- */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfOutlined />}
          sx={{
            color: '#db4f4a',
            borderColor: '#db4f4a',
            '&:hover': { borderColor: '#db4f4a', background: 'rgba(219,79,74,0.1)' },
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Export PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<TableChartOutlined />}
          sx={{
            color: '#4cceac',
            borderColor: '#4cceac',
            '&:hover': { borderColor: '#4cceac', background: 'rgba(76,206,172,0.1)' },
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Export CSV
        </Button>
      </Box>
    </Box>
  );
}
