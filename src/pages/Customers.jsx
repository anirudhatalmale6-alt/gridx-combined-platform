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
  Divider,
} from '@mui/material';
import {
  SearchOutlined,
  PersonAddOutlined,
  ConfirmationNumberOutlined,
  EditOutlined,
  ReceiptLongOutlined,
  SmsOutlined,
  BlockOutlined,
  CheckCircleOutlined,
  PeopleOutlined,
  WarningAmberOutlined,
  DoNotDisturbOutlined,
  LocationOnOutlined,
  PhoneOutlined,
  EmailOutlined,
  GpsFixedOutlined,
  SpeedOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import { customers } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Helpers ----
const fmtCurrency = (n) => `N$ ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusColor = {
  Active:    { bg: 'rgba(76, 206, 172, 0.15)', text: '#4cceac' },
  Arrears:   { bg: 'rgba(242, 183, 5, 0.15)',  text: '#f2b705' },
  Suspended: { bg: 'rgba(219, 79, 74, 0.15)',  text: '#db4f4a' },
};

const areas = [
  'All Areas',
  'Grunau',
  'Noordoewer',
  'Groot Aub',
  'Dordabis',
  'Seeis',
  'Stampriet',
  'Windhoek West',
  'Khomasdal',
  'Katutura',
];

function formatDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-NA', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-NA', { hour: '2-digit', minute: '2-digit' });
}

export default function Customers() {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All Areas');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);

  // ---- Filtered list ----
  const filtered = useMemo(() => {
    return customers.filter((c) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.accountNo.toLowerCase().includes(q) ||
          c.meterNo.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Area
      if (areaFilter !== 'All Areas' && c.area !== areaFilter) return false;
      // Status
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      return true;
    });
  }, [search, areaFilter, statusFilter]);

  const selected = customers.find((c) => c.id === selectedId) || null;

  // ---- Summary stats ----
  const totalCustomers = customers.length;
  const activeCount = customers.filter((c) => c.status === 'Active').length;
  const arrearsCustomers = customers.filter((c) => c.status === 'Arrears');
  const arrearsCount = arrearsCustomers.length;
  const totalArrears = arrearsCustomers.reduce((s, c) => s + c.arrears, 0);
  const suspendedCount = customers.filter((c) => c.status === 'Suspended').length;

  return (
    <Box>
      {/* ---- Page Header ---- */}
      <Header
        title="Customer Registry"
        subtitle="3,247 registered meters across all areas"
        action={
          <Button variant="contained" color="primary" startIcon={<PersonAddOutlined />}>
            Add Customer
          </Button>
        }
      />

      {/* ---- Filters Row ---- */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name, account ID, or meter number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ color: 'rgba(255,255,255,0.4)' }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Area</InputLabel>
          <Select
            value={areaFilter}
            label="Area"
            onChange={(e) => setAreaFilter(e.target.value)}
          >
            {areas.map((a) => (
              <MenuItem key={a} value={a}>{a}</MenuItem>
            ))}
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
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Arrears">Arrears</MenuItem>
            <MenuItem value="Suspended">Suspended</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* ---- Main Content: Table + Detail Panel ---- */}
      <Grid container spacing={3}>
        {/* ---- Left: Customer Table ---- */}
        <Grid item xs={12} md={8}>
          <Card sx={darkCard}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Account No</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Customer Name</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Meter No</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Area</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Tariff Group</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }} align="right">Arrears</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      hover
                      selected={selectedId === c.id}
                      onClick={() => setSelectedId(c.id)}
                      sx={{
                        cursor: 'pointer',
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(104, 112, 250, 0.12)',
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: 'rgba(104, 112, 250, 0.18)',
                        },
                      }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {c.accountNo}
                      </TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 500 }}>{c.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {c.meterNo}
                      </TableCell>
                      <TableCell>{c.area}</TableCell>
                      <TableCell>{c.tariffGroup}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            color: c.arrears > 0 ? '#db4f4a' : '#4cceac',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                          }}
                        >
                          {fmtCurrency(c.arrears)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={c.status}
                          size="small"
                          sx={{
                            backgroundColor: statusColor[c.status]?.bg || 'rgba(255,255,255,0.1)',
                            color: statusColor[c.status]?.text || '#fff',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.35)' }}>
                        No customers match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* ---- Right: Customer Detail Panel ---- */}
        <Grid item xs={12} md={4}>
          <Card sx={{ ...darkCard, position: 'sticky', top: 16 }}>
            <CardContent>
              {selected ? (
                <>
                  {/* Name + status */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.3 }}>
                      {selected.name}
                    </Typography>
                    <Chip
                      label={selected.status}
                      size="small"
                      sx={{
                        backgroundColor: statusColor[selected.status]?.bg,
                        color: statusColor[selected.status]?.text,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>

                  {/* Account / Meter */}
                  <DetailRow label="Account No" value={selected.accountNo} mono />
                  <DetailRow label="Meter No" value={selected.meterNo} mono />

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1.5 }} />

                  {/* Contact */}
                  <DetailRow label="Phone" value={selected.phone} icon={<PhoneOutlined sx={{ fontSize: 15 }} />} />
                  <DetailRow label="Email" value={selected.email} icon={<EmailOutlined sx={{ fontSize: 15 }} />} />

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1.5 }} />

                  {/* Location */}
                  <DetailRow label="Area" value={selected.area} icon={<LocationOnOutlined sx={{ fontSize: 15 }} />} />
                  <DetailRow label="Address" value={selected.address} />
                  <DetailRow
                    label="GPS"
                    value={`${selected.gpsLat}, ${selected.gpsLng}`}
                    icon={<GpsFixedOutlined sx={{ fontSize: 15 }} />}
                    mono
                  />

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1.5 }} />

                  {/* Meter info */}
                  <DetailRow label="Tariff Group" value={selected.tariffGroup} icon={<SpeedOutlined sx={{ fontSize: 15 }} />} />
                  <DetailRow label="Meter Make" value={selected.meterMake} />

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1.5 }} />

                  {/* Arrears */}
                  <Box sx={{ textAlign: 'center', my: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                      Outstanding Arrears
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: selected.arrears > 0 ? '#db4f4a' : '#4cceac',
                        mt: 0.5,
                      }}
                    >
                      {fmtCurrency(selected.arrears)}
                    </Typography>
                  </Box>

                  {/* Last purchase */}
                  <DetailRow label="Last Purchase" value={formatDateTime(selected.lastPurchaseDate)} />
                  <DetailRow label="Last Amount" value={fmtCurrency(selected.lastPurchaseAmount)} />

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1.5 }} />

                  {/* Action buttons */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<ConfirmationNumberOutlined />}
                    >
                      Vend Token
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<EditOutlined />}>
                      Edit
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<ReceiptLongOutlined />}>
                      View Transactions
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<SmsOutlined />}>
                      Send SMS
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color={selected.status === 'Suspended' ? 'success' : 'error'}
                      startIcon={selected.status === 'Suspended' ? <CheckCircleOutlined /> : <BlockOutlined />}
                    >
                      {selected.status === 'Suspended' ? 'Activate' : 'Suspend'}
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <PeopleOutlined sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                    Select a customer from the table to view details.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ---- Bottom: Summary Stats ---- */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={darkCard}>
            <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
              <PeopleOutlined sx={{ color: '#6870fa', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block' }}>
                Total Customers
              </Typography>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                {totalCustomers.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={darkCard}>
            <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
              <CheckCircleOutlined sx={{ color: '#4cceac', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block' }}>
                Active
              </Typography>
              <Typography variant="h6" sx={{ color: '#4cceac', fontWeight: 700 }}>
                {activeCount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={darkCard}>
            <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
              <WarningAmberOutlined sx={{ color: '#f2b705', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block' }}>
                In Arrears
              </Typography>
              <Typography variant="h6" sx={{ color: '#f2b705', fontWeight: 700 }}>
                {arrearsCount} ({fmtCurrency(totalArrears)})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={darkCard}>
            <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
              <DoNotDisturbOutlined sx={{ color: '#db4f4a', fontSize: 28, mb: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block' }}>
                Suspended
              </Typography>
              <Typography variant="h6" sx={{ color: '#db4f4a', fontWeight: 700 }}>
                {suspendedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ---- Small helper component for detail rows ----
function DetailRow({ label, value, mono, icon }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {icon && <Box sx={{ color: 'rgba(255,255,255,0.35)', display: 'flex' }}>{icon}</Box>}
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
          {label}
        </Typography>
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: '#fff',
          fontWeight: 500,
          fontSize: '0.8rem',
          ...(mono ? { fontFamily: 'monospace' } : {}),
          textAlign: 'right',
          maxWidth: '60%',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
