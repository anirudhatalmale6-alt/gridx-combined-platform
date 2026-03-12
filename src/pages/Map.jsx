import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider,
} from '@mui/material';
import {
  SearchOutlined,
  MapOutlined,
  OpenInNewOutlined,
  FiberManualRecord,
  LocationOnOutlined,
  SpeedOutlined,
  BoltOutlined,
  ElectricalServicesOutlined,
  GpsFixedOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import { meters, transactions } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Status chip color map ----
const statusColor = {
  Online:    { bg: 'rgba(76, 206, 172, 0.15)',  text: '#4cceac' },
  Offline:   { bg: 'rgba(158, 158, 158, 0.15)', text: '#9e9e9e' },
  Tampered:  { bg: 'rgba(219, 79, 74, 0.15)',  text: '#db4f4a' },
};

// ---- Derive unique areas from meters ----
const allAreas = [...new Set(meters.map((m) => m.area))].sort();

// ---- Area summary data ----
const areaSummary = allAreas.map((area) => {
  const areaMeters = meters.filter((m) => m.area === area);
  const activeCount = areaMeters.filter((m) => m.status === 'Online').length;
  const inactiveCount = areaMeters.length - activeCount;
  return { area, total: areaMeters.length, active: activeCount, inactive: inactiveCount };
});

// ---- Helpers ----
function formatDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-NA', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-NA', { hour: '2-digit', minute: '2-digit' });
}

