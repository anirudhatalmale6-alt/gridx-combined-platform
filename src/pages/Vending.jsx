import { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  Divider,
  InputAdornment,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  SearchOutlined,
  BoltOutlined,
  ContentCopyOutlined,
  PrintOutlined,
  SmsOutlined,
  AddOutlined,
  PersonOutlined,
  ElectricMeterOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import { customers, tariffGroups, tariffConfig } from '../services/mockData';

// ---- Helpers ----------------------------------------------------------------

const cardSx = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

const fmtN$ = (v) => `N$ ${Number(v).toFixed(2)}`;

const presetAmounts = [10, 25, 50, 100, 200, 500];

const sampleCustomers = customers.slice(0, 4);

function generateToken() {
  let t = '';
  for (let i = 0; i < 20; i++) t += Math.floor(Math.random() * 10);
  return t;
}

function formatToken(t) {
  return t.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Calculate kWh from a gross amount using the Namibian STS vending formula:
 *  1. Remove VAT
 *  2. Subtract fixed charge + REL levy
 *  3. Deduct arrears (25% of original amount, capped at balance)
 *  4. Apply remaining to tariff blocks
 */
function calculateBreakdown(amount, arrears, tariffBlocks) {
  const vatAmount = amount - amount / (1 + tariffConfig.vatRate / 100);
  const afterVat = amount - vatAmount;
  const afterFixed = afterVat - tariffConfig.fixedCharge;
  const afterLevy = afterFixed - tariffConfig.relLevy;

  let arrearsDeduction = 0;
  if (arrears > 0) {
    arrearsDeduction = Math.min(amount * (tariffConfig.arrearsPercentage / 100), arrears);
  }

  const netEnergy = Math.max(afterLevy - arrearsDeduction, 0);

  // Apply tariff blocks
  let remaining = netEnergy;
  let totalKwh = 0;
  const blocksUsed = [];

  for (const block of tariffBlocks) {
    if (remaining <= 0) break;
    const blockCapacity = block.max === Infinity ? Infinity : block.max - (block.min > 0 ? block.min - 1 : 0);
    const kwhInBlock = Math.min(remaining / block.rate, blockCapacity);
    const costInBlock = kwhInBlock * block.rate;

    blocksUsed.push({
      name: block.name,
      range: block.range,
      rate: block.rate,
      kWh: kwhInBlock,
      cost: costInBlock,
    });

    totalKwh += kwhInBlock;
    remaining -= costInBlock;
  }

  return {
    amountTendered: amount,
    vatAmount,
    fixedCharge: tariffConfig.fixedCharge,
    relLevy: tariffConfig.relLevy,
    arrearsDeduction,
    netEnergy,
    totalKwh,
    blocksUsed,
  };
}

// ---- Component --------------------------------------------------------------

export default function Vending() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [generatedToken, setGeneratedToken] = useState(null);
  const [copied, setCopied] = useState(false);

  // Effective amount
  const amount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0);

  // Tariff blocks for selected customer
  const tariffBlocks = useMemo(() => {
    if (!selectedCustomer) return [];
    const group = tariffGroups.find((g) => g.name === selectedCustomer.tariffGroup);
    return group ? group.blocks : tariffGroups[0].blocks;
  }, [selectedCustomer]);

  // Breakdown calculation
  const breakdown = useMemo(() => {
    if (!selectedCustomer || !amount || amount <= 0) return null;
    return calculateBreakdown(amount, selectedCustomer.arrears, tariffBlocks);
  }, [amount, selectedCustomer, tariffBlocks]);

  // Search handler
  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const found = customers.find(
      (c) =>
        c.meterNo.toLowerCase().includes(q) ||
        c.accountNo.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
    if (found) {
      setSelectedCustomer(found);
      setSelectedAmount(null);
      setCustomAmount('');
      setGeneratedToken(null);
    }
  };

  const handleSelectCustomer = (c) => {
    setSelectedCustomer(c);
    setSearchQuery(c.meterNo);
    setSelectedAmount(null);
    setCustomAmount('');
    setGeneratedToken(null);
  };

  const handlePresetClick = (val) => {
    setSelectedAmount(val);
    setCustomAmount('');
    setGeneratedToken(null);
  };

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(null);
    setGeneratedToken(null);
  };

  const handleGenerate = () => {
    setGeneratedToken(generateToken());
  };

  const handleCopy = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(formatToken(generatedToken));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewTransaction = () => {
    setSelectedCustomer(null);
    setSearchQuery('');
    setSelectedAmount(null);
    setCustomAmount('');
    setGeneratedToken(null);
  };

  return (
    <Box>
      <Header
        title="Token Vending"
        subtitle="STS prepaid electricity token generation and sales"
      />

      <Grid container spacing={3}>
        {/* ---- LEFT COLUMN ---- */}
        <Grid item xs={12} md={8}>
          {/* Section 1: Customer Lookup */}
          <Card sx={{ ...cardSx, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                Customer Lookup
              </Typography>

              <TextField
                fullWidth
                placeholder="Search by meter number or account ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined sx={{ color: 'rgba(255,255,255,0.4)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    '& fieldset': { borderColor: 'rgba(30,58,95,0.5)' },
                    '&:hover fieldset': { borderColor: 'rgba(0,188,212,0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#00bcd4' },
                  },
                }}
              />

              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.4)', mb: 1, display: 'block' }}
              >
                Quick load:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {sampleCustomers.map((c) => (
                  <Chip
                    key={c.id}
                    icon={<PersonOutlined sx={{ fontSize: 16 }} />}
                    label={`${c.name} (${c.meterNo})`}
                    onClick={() => handleSelectCustomer(c)}
                    variant={selectedCustomer?.id === c.id ? 'filled' : 'outlined'}
                    sx={{
                      color: '#fff',
                      borderColor: 'rgba(0,188,212,0.4)',
                      '&:hover': { backgroundColor: 'rgba(0,188,212,0.15)' },
                      ...(selectedCustomer?.id === c.id && {
                        backgroundColor: 'rgba(0,188,212,0.25)',
                        borderColor: '#00bcd4',
                      }),
                    }}
                  />
                ))}
              </Box>

              {selectedCustomer && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: 'rgba(0,188,212,0.06)',
                    border: '1px solid rgba(0,188,212,0.2)',
                  }}
                >
                  <Grid container spacing={1}>
                    {[
                      ['Name', selectedCustomer.name],
                      ['Account No', selectedCustomer.accountNo],
                      ['Meter No', selectedCustomer.meterNo],
                      ['Area', selectedCustomer.area],
                      ['Tariff Group', selectedCustomer.tariffGroup],
                      ['Status', selectedCustomer.status],
                      ['Arrears', fmtN$(selectedCustomer.arrears)],
                    ].map(([label, val]) => (
                      <Grid item xs={6} sm={4} key={label}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                          {label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              label === 'Arrears' && selectedCustomer.arrears > 0
                                ? '#f44336'
                                : '#fff',
                            fontWeight: 500,
                            fontFamily:
                              label === 'Account No' || label === 'Meter No'
                                ? 'monospace'
                                : 'inherit',
                          }}
                        >
                          {val}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Purchase Token */}
          {selectedCustomer && (
            <Card sx={{ ...cardSx, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                  Purchase Token
                </Typography>

                {/* Preset amounts */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {presetAmounts.map((v) => (
                    <Button
                      key={v}
                      variant={selectedAmount === v ? 'contained' : 'outlined'}
                      onClick={() => handlePresetClick(v)}
                      sx={{
                        minWidth: 80,
                        color: selectedAmount === v ? '#0a1628' : '#00bcd4',
                        borderColor: 'rgba(0,188,212,0.4)',
                        backgroundColor: selectedAmount === v ? '#00bcd4' : 'transparent',
                        '&:hover': {
                          backgroundColor:
                            selectedAmount === v ? '#00acc1' : 'rgba(0,188,212,0.1)',
                          borderColor: '#00bcd4',
                        },
                      }}
                    >
                      N${v}
                    </Button>
                  ))}
                </Box>

                {/* Custom amount */}
                <TextField
                  label="Custom Amount (N$)"
                  type="number"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  sx={{
                    mb: 3,
                    width: 240,
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      '& fieldset': { borderColor: 'rgba(30,58,95,0.5)' },
                      '&:hover fieldset': { borderColor: 'rgba(0,188,212,0.4)' },
                      '&.Mui-focused fieldset': { borderColor: '#00bcd4' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.45)' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#00bcd4' },
                  }}
                />

                {/* Transaction Breakdown */}
                {breakdown && (
                  <Card
                    sx={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(30,58,95,0.4)',
                      borderRadius: 1,
                      mb: 3,
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: 'rgba(255,255,255,0.6)', mb: 1, fontWeight: 600 }}
                      >
                        Transaction Breakdown
                      </Typography>

                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(30,58,95,0.3)', pl: 0 }}>
                              Amount Tendered
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#fff', borderBottom: '1px solid rgba(30,58,95,0.3)', pr: 0 }}>
                              {fmtN$(breakdown.amountTendered)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(30,58,95,0.3)', pl: 0 }}>
                              VAT ({tariffConfig.vatRate}%)
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#f44336', borderBottom: '1px solid rgba(30,58,95,0.3)', pr: 0 }}>
                              -{fmtN$(breakdown.vatAmount)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(30,58,95,0.3)', pl: 0 }}>
                              Fixed Charge
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#f44336', borderBottom: '1px solid rgba(30,58,95,0.3)', pr: 0 }}>
                              -{fmtN$(breakdown.fixedCharge)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(30,58,95,0.3)', pl: 0 }}>
                              REL Levy
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#f44336', borderBottom: '1px solid rgba(30,58,95,0.3)', pr: 0 }}>
                              -{fmtN$(breakdown.relLevy)}
                            </TableCell>
                          </TableRow>
                          {breakdown.arrearsDeduction > 0 && (
                            <TableRow>
                              <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(30,58,95,0.3)', pl: 0 }}>
                                Arrears Deduction ({tariffConfig.arrearsPercentage}%)
                              </TableCell>
                              <TableCell align="right" sx={{ color: '#ff9800', borderBottom: '1px solid rgba(30,58,95,0.3)', pr: 0 }}>
                                -{fmtN$(breakdown.arrearsDeduction)}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(30,58,95,0.3)', pl: 0 }}>
                              Net Energy Amount
                            </TableCell>
                            <TableCell align="right" sx={{ color: '#4caf50', fontWeight: 600, borderBottom: '1px solid rgba(30,58,95,0.3)', pr: 0 }}>
                              {fmtN$(breakdown.netEnergy)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>

                      <Divider sx={{ borderColor: 'rgba(0,188,212,0.3)', my: 1.5 }} />

                      {/* kWh result */}
                      <Box sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                          kWh Calculated
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{
                            color: '#00bcd4',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                          }}
                        >
                          {breakdown.totalKwh.toFixed(2)} kWh
                        </Typography>
                      </Box>

                      {/* Tariff blocks consumed */}
                      {breakdown.blocksUsed.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.5 }}
                          >
                            Tariff blocks consumed:
                          </Typography>
                          {breakdown.blocksUsed.map((b, i) => (
                            <Box
                              key={i}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                px: 1,
                                py: 0.3,
                              }}
                            >
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                {b.name} ({b.range}) @ N${b.rate}/kWh
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: '#00bcd4', fontFamily: 'monospace' }}
                              >
                                {b.kWh.toFixed(2)} kWh
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Generate button */}
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<BoltOutlined />}
                  disabled={!breakdown || breakdown.netEnergy <= 0}
                  onClick={handleGenerate}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #00bcd4, #0097a7)',
                    color: '#0a1628',
                    '&:hover': { background: 'linear-gradient(135deg, #00acc1, #00838f)' },
                    '&.Mui-disabled': {
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.3)',
                    },
                  }}
                >
                  Generate Token
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Section 3: Generated Token */}
          {generatedToken && (
            <Card sx={{ ...cardSx }}>
              <CardContent>
                <Alert
                  severity="success"
                  sx={{
                    mb: 2,
                    backgroundColor: 'rgba(76,175,80,0.1)',
                    color: '#4caf50',
                    border: '1px solid rgba(76,175,80,0.3)',
                    '& .MuiAlert-icon': { color: '#4caf50' },
                  }}
                >
                  Token generated successfully for {selectedCustomer?.name}. {breakdown?.totalKwh.toFixed(2)} kWh purchased.
                </Alert>

                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                  Generated Token
                </Typography>

                <Box
                  sx={{
                    textAlign: 'center',
                    py: 3,
                    px: 2,
                    borderRadius: 2,
                    background: 'rgba(0,188,212,0.06)',
                    border: '1px solid rgba(0,188,212,0.25)',
                    mb: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mb: 1, display: 'block' }}>
                    20-Digit STS Token
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontFamily: '"Courier New", monospace',
                      fontWeight: 700,
                      color: '#00bcd4',
                      letterSpacing: 3,
                    }}
                  >
                    {formatToken(generatedToken)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyOutlined />}
                    onClick={handleCopy}
                    sx={{
                      color: copied ? '#4caf50' : '#00bcd4',
                      borderColor: copied ? '#4caf50' : 'rgba(0,188,212,0.4)',
                      '&:hover': { borderColor: '#00bcd4', backgroundColor: 'rgba(0,188,212,0.1)' },
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PrintOutlined />}
                    sx={{
                      color: '#00bcd4',
                      borderColor: 'rgba(0,188,212,0.4)',
                      '&:hover': { borderColor: '#00bcd4', backgroundColor: 'rgba(0,188,212,0.1)' },
                    }}
                  >
                    Print Receipt
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SmsOutlined />}
                    sx={{
                      color: '#00bcd4',
                      borderColor: 'rgba(0,188,212,0.4)',
                      '&:hover': { borderColor: '#00bcd4', backgroundColor: 'rgba(0,188,212,0.1)' },
                    }}
                  >
                    Send SMS
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AddOutlined />}
                    onClick={handleNewTransaction}
                    sx={{
                      color: '#00bcd4',
                      borderColor: 'rgba(0,188,212,0.4)',
                      '&:hover': { borderColor: '#00bcd4', backgroundColor: 'rgba(0,188,212,0.1)' },
                    }}
                  >
                    New Transaction
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* ---- RIGHT COLUMN ---- */}
        <Grid item xs={12} md={4}>
          <Card sx={{ ...cardSx, position: 'sticky', top: 24 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ElectricMeterOutlined sx={{ color: '#00bcd4' }} />
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                  Customer Information
                </Typography>
              </Box>

              {selectedCustomer ? (
                <Box>
                  <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
                    {selectedCustomer.name}
                  </Typography>

                  {[
                    { label: 'Account No', value: selectedCustomer.accountNo, mono: true },
                    { label: 'Meter No', value: selectedCustomer.meterNo, mono: true },
                    { label: 'Area', value: selectedCustomer.area },
                    { label: 'Address', value: selectedCustomer.address },
                    { label: 'Tariff', value: selectedCustomer.tariffGroup },
                    { label: 'Meter Make', value: selectedCustomer.meterMake },
                  ].map((item) => (
                    <Box key={item.label} sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        {item.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#fff',
                          fontFamily: item.mono ? 'monospace' : 'inherit',
                          fontWeight: 500,
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  ))}

                  <Divider sx={{ borderColor: 'rgba(30,58,95,0.4)', my: 2 }} />

                  {/* Arrears */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      Outstanding Arrears
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: selectedCustomer.arrears > 0 ? '#f44336' : '#4caf50',
                        fontWeight: 700,
                      }}
                    >
                      {fmtN$(selectedCustomer.arrears)}
                    </Typography>
                  </Box>

                  {/* Last Purchase */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      Last Purchase
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      {new Date(selectedCustomer.lastPurchaseDate).toLocaleDateString('en-NA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      &mdash; {fmtN$(selectedCustomer.lastPurchaseAmount)}
                    </Typography>
                  </Box>

                  {/* Status */}
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.5 }}
                    >
                      Status
                    </Typography>
                    <Chip
                      label={selectedCustomer.status}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor:
                          selectedCustomer.status === 'Active'
                            ? 'rgba(76,175,80,0.25)'
                            : selectedCustomer.status === 'Arrears'
                            ? 'rgba(255,152,0,0.25)'
                            : selectedCustomer.status === 'Suspended'
                            ? 'rgba(244,67,54,0.25)'
                            : 'rgba(158,158,158,0.25)',
                        border: `1px solid ${
                          selectedCustomer.status === 'Active'
                            ? '#4caf50'
                            : selectedCustomer.status === 'Arrears'
                            ? '#ff9800'
                            : selectedCustomer.status === 'Suspended'
                            ? '#f44336'
                            : '#9e9e9e'
                        }`,
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    py: 6,
                    textAlign: 'center',
                  }}
                >
                  <PersonOutlined sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                    Search for a customer or select from quick-load options to begin a vending transaction.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
