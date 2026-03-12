import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  SpeedOutlined,
  WifiOutlined,
  WifiOffOutlined,
  WarningAmberOutlined,
  VisibilityOutlined,
  PlaceOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import StatBox from '../components/StatBox';
import { meters } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Helpers ----
const fmt = (n) => Number(n).toLocaleString();

function formatDateTime(isoStr) {
  if (!isoStr) return '---';
  const d = new Date(isoStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---- Status color map ----
const statusConfig = {
  Online: { bg: 'rgba(76, 206, 172, 0.15)', text: '#4cceac' },
  Offline: { bg: 'rgba(108, 117, 125, 0.2)', text: '#6c757d' },
  Tampered: { bg: 'rgba(219, 79, 74, 0.15)', text: '#db4f4a' },
};

// ===========================================================================
// MeterSummary Page
// ===========================================================================
export default function MeterSummary() {
  const navigate = useNavigate();

  // ---- Counts ----
  const totalMeters = meters.length;
  const onlineCount = meters.filter((m) => m.status === 'Online').length;
  const offlineCount = meters.filter((m) => m.status === 'Offline').length;
  const tamperedCount = meters.filter((m) => m.status === 'Tampered').length;

  // ---- Area distribution ----
  const areaDistribution = useMemo(() => {
    const map = {};
    meters.forEach((m) => {
      map[m.area] = (map[m.area] || 0) + 1;
    });
    return Object.entries(map)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  // ---- DataGrid columns ----
  const columns = [
    {
      field: 'drn',
      headerName: 'DRN',
      width: 140,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#00e5ff' }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'meterNo',
      headerName: 'Meter No',
      width: 130,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'area',
      headerName: 'Area',
      width: 130,
    },
    {
      field: 'suburb',
      headerName: 'Suburb',
      width: 120,
    },
    {
      field: 'transformer',
      headerName: 'Transformer',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => {
        const sc = statusConfig[params.value] || statusConfig.Online;
        return (
          <Chip
            label={params.value}
            size="small"
            sx={{
              bgcolor: sc.bg,
              color: sc.text,
              fontWeight: 600,
              fontSize: '0.72rem',
              height: 24,
            }}
          />
        );
      },
    },
    {
      field: 'voltage',
      headerName: 'Voltage',
      width: 90,
      valueGetter: (params) => params.row.power?.voltage,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>
          {params.value} <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>V</span>
        </Typography>
      ),
    },
    {
      field: 'current',
      headerName: 'Current',
      width: 90,
      valueGetter: (params) => params.row.power?.current,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>
          {params.value} <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>A</span>
        </Typography>
      ),
    },
    {
      field: 'powerFactor',
      headerName: 'PF',
      width: 80,
      valueGetter: (params) => params.row.power?.powerFactor,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#4cceac' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'lastUpdate',
      headerName: 'Last Update',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
          {formatDateTime(params.value)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityOutlined />}
          onClick={() => navigate(`/meter/${params.row.drn}`)}
          sx={{ fontSize: '0.72rem', textTransform: 'none' }}
        >
          View Profile
        </Button>
      ),
    },
  ];

  // ---- Rows with id ----
  const rows = meters.map((m) => ({ ...m, id: m.drn }));

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <Header
        title="Meter Summary"
        subtitle="Overview of all registered smart meters in the system"
      />

      {/* ================================================================= */}
      {/* Summary Stat Cards                                                 */}
      {/* ================================================================= */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatBox
            title="Total Meters"
            value={fmt(totalMeters)}
            icon={<SpeedOutlined />}
            color="#00b4d8"
            subtitle="all registered"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatBox
            title="Online"
            value={fmt(onlineCount)}
            icon={<WifiOutlined />}
            color="#4cceac"
            change={((onlineCount / totalMeters) * 100).toFixed(1)}
            changeType="increase"
            subtitle="of total"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatBox
            title="Offline"
            value={fmt(offlineCount)}
            icon={<WifiOffOutlined />}
            color="#6c757d"
            subtitle="not communicating"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatBox
            title="Tampered"
            value={fmt(tamperedCount)}
            icon={<WarningAmberOutlined />}
            color="#db4f4a"
            subtitle="requires attention"
          />
        </Grid>
      </Grid>

      {/* ================================================================= */}
      {/* DataGrid Table                                                     */}
      {/* ================================================================= */}
      <Card sx={{ ...darkCard, mb: 3 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ height: 520, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 300 },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-toolbarContainer': {
                  p: 2,
                  gap: 1,
                  borderBottom: '1px solid rgba(30,58,95,0.4)',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* Area Distribution Cards                                            */}
      {/* ================================================================= */}
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
        Meters by Area
      </Typography>
      <Grid container spacing={2}>
        {areaDistribution.map((item) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={item.area}>
            <Card sx={darkCard}>
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 2,
                  '&:last-child': { pb: 2 },
                }}
              >
                <PlaceOutlined sx={{ fontSize: 28, color: '#00b4d8', mb: 0.5 }} />
                <Typography
                  variant="h5"
                  sx={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', mb: 0.3 }}
                >
                  {item.count}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.72rem',
                    display: 'block',
                  }}
                >
                  {item.area}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
