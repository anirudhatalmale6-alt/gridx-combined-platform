import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  DownloadOutlined,
  SearchOutlined,
  PrintOutlined,
  UndoOutlined,
  ReceiptLongOutlined,
  AttachMoneyOutlined,
  BoltOutlined,
  ReplayOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import { transactions } from '../services/mockData';

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
    d.toLocaleTimeString('en-NA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ---- Status chip colors ----
const statusColor = {
  Completed: { bg: 'rgba(76, 206, 172, 0.15)', text: '#4cceac' },
  Reversed:  { bg: 'rgba(242, 183, 5, 0.15)',  text: '#f2b705' },
  Failed:    { bg: 'rgba(219, 79, 74, 0.15)',  text: '#db4f4a' },
};

// ---- Type chip colors ----
const typeColor = {
  Vend:        { bg: 'rgba(104, 112, 250, 0.15)', text: '#6870fa' },
  Reversal:    { bg: 'rgba(242, 183, 5, 0.15)',  text: '#f2b705' },
  'Free Token': { bg: 'rgba(0, 180, 216, 0.15)',  text: '#00b4d8' },
  Engineering: { bg: 'rgba(108, 117, 125, 0.2)',  text: '#6c757d' },
};

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Reversal dialog state
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState(null);
  const [reverseReason, setReverseReason] = useState('');

  // ---- Filtered transactions ----
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const match =
          t.refNo.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.meterNo.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Date range
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
      // Type
      if (typeFilter !== 'All' && t.type !== typeFilter) return false;
      // Status
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      return true;
    });
  }, [search, dateFrom, dateTo, typeFilter, statusFilter]);

  // ---- Summary stats (from filtered) ----
  const totalCount = filtered.length;
  const grossSales = filtered
    .filter((t) => t.type === 'Vend' && t.status === 'Completed')
    .reduce((s, t) => s + t.amount, 0);
  const energyDispensed = filtered
    .filter((t) => t.status === 'Completed' && t.kWh > 0)
    .reduce((s, t) => s + t.kWh, 0);
  const reversedCount = filtered.filter((t) => t.status === 'Reversed').length;

  // ---- Reversal handlers ----
  const handleReverseClick = (txn) => {
    setReverseTarget(txn);
    setReverseReason('');
    setReverseDialogOpen(true);
  };

  const handleReverseConfirm = () => {
    // In a real app, this would call an API
    setReverseDialogOpen(false);
    setReverseTarget(null);
    setReverseReason('');
  };

  const handleReverseCancel = () => {
    setReverseDialogOpen(false);
    setReverseTarget(null);
    setReverseReason('');
  };

  return (
    <Box>
      {/* ---- Page Header ---- */}
      <Header
        title="Transaction History"
        subtitle="Complete audit trail of all vending operations"
        action={
          <>
            <Button variant="outlined" size="small" startIcon={<DownloadOutlined />}>
              Export CSV
            </Button>
            <Button variant="outlined" size="small" startIcon={<DownloadOutlined />}>
              Export PDF
            </Button>
          </>
        }
      />

      {/* ---- Filters Row ---- */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Date From"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          size="small"
          label="Date To"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          size="small"
          placeholder="Search by reference, customer, meter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ color: 'rgba(255,255,255,0.4)' }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Vend">Vend</MenuItem>
            <MenuItem value="Reversal">Reversal</MenuItem>
            <MenuItem value="Free Token">Free Token</MenuItem>
            <MenuItem value="Engineering">Engineering</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Reversed">Reversed</MenuItem>
            <MenuItem value="Failed">Failed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* ---- Summary Stats Row ---- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={darkCard}>
            <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <ReceiptLongOutlined sx={{ color: '#6870fa', fontSize: 24, mb: 0.3 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', fontSize: '0.7rem' }}>
                Total Transactions
              </Typography>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                {fmt(totalCount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={darkCard}>
            <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <AttachMoneyOutlined sx={{ color: '#4cceac', fontSize: 24, mb: 0.3 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', fontSize: '0.7rem' }}>
                Gross Sales
              </Typography>
              <Typography variant="h6" sx={{ color: '#4cceac', fontWeight: 700, fontSize: '1.1rem' }}>
                {fmtCurrency(grossSales)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={darkCard}>
            <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <BoltOutlined sx={{ color: '#f2b705', fontSize: 24, mb: 0.3 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', fontSize: '0.7rem' }}>
                Energy Dispensed
              </Typography>
              <Typography variant="h6" sx={{ color: '#f2b705', fontWeight: 700, fontSize: '1.1rem' }}>
                {fmt(Math.round(energyDispensed))} kWh
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={darkCard}>
            <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <ReplayOutlined sx={{ color: '#db4f4a', fontSize: 24, mb: 0.3 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', fontSize: '0.7rem' }}>
                Reversed
              </Typography>
              <Typography variant="h6" sx={{ color: '#db4f4a', fontWeight: 700, fontSize: '1.1rem' }}>
                {reversedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ---- Main Transaction Table ---- */}
      <Card sx={darkCard}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Date/Time</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Reference</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Customer Name</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Meter No</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }} align="right">Amount</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }} align="right">kWh</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Token</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Operator</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    {formatDateTime(t.dateTime)}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {t.refNo}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 500, fontSize: '0.82rem' }}>
                    {t.customerName}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {t.meterNo}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    {fmtCurrency(t.amount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.82rem' }}>
                    {t.kWh.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>
                    {t.token.substring(0, 8)}...
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.78rem' }}>
                    {t.operator}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.type}
                      size="small"
                      sx={{
                        backgroundColor: typeColor[t.type]?.bg || 'rgba(255,255,255,0.1)',
                        color: typeColor[t.type]?.text || '#fff',
                        fontWeight: 600,
                        fontSize: '0.68rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.status}
                      size="small"
                      sx={{
                        backgroundColor: statusColor[t.status]?.bg || 'rgba(255,255,255,0.1)',
                        color: statusColor[t.status]?.text || '#fff',
                        fontWeight: 600,
                        fontSize: '0.68rem',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="Reprint">
                        <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                          <PrintOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {t.type === 'Vend' && t.status === 'Completed' && (
                        <Tooltip title="Reverse">
                          <IconButton
                            size="small"
                            sx={{ color: '#db4f4a' }}
                            onClick={() => handleReverseClick(t)}
                          >
                            <UndoOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.35)' }}>
                    No transactions match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ---- Reversal Confirmation Dialog ---- */}
      <Dialog
        open={reverseDialogOpen}
        onClose={handleReverseCancel}
        PaperProps={{
          sx: {
            background: '#152238',
            border: '1px solid rgba(30, 58, 95, 0.5)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 700 }}>
          Confirm Reversal
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
            You are about to reverse transaction{' '}
            <strong style={{ color: '#fff' }}>{reverseTarget?.refNo}</strong> for customer{' '}
            <strong style={{ color: '#fff' }}>{reverseTarget?.customerName}</strong> (
            {reverseTarget ? fmtCurrency(reverseTarget.amount) : ''}).
          </DialogContentText>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
            This action cannot be undone. Please provide a reason for the reversal.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Reason for reversal"
            value={reverseReason}
            onChange={(e) => setReverseReason(e.target.value)}
            multiline
            rows={2}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleReverseCancel} variant="outlined" size="small">
            Cancel
          </Button>
          <Button
            onClick={handleReverseConfirm}
            variant="contained"
            color="error"
            size="small"
            disabled={!reverseReason.trim()}
            startIcon={<UndoOutlined />}
          >
            Reverse Transaction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
