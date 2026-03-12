import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  AddBusinessOutlined,
  StorefrontOutlined,
  PointOfSaleOutlined,
  AccountBalanceWalletOutlined,
  PercentOutlined,
  PersonOutlined,
  PhoneOutlined,
  AccessTimeOutlined,
  VisibilityOutlined,
  PlaylistAddCheckOutlined,
  StopCircleOutlined,
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
const fmtCurrency = (n) =>
  `N$ ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmt = (n) => Number(n).toLocaleString();

function formatDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-NA', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-NA', { hour: '2-digit', minute: '2-digit' });
}

export default function Vendors() {
  // ---- Commission summary calculations ----
  const commissionData = vendors.map((v) => {
    const grossSales = v.totalSales;
    const commissionAmount = grossSales * (v.commissionRate / 100);
    const netToNamPower = grossSales - commissionAmount;
    return {
      id: v.id,
      name: v.name,
      commissionRate: v.commissionRate,
      grossSales,
      commissionAmount,
      netToNamPower,
    };
  });

  const totals = commissionData.reduce(
    (acc, row) => ({
      grossSales: acc.grossSales + row.grossSales,
      commissionAmount: acc.commissionAmount + row.commissionAmount,
      netToNamPower: acc.netToNamPower + row.netToNamPower,
    }),
    { grossSales: 0, commissionAmount: 0, netToNamPower: 0 }
  );

  return (
    <Box>
      {/* ---- Page Header ---- */}
      <Header
        title="Vendor Management"
        subtitle="Point-of-sale vendor operations"
        action={
          <Button variant="contained" color="primary" startIcon={<AddBusinessOutlined />}>
            Add Vendor
          </Button>
        }
      />

      {/* ---- Vendor Cards Grid ---- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {vendors.map((v) => (
          <Grid item xs={12} sm={6} md={4} key={v.id}>
            <Card sx={darkCard}>
              <CardContent>
                {/* Name + Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorefrontOutlined sx={{ color: '#6870fa', fontSize: 22 }} />
                    <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
                      {v.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={v.status}
                    size="small"
                    sx={{
                      backgroundColor: v.status === 'Active'
                        ? 'rgba(76, 206, 172, 0.15)'
                        : 'rgba(108, 117, 125, 0.2)',
                      color: v.status === 'Active' ? '#4cceac' : '#6c757d',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      flexShrink: 0,
                    }}
                  />
                </Box>

                {/* Location */}
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', mb: 2 }}>
                  {v.location}
                </Typography>

                {/* Stats grid */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <StatMini
                      icon={<AccountBalanceWalletOutlined sx={{ fontSize: 16 }} />}
                      label="Total Sales"
                      value={fmtCurrency(v.totalSales)}
                      color="#4cceac"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatMini
                      icon={<PointOfSaleOutlined sx={{ fontSize: 16 }} />}
                      label="Transactions"
                      value={fmt(v.transactionCount)}
                      color="#6870fa"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatMini
                      icon={<AccountBalanceWalletOutlined sx={{ fontSize: 16 }} />}
                      label="Balance"
                      value={fmtCurrency(v.balance)}
                      color="#00b4d8"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatMini
                      icon={<PercentOutlined sx={{ fontSize: 16 }} />}
                      label="Commission"
                      value={`${v.commissionRate}%`}
                      color="#f2b705"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1.5 }} />

                {/* Operator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <PersonOutlined sx={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                    Operator:
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>
                    {v.operatorName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <PhoneOutlined sx={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                    {v.operatorPhone}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                  <AccessTimeOutlined sx={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                    Last Activity:
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {formatDateTime(v.lastActivity)}
                  </Typography>
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" startIcon={<VisibilityOutlined />} sx={{ flex: 1 }}>
                    View Details
                  </Button>
                  {v.status === 'Active' ? (
                    <Button variant="outlined" size="small" color="success" startIcon={<PlaylistAddCheckOutlined />} sx={{ flex: 1 }}>
                      Open Batch
                    </Button>
                  ) : (
                    <Button variant="outlined" size="small" color="warning" startIcon={<StopCircleOutlined />} sx={{ flex: 1 }}>
                      Close Batch
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ---- Commission Summary Table ---- */}
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>
        Commission Summary
      </Typography>

      <Card sx={darkCard}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Vendor Name</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }} align="center">Commission Rate</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }} align="right">Gross Sales (N$)</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }} align="right">Commission Amount (N$)</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }} align="right">Net to NamPower (N$)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commissionData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ color: '#fff', fontWeight: 500 }}>{row.name}</TableCell>
                  <TableCell align="center">{row.commissionRate}%</TableCell>
                  <TableCell align="right">{fmtCurrency(row.grossSales)}</TableCell>
                  <TableCell align="right" sx={{ color: '#f2b705' }}>{fmtCurrency(row.commissionAmount)}</TableCell>
                  <TableCell align="right" sx={{ color: '#4cceac' }}>{fmtCurrency(row.netToNamPower)}</TableCell>
                </TableRow>
              ))}

              {/* Totals row */}
              <TableRow sx={{ '& td': { borderTop: '2px solid rgba(255,255,255,0.15)' } }}>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Totals</TableCell>
                <TableCell />
                <TableCell align="right" sx={{ color: '#fff', fontWeight: 700 }}>{fmtCurrency(totals.grossSales)}</TableCell>
                <TableCell align="right" sx={{ color: '#f2b705', fontWeight: 700 }}>{fmtCurrency(totals.commissionAmount)}</TableCell>
                <TableCell align="right" sx={{ color: '#4cceac', fontWeight: 700 }}>{fmtCurrency(totals.netToNamPower)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

// ---- Small stat mini-card inside vendor card ----
function StatMini({ icon, label, value, color }) {
  return (
    <Box
      sx={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 1,
        p: 1,
        textAlign: 'center',
      }}
    >
      <Box sx={{ color: color || 'rgba(255,255,255,0.5)', mb: 0.3, display: 'flex', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', fontSize: '0.65rem', lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: '#fff', fontWeight: 700, fontSize: '0.78rem', mt: 0.2 }}
      >
        {value}
      </Typography>
    </Box>
  );
}
