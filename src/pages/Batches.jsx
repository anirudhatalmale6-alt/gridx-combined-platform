import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  AddOutlined,
  AccountBalanceOutlined,
  LockOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import { salesBatches, bankingBatches, vendors } from '../services/mockData';

// ---- Helpers ----------------------------------------------------------------

const cardSx = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.2)',
    '& fieldset': { borderColor: 'rgba(30,58,95,0.5)' },
    '&:hover fieldset': { borderColor: 'rgba(0,188,212,0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#00bcd4' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.45)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#00bcd4' },
};

const selectSx = {
  color: '#fff',
  backgroundColor: 'rgba(0,0,0,0.2)',
  '& fieldset': { borderColor: 'rgba(30,58,95,0.5)' },
  '&:hover fieldset': { borderColor: 'rgba(0,188,212,0.4)' },
  '&.Mui-focused fieldset': { borderColor: '#00bcd4' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.4)' },
};

const headerCellSx = {
  color: 'rgba(255,255,255,0.5)',
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '1px solid rgba(30,58,95,0.4)',
  whiteSpace: 'nowrap',
};

const bodyCellSx = {
  color: '#fff',
  borderBottom: '1px solid rgba(30,58,95,0.25)',
  fontSize: '0.85rem',
};

function fmtDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-NA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtN$(v) {
  return `N$ ${Number(v).toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function salesStatusChip(status) {
  const isOpen = status === 'Open';
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        fontWeight: 600,
        color: '#fff',
        backgroundColor: isOpen ? 'rgba(76,175,80,0.25)' : 'rgba(158,158,158,0.25)',
        border: `1px solid ${isOpen ? '#4caf50' : '#9e9e9e'}`,
      }}
    />
  );
}

function bankingStatusChip(status) {
  const colors = {
    Pending: { bg: 'rgba(255,193,7,0.2)', border: '#ffc107' },
    Submitted: { bg: 'rgba(33,150,243,0.2)', border: '#2196f3' },
    Reconciled: { bg: 'rgba(76,175,80,0.2)', border: '#4caf50' },
  };
  const c = colors[status] || colors.Pending;
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        fontWeight: 600,
        color: '#fff',
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
      }}
    />
  );
}

// ---- Component --------------------------------------------------------------

export default function Batches() {
  const [tabIndex, setTabIndex] = useState(0);

  // Sales batch dialog
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [newBatchVendor, setNewBatchVendor] = useState('');
  const [newBatchNotes, setNewBatchNotes] = useState('');

  // Banking batch dialog
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankSalesBatch, setBankSalesBatch] = useState('');
  const [bankRef, setBankRef] = useState('');

  // Local copies for demo mutations
  const [localSalesBatches, setLocalSalesBatches] = useState(salesBatches);
  const [localBankingBatches, setLocalBankingBatches] = useState(bankingBatches);

  // Closed sales batches for banking
  const closedSalesBatches = localSalesBatches.filter((b) => b.status === 'Closed');

  // Selected closed batch amount
  const selectedClosedBatch = closedSalesBatches.find((b) => b.id === bankSalesBatch);

  // Handlers
  const handleOpenNewBatch = () => {
    setNewBatchVendor('');
    setNewBatchNotes('');
    setSalesDialogOpen(true);
  };

  const handleCreateSalesBatch = () => {
    const vendor = vendors.find((v) => v.id === newBatchVendor);
    if (!vendor) return;
    const newBatch = {
      id: `SB-${String(localSalesBatches.length + 1).padStart(3, '0')}`,
      batchNo: `BATCH-${String(localSalesBatches.length + 1).padStart(3, '0')}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      status: 'Open',
      transactionCount: 0,
      totalAmount: 0,
      openedAt: new Date().toISOString(),
      closedAt: null,
      notes: newBatchNotes,
    };
    setLocalSalesBatches((prev) => [...prev, newBatch]);
    setSalesDialogOpen(false);
  };

  const handleCloseBatch = (batchId) => {
    setLocalSalesBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? { ...b, status: 'Closed', closedAt: new Date().toISOString() }
          : b
      )
    );
  };

  const handleOpenBankDialog = () => {
    setBankSalesBatch('');
    setBankRef('');
    setBankDialogOpen(true);
  };

  const handleCreateBankingBatch = () => {
    if (!selectedClosedBatch || !bankRef) return;
    const newBank = {
      id: `BB-${String(localBankingBatches.length + 1).padStart(3, '0')}`,
      batchNo: `BANK-2026-${String(localBankingBatches.length + 1).padStart(3, '0')}`,
      salesBatchId: selectedClosedBatch.id,
      bankRef,
      status: 'Pending',
      totalAmount: selectedClosedBatch.totalAmount,
      createdAt: new Date().toISOString(),
    };
    setLocalBankingBatches((prev) => [...prev, newBank]);
    setBankDialogOpen(false);
  };

  return (
    <Box>
      <Header
        title="Batch Management"
        subtitle="Manage sales and banking batch reconciliation"
      />

      <Card sx={cardSx}>
        <CardContent>
          {/* Tabs */}
          <Box sx={{ borderBottom: '1px solid rgba(30,58,95,0.4)', mb: 3 }}>
            <Tabs
              value={tabIndex}
              onChange={(_, v) => setTabIndex(v)}
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                },
                '& .Mui-selected': { color: '#00bcd4' },
                '& .MuiTabs-indicator': { backgroundColor: '#00bcd4' },
              }}
            >
              <Tab label="Sales Batches" />
              <Tab label="Banking Batches" />
            </Tabs>
          </Box>

          {/* ---- Sales Batches Tab ---- */}
          {tabIndex === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddOutlined />}
                  onClick={handleOpenNewBatch}
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #00bcd4, #0097a7)',
                    color: '#0a1628',
                    '&:hover': { background: 'linear-gradient(135deg, #00acc1, #00838f)' },
                  }}
                >
                  Open New Batch
                </Button>
              </Box>

              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>Batch ID</TableCell>
                      <TableCell sx={headerCellSx}>Vendor</TableCell>
                      <TableCell sx={headerCellSx}>Status</TableCell>
                      <TableCell sx={headerCellSx} align="right">Transactions</TableCell>
                      <TableCell sx={headerCellSx} align="right">Total Amount</TableCell>
                      <TableCell sx={headerCellSx}>Opened</TableCell>
                      <TableCell sx={headerCellSx}>Closed</TableCell>
                      <TableCell sx={headerCellSx} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localSalesBatches.map((batch) => (
                      <TableRow
                        key={batch.id}
                        sx={{ '&:hover': { backgroundColor: 'rgba(0,188,212,0.04)' } }}
                      >
                        <TableCell sx={{ ...bodyCellSx, fontFamily: 'monospace', fontWeight: 600 }}>
                          {batch.batchNo}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>{batch.vendorName}</TableCell>
                        <TableCell sx={bodyCellSx}>{salesStatusChip(batch.status)}</TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {batch.transactionCount.toLocaleString()}
                        </TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {fmtN$(batch.totalAmount)}
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, whiteSpace: 'nowrap' }}>
                          {fmtDate(batch.openedAt)}
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, whiteSpace: 'nowrap' }}>
                          {fmtDate(batch.closedAt)}
                        </TableCell>
                        <TableCell sx={bodyCellSx} align="center">
                          {batch.status === 'Open' && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<LockOutlined sx={{ fontSize: 16 }} />}
                              onClick={() => handleCloseBatch(batch.id)}
                              sx={{
                                color: '#ff9800',
                                borderColor: 'rgba(255,152,0,0.4)',
                                fontSize: '0.75rem',
                                textTransform: 'none',
                                '&:hover': {
                                  borderColor: '#ff9800',
                                  backgroundColor: 'rgba(255,152,0,0.1)',
                                },
                              }}
                            >
                              Close Batch
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}

          {/* ---- Banking Batches Tab ---- */}
          {tabIndex === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AccountBalanceOutlined />}
                  onClick={handleOpenBankDialog}
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #00bcd4, #0097a7)',
                    color: '#0a1628',
                    '&:hover': { background: 'linear-gradient(135deg, #00acc1, #00838f)' },
                  }}
                >
                  Create Banking Batch
                </Button>
              </Box>

              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>Batch ID</TableCell>
                      <TableCell sx={headerCellSx}>Sales Batch Ref</TableCell>
                      <TableCell sx={headerCellSx}>Bank Reference</TableCell>
                      <TableCell sx={headerCellSx}>Status</TableCell>
                      <TableCell sx={headerCellSx} align="right">Total Amount</TableCell>
                      <TableCell sx={headerCellSx}>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localBankingBatches.map((batch) => (
                      <TableRow
                        key={batch.id}
                        sx={{ '&:hover': { backgroundColor: 'rgba(0,188,212,0.04)' } }}
                      >
                        <TableCell sx={{ ...bodyCellSx, fontFamily: 'monospace', fontWeight: 600 }}>
                          {batch.batchNo}
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, fontFamily: 'monospace' }}>
                          {batch.salesBatchId}
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, fontFamily: 'monospace' }}>
                          {batch.bankRef}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>{bankingStatusChip(batch.status)}</TableCell>
                        <TableCell sx={bodyCellSx} align="right">
                          {fmtN$(batch.totalAmount)}
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, whiteSpace: 'nowrap' }}>
                          {fmtDate(batch.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ---- Open New Sales Batch Dialog ---- */}
      <Dialog
        open={salesDialogOpen}
        onClose={() => setSalesDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#152238',
            border: '1px solid rgba(30,58,95,0.5)',
            color: '#fff',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#fff' }}>Open New Sales Batch</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.45)', '&.Mui-focused': { color: '#00bcd4' } }}>
              Vendor
            </InputLabel>
            <Select
              value={newBatchVendor}
              label="Vendor"
              onChange={(e) => setNewBatchVendor(e.target.value)}
              sx={selectSx}
              MenuProps={{ PaperProps: { sx: { backgroundColor: '#1a2d47', color: '#fff' } } }}
            >
              {vendors
                .filter((v) => v.status === 'Active')
                .map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={newBatchNotes}
            onChange={(e) => setNewBatchNotes(e.target.value)}
            sx={textFieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setSalesDialogOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!newBatchVendor}
            onClick={handleCreateSalesBatch}
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, #00bcd4, #0097a7)',
              color: '#0a1628',
              '&:hover': { background: 'linear-gradient(135deg, #00acc1, #00838f)' },
              '&.Mui-disabled': { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' },
            }}
          >
            Open Batch
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Create Banking Batch Dialog ---- */}
      <Dialog
        open={bankDialogOpen}
        onClose={() => setBankDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#152238',
            border: '1px solid rgba(30,58,95,0.5)',
            color: '#fff',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#fff' }}>Create Banking Batch</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.45)', '&.Mui-focused': { color: '#00bcd4' } }}>
              Select Closed Sales Batch
            </InputLabel>
            <Select
              value={bankSalesBatch}
              label="Select Closed Sales Batch"
              onChange={(e) => setBankSalesBatch(e.target.value)}
              sx={selectSx}
              MenuProps={{ PaperProps: { sx: { backgroundColor: '#1a2d47', color: '#fff' } } }}
            >
              {closedSalesBatches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.batchNo} -- {b.vendorName} ({fmtN$(b.totalAmount)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Bank Reference"
            placeholder="e.g. FNB-WHK-20260312-001"
            value={bankRef}
            onChange={(e) => setBankRef(e.target.value)}
            sx={{ ...textFieldSx, mb: 2 }}
          />

          <TextField
            fullWidth
            label="Total Amount"
            value={selectedClosedBatch ? fmtN$(selectedClosedBatch.totalAmount) : ''}
            InputProps={{ readOnly: true }}
            sx={{
              ...textFieldSx,
              '& .MuiOutlinedInput-root': {
                ...textFieldSx['& .MuiOutlinedInput-root'],
                backgroundColor: 'rgba(0,0,0,0.35)',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setBankDialogOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!bankSalesBatch || !bankRef}
            onClick={handleCreateBankingBatch}
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, #00bcd4, #0097a7)',
              color: '#0a1628',
              '&:hover': { background: 'linear-gradient(135deg, #00acc1, #00838f)' },
              '&.Mui-disabled': { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
