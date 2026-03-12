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
  Divider,
} from '@mui/material';
import { SaveOutlined } from '@mui/icons-material';
import Header from '../components/Header';
import { tariffGroups, tariffConfig } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Block tier colors ----
const blockColors = ['#4cceac', '#00b4d8', '#f2b705', '#db4f4a'];

// ---- Tariff change log entries ----
const changeLog = [
  {
    date: '2025-07-01',
    description: 'Annual tariff increase applied - Residential Block 4 raised from N$ 2.60 to N$ 2.85/kWh',
    user: 'Admin: Petrus Shikomba',
  },
  {
    date: '2025-07-01',
    description: 'Commercial flat rate adjusted from N$ 2.30 to N$ 2.45/kWh',
    user: 'Admin: Petrus Shikomba',
  },
  {
    date: '2025-04-15',
    description: 'REL Levy updated from N$ 2.20 to N$ 2.40 per transaction (ECB directive)',
    user: 'Admin: Maria Nghidengwa',
  },
  {
    date: '2025-01-10',
    description: 'Arrears auto-deduct threshold increased from N$ 300 to N$ 500',
    user: 'Admin: Petrus Shikomba',
  },
];

export default function Tariffs() {
  const [config, setConfig] = useState({
    vatRate: tariffConfig.vatRate,
    fixedCharge: tariffConfig.fixedCharge,
    relLevy: tariffConfig.relLevy,
    minPurchase: tariffConfig.minPurchase,
    arrearsMode: tariffConfig.arrearsMode,
    arrearsThreshold: tariffConfig.arrearsThreshold,
    arrearsPercentage: tariffConfig.arrearsPercentage,
  });

  const handleChange = (field) => (e) => {
    setConfig((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Box>
      <Header
        title="Tariff Management"
        subtitle="Configure tariff groups, rate blocks, and system billing parameters"
      />

      <Grid container spacing={3}>
        {/* ---- Left Column: Tariff Groups ---- */}
        <Grid item xs={12} md={7}>
          {tariffGroups.map((group) => (
            <Card key={group.id} sx={{ ...darkCard, mb: 3 }}>
              <CardContent>
                {/* Group header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem' }}>
                      {group.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.3 }}>
                      {group.description}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ color: '#00b4d8', fontWeight: 600 }}>
                      SGC: {group.sgc}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {group.customerCount.toLocaleString()} meters
                    </Typography>
                  </Box>
                </Box>

                {/* Tariff type badge */}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'inline-block',
                    px: 1.5,
                    py: 0.3,
                    borderRadius: 1,
                    background: 'rgba(104, 112, 250, 0.15)',
                    color: '#6870fa',
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  {group.type === 'Block' ? 'Step Tariff Blocks' : group.type === 'Flat' ? 'Flat Rate Tariff' : 'Time-of-Use Tariff'}
                </Typography>

                {/* Rate blocks */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {group.blocks.map((block, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Colored left border strip */}
                      <Box
                        sx={{
                          width: 5,
                          alignSelf: 'stretch',
                          backgroundColor: blockColors[idx % blockColors.length],
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ py: 1.2, px: 1, flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                            {block.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                            {block.range}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: blockColors[idx % blockColors.length],
                            fontWeight: 700,
                            fontSize: '0.95rem',
                          }}
                        >
                          N$ {block.rate.toFixed(2)}/kWh
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Effective date */}
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', mt: 2 }}>
                  Effective from: {new Date(group.effectiveDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Grid>

        {/* ---- Right Column: System Configuration ---- */}
        <Grid item xs={12} md={5}>
          {/* Config card */}
          <Card sx={{ ...darkCard, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', mb: 2.5 }}>
                System Configuration
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="VAT Rate (%)"
                  type="number"
                  size="small"
                  fullWidth
                  value={config.vatRate}
                  onChange={handleChange('vatRate')}
                  InputProps={{ sx: { color: '#fff' } }}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    },
                  }}
                />

                <TextField
                  label="Fixed Monthly Charge (N$)"
                  type="number"
                  size="small"
                  fullWidth
                  value={config.fixedCharge}
                  onChange={handleChange('fixedCharge')}
                  InputProps={{ sx: { color: '#fff' } }}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    },
                  }}
                />

                <TextField
                  label="REL Levy (N$ / transaction)"
                  type="number"
                  size="small"
                  fullWidth
                  value={config.relLevy}
                  onChange={handleChange('relLevy')}
                  InputProps={{ sx: { color: '#fff' } }}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    },
                  }}
                />

                <TextField
                  label="Min Purchase Amount (N$)"
                  type="number"
                  size="small"
                  fullWidth
                  value={config.minPurchase}
                  onChange={handleChange('minPurchase')}
                  InputProps={{ sx: { color: '#fff' } }}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    },
                  }}
                />

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
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Arrears Collection</InputLabel>
                  <Select
                    value={config.arrearsMode}
                    label="Arrears Collection"
                    onChange={handleChange('arrearsMode')}
                    sx={{ color: '#fff' }}
                  >
                    <MenuItem value="auto-deduct">Auto-Deduct</MenuItem>
                    <MenuItem value="manual">Manual</MenuItem>
                    <MenuItem value="disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Arrears Threshold (N$)"
                  type="number"
                  size="small"
                  fullWidth
                  value={config.arrearsThreshold}
                  onChange={handleChange('arrearsThreshold')}
                  InputProps={{ sx: { color: '#fff' } }}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    },
                  }}
                />

                <TextField
                  label="Arrears Deduction (%)"
                  type="number"
                  size="small"
                  fullWidth
                  value={config.arrearsPercentage}
                  onChange={handleChange('arrearsPercentage')}
                  InputProps={{ sx: { color: '#fff' } }}
                  InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    },
                  }}
                />

                <Button
                  variant="contained"
                  startIcon={<SaveOutlined />}
                  sx={{
                    mt: 1,
                    background: '#00b4d8',
                    '&:hover': { background: '#0096b7' },
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  Save Configuration
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Tariff Change Log */}
          <Card sx={darkCard}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                Tariff Change Log
              </Typography>

              {changeLog.map((entry, idx) => (
                <Box key={idx}>
                  <Box sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#00b4d8', fontWeight: 600 }}>
                        {new Date(entry.date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                        {entry.user}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
                      {entry.description}
                    </Typography>
                  </Box>
                  {idx < changeLog.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