const fmtCurrency = (n) => `N$ ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ===========================================================================
// Map Page
// ===========================================================================
export default function Map() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDrn, setSelectedDrn] = useState(null);

  // ---- Filtered meters ----
  const filtered = useMemo(() => {
    return meters.filter((m) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          m.meterNo.toLowerCase().includes(q) ||
          m.customerName.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (areaFilter !== 'All' && m.area !== areaFilter) return false;
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      return true;
    });
  }, [search, areaFilter, statusFilter]);

  const selectedMeter = meters.find((m) => m.drn === selectedDrn) || null;

  // ---- Recent transactions for selected meter ----
  const meterTransactions = useMemo(() => {
    if (!selectedMeter) return [];
    return transactions
      .filter((t) => t.meterNo === selectedMeter.meterNo)
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
      .slice(0, 5);
  }, [selectedMeter]);

  return (
    <Box>
      <Header
        title="Map & Locations"
        subtitle="Geographic meter distribution and locations"
      />

      {/* ================================================================= */}
      {/* Area Summary Cards                                                */}
      {/* ================================================================= */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {areaSummary.map((as) => (
          <Grid item xs={6} sm={4} md={2} key={as.area}>
            <Card sx={darkCard}>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block', mb: 0.3 }}
                >
                  {as.area}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}
                >
                  {as.total}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <FiberManualRecord sx={{ fontSize: 8, color: '#4cceac' }} />
                    <Typography variant="caption" sx={{ color: '#4cceac', fontSize: '0.68rem' }}>
                      {as.active}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <FiberManualRecord sx={{ fontSize: 8, color: '#9e9e9e' }} />
                    <Typography variant="caption" sx={{ color: '#9e9e9e', fontSize: '0.68rem' }}>
                      {as.inactive}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ---- Filters Row ---- */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by meter number or customer name..."
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

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Area</InputLabel>
          <Select
            value={areaFilter}
            label="Area"
            onChange={(e) => setAreaFilter(e.target.value)}
          >
            <MenuItem value="All">All Areas</MenuItem>
            {allAreas.map((a) => (
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
            <MenuItem value="Online">Online</MenuItem>
            <MenuItem value="Offline">Offline</MenuItem>
            <MenuItem value="Tampered">Tampered</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* ================================================================= */}
      {/* Main Content: Table + Detail Panel                                */}
      {/* ================================================================= */}
      <Grid container spacing={3}>
        {/* ---- Left: Meter Locations Table ---- */}
        <Grid item xs={12} md={selectedMeter ? 8 : 12}>
          <Card sx={darkCard}>
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {[
                      'Meter No',
                      'Customer Name',
                      'Area',
                      'Suburb',
                      'Status',
                      'Voltage (V)',
                      'Power (kW)',
                      'GPS Coordinates',
                      '',
                      '',
                    ].map((col, idx) => (
                      <TableCell
                        key={idx}
                        sx={{
                          bgcolor: '#1a2540',
                          color: 'rgba(255,255,255,0.5)',
                          fontWeight: 600,
                          fontSize: '0.72rem',
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
                  {filtered.map((m) => {
                    const sc = statusColor[m.status] || statusColor.Online;
                    return (
                      <TableRow
                        key={m.drn}
                        hover
                        selected={selectedDrn === m.drn}
                        onClick={() => setSelectedDrn(m.drn)}
                        sx={{
                          cursor: 'pointer',
                          '&.Mui-selected': { backgroundColor: 'rgba(104, 112, 250, 0.12)' },
                          '&.Mui-selected:hover': { backgroundColor: 'rgba(104, 112, 250, 0.18)' },
                          '&:hover': { bgcolor: 'rgba(0,180,216,0.06)' },
                          '& td': {
                            borderBottom: '1px solid rgba(30,58,95,0.3)',
                            color: 'rgba(255,255,255,0.85)',
                            fontSize: '0.78rem',
                            py: 1,
                          },
                        }}
                      >
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem !important' }}>
                          {m.meterNo}
                        </TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 500 }}>{m.customerName}</TableCell>
                        <TableCell>{m.area}</TableCell>
                        <TableCell>{m.suburb}</TableCell>
                        <TableCell>
                          <Chip
                            label={m.status}
                            size="small"
                            sx={{
                              bgcolor: sc.bg,
                              color: sc.text,
                              fontWeight: 600,
                              fontSize: '0.68rem',
                              height: 22,
                            }}
                          />
                        </TableCell>
                        <TableCell>{m.power.voltage.toFixed(1)}</TableCell>
                        <TableCell>{m.power.activePower.toFixed(2)}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem !important' }}>
                          {m.lat.toFixed(4)}, {m.lng.toFixed(4)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            component="a"
                            href={`https://www.google.com/maps?q=${m.lat},${m.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            sx={{ color: '#00b4d8' }}
                          >
                            <OpenInNewOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/meter/${m.drn}`);
                            }}
                            sx={{ color: '#6870fa' }}
                          >
                            <VisibilityOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'rgba(255,255,255,0.35)' }}>
                        No meters match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* ---- Right: Detail Panel ---- */}
        {selectedMeter && (
          <Grid item xs={12} md={4}>
            <Card sx={{ ...darkCard, position: 'sticky', top: 16 }}>
              <CardContent>
                {/* ---- Meter Number + Customer ---- */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'monospace' }}
                    >
                      {selectedMeter.meterNo}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', mt: 0.2 }}
                    >
                      {selectedMeter.customerName}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedMeter.status}
                    size="small"
                    sx={{
                      bgcolor: (statusColor[selectedMeter.status] || statusColor.Online).bg,
                      color: (statusColor[selectedMeter.status] || statusColor.Online).text,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1.5 }} />

                {/* ---- Location Details ---- */}
                <DetailRow
                  label="Area"
                  value={selectedMeter.area}
                  icon={<LocationOnOutlined sx={{ fontSize: 15 }} />}
                />
                <DetailRow label="Suburb" value={selectedMeter.suburb} />
                <DetailRow label="Transformer" value={selectedMeter.transformer} />

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1.5 }} />

                {/* ---- Key Readings ---- */}
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', display: 'block', mb: 1 }}
                >
                  Key Readings
                </Typography>
                <DetailRow
                  label="Voltage"
                  value={`${selectedMeter.power.voltage.toFixed(1)} V`}
                  icon={<BoltOutlined sx={{ fontSize: 15, color: '#f2b705' }} />}
                />
                <DetailRow
                  label="Current"
                  value={`${selectedMeter.power.current.toFixed(1)} A`}
                  icon={<ElectricalServicesOutlined sx={{ fontSize: 15, color: '#00b4d8' }} />}
                />
                <DetailRow
                  label="Power Factor"
                  value={selectedMeter.power.powerFactor.toFixed(3)}
                  icon={<SpeedOutlined sx={{ fontSize: 15, color: '#6870fa' }} />}
                />

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1.5 }} />

                {/* ---- GPS Coordinates ---- */}
                <DetailRow
                  label="GPS Coordinates"
                  value={`${selectedMeter.lat.toFixed(4)}, ${selectedMeter.lng.toFixed(4)}`}
                  icon={<GpsFixedOutlined sx={{ fontSize: 15 }} />}
                  mono
                />
                <Box sx={{ mb: 1.5 }}>
                  <Button
                    variant="text"
                    size="small"
                    component="a"
                    href={`https://www.google.com/maps?q=${selectedMeter.lat},${selectedMeter.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<MapOutlined sx={{ fontSize: 16 }} />}
                    sx={{ fontSize: '0.72rem', textTransform: 'none', color: '#00b4d8' }}
                  >
                    Open in Google Maps
                  </Button>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1.5 }} />

                {/* ---- Recent Transactions ---- */}
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', display: 'block', mb: 1 }}
                >
                  Recent Transactions
                </Typography>
                {meterTransactions.length > 0 ? (
                  meterTransactions.map((txn) => (
                    <Box
                      key={txn.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 0.8,
                        px: 1,
                        mb: 0.5,
                        bgcolor: 'rgba(10, 22, 40, 0.6)',
                        borderRadius: 1,
                        border: '1px solid rgba(30,58,95,0.3)',
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block' }}
                        >
                          {formatDateTime(txn.dateTime)}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: '#fff', fontSize: '0.78rem', fontWeight: 500 }}
                        >
                          {fmtCurrency(txn.amount)}
                        </Typography>
                      </Box>
                      <Chip
                        label={txn.status}
                        size="small"
                        sx={{
                          bgcolor: txn.status === 'Completed'
                            ? 'rgba(76,206,172,0.15)'
                            : txn.status === 'Failed'
                              ? 'rgba(219,79,74,0.15)'
                              : 'rgba(242,183,5,0.15)',
                          color: txn.status === 'Completed'
                            ? '#4cceac'
                            : txn.status === 'Failed'
                              ? '#db4f4a'
                              : '#f2b705',
                          fontWeight: 600,
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                    </Box>
                  ))
                ) : (
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}
                  >
                    No recent transactions found.
                  </Typography>
                )}

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1.5 }} />

                {/* ---- View Full Profile Button ---- */}
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<VisibilityOutlined />}
                  onClick={() => navigate(`/meter/${selectedMeter.drn}`)}
                  sx={{ textTransform: 'none' }}
                >
                  View Full Profile
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
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
