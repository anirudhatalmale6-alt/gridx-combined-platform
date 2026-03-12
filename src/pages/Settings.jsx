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
  Switch,
  FormControlLabel,
  Button,
} from '@mui/material';
import {
  SaveOutlined,
  FiberManualRecord,
  BackupOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Section title ----
function SectionTitle({ children }) {
  return (
    <Typography
      variant="h6"
      sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem', mb: 2 }}
    >
      {children}
    </Typography>
  );
}

// ---- Shared field row styling ----
function FieldRow({ label, children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', display: 'block', mb: 0.5 }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

// ===========================================================================
// Settings Page
// ===========================================================================
export default function Settings() {
  // ---- STS Gateway ----
  const [gatewayHost, setGatewayHost] = useState('sts-gateway.gridx-meters.com');
  const [encryption, setEncryption] = useState('STS Standard');
  const [apiPort, setApiPort] = useState('8583');

  // ---- Database & Backup ----
  const [backupSchedule, setBackupSchedule] = useState('Daily');
  const [backupTime, setBackupTime] = useState('02:00');
  const [dataRetention, setDataRetention] = useState('3 Years');

  // ---- Session & Security ----
  const [sessionTimeout, setSessionTimeout] = useState('1hr');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [passwordExpiry, setPasswordExpiry] = useState('90 days');
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);

  // ---- Notifications ----
  const [smsGateway, setSmsGateway] = useState("Africa's Talking");
  const [smsApiKey, setSmsApiKey] = useState('');
  const [emailSmtp, setEmailSmtp] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);

  // ---- Meter Update Cycles ----
  const [powerUpdateInterval, setPowerUpdateInterval] = useState('5min');
  const [energyUpdateInterval, setEnergyUpdateInterval] = useState('15min');
  const [networkUpdateInterval, setNetworkUpdateInterval] = useState('1hr');
  const [loadStatusUpdate, setLoadStatusUpdate] = useState('Real-time');

  return (
    <Box>
      <Header
        title="System Settings"
        subtitle="Configure platform parameters and integrations"
      />

      <Grid container spacing={2.5}>
        {/* ================================================================= */}
        {/* Card 1: STS Gateway Configuration                                */}
        {/* ================================================================= */}
        <Grid item xs={12} md={6}>
          <Card sx={darkCard}>
            <CardContent>
              <SectionTitle>STS Gateway Configuration</SectionTitle>

              <FieldRow label="Gateway Host">
                <TextField
                  size="small"
                  fullWidth
                  value={gatewayHost}
                  onChange={(e) => setGatewayHost(e.target.value)}
                />
              </FieldRow>

              <FieldRow label="Encryption Standard">
                <FormControl size="small" fullWidth>
                  <Select
                    value={encryption}
                    onChange={(e) => setEncryption(e.target.value)}
                  >
                    <MenuItem value="STS Standard">STS Standard</MenuItem>
                    <MenuItem value="AES-256">AES-256</MenuItem>
                    <MenuItem value="Triple DES">Triple DES</MenuItem>
                  </Select>
                </FormControl>
              </FieldRow>

              <FieldRow label="API Port (ISO 8583)">
                <TextField
                  size="small"
                  fullWidth
                  value={apiPort}
                  onChange={(e) => setApiPort(e.target.value)}
                />
              </FieldRow>

              <FieldRow label="Connection Status">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <FiberManualRecord sx={{ fontSize: 10, color: '#4cceac' }} />
                  <Typography variant="body2" sx={{ color: '#4cceac', fontWeight: 600, fontSize: '0.82rem' }}>
                    Connected
                  </Typography>
                </Box>
              </FieldRow>

              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Button variant="contained" color="primary" size="small" startIcon={<SaveOutlined />}>
                  Save
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ================================================================= */}
        {/* Card 2: Database & Backup                                        */}
        {/* ================================================================= */}
        <Grid item xs={12} md={6}>
          <Card sx={darkCard}>
            <CardContent>
              <SectionTitle>Database &amp; Backup</SectionTitle>

              <FieldRow label="Auto-backup Schedule">
                <FormControl size="small" fullWidth>
                  <Select
                    value={backupSchedule}
                    onChange={(e) => setBackupSchedule(e.target.value)}
                  >
                    <MenuItem value="Daily">Daily</MenuItem>
                    <MenuItem value="Weekly">Weekly</MenuItem>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </FieldRow>

              <FieldRow label="Backup Time">
                <TextField
                  size="small"
                  fullWidth
                  type="time"
                  value={backupTime}
                  onChange={(e) => setBackupTime(e.target.value)}
                />
              </FieldRow>

              <FieldRow label="Data Retention Period">
                <FormControl size="small" fullWidth>
                  <Select
                    value={dataRetention}
                    onChange={(e) => setDataRetention(e.target.value)}
                  >
                    <MenuItem value="1 Year">1 Year</MenuItem>
                    <MenuItem value="3 Years">3 Years</MenuItem>
                    <MenuItem value="5 Years">5 Years</MenuItem>
                    <MenuItem value="7 Years">7 Years</MenuItem>
                  </Select>
                </FormControl>
              </FieldRow>

              <FieldRow label="Last Backup">
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
                  12 Mar 2026, 02:00 AM
                </Typography>
              </FieldRow>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<BackupOutlined />}
                  sx={{ textTransform: 'none' }}
                >
                  Run Backup Now
                </Button>
                <Button variant="contained" color="primary" size="small" startIcon={<SaveOutlined />}>
                  Save
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ================================================================= */}
        {/* Card 3: Session & Security                                       */}
        {/* ================================================================= */}
        <Grid item xs={12} md={6}>
          <Card sx={darkCard}>
            <CardContent>
              <SectionTitle>Session &amp; Security</SectionTitle>

              <FieldRow label="Session Timeout">
                <FormControl size="small" fullWidth>
                  <Select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                  >
                    <MenuItem value="30min">30 minutes</MenuItem>
                    <MenuItem value="1hr">1 hour</MenuItem>
                    <MenuItem value="2hr">2 hours</MenuItem>
                    <MenuItem value="4hr">4 hours</MenuItem>
                  </Select>
                </FormControl>
              </FieldRow>

              <FieldRow label="Max Login Attempts">
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(e.target.value)}
                  inputProps={{ min: 1, max: 20 }}
                />
              </FieldRow>

              <FieldRow label="Password Expiry">
                <FormControl size="small" fullWidth>
                  <Select
                    value={passwordExpiry}
                    onChange={(e) => setPasswordExpiry(e.target.value)}
                  >
                    <MenuItem value="30 days">30 days</MenuItem>
                    <MenuItem value="60 days">60 days</MenuItem>
                    <MenuItem value="90 days">90 days</MenuItem>
                    <MenuItem value="Never">Never</MenuItem>
                  </Select>
                </FormControl>
              </FieldRow>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={twoFactorAuth}
                      onChange={(e) => setTwoFactorAuth(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
                      Two-Factor Authentication
                    </Typography>
                  }
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: twoFactorAuth ? '#4cceac' : '#db4f4a',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                  }}
                >
                  {twoFactorAuth ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Button variant="contained" color="primary" size="small" startIcon={<SaveOutlined />}>
                  Save
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ================================================================= */}
        {/* Card 4: Notifications                                            */}
        {/* ================================================================= */}
        <Grid item xs={12} md={6}>
          <Card sx={darkCard}>
            <CardContent>
              <SectionTitle>Notifications</SectionTitle>

              <FieldRow label="SMS Gateway">
                <TextField
                  size="small"
                  fullWidth
                  value={smsGateway}
                  onChange={(e) => setSmsGateway(e.target.value)}
                />
              </FieldRow>

              <FieldRow label="SMS API Key">
                <TextField
                  size="small"
                  fullWidth
                  type="password"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  placeholder="Enter API key..."
                />
              </FieldRow>

              <FieldRow label="Email SMTP">
                <TextField
                  size="small"
                  fullWidth
                  value={emailSmtp}
                  onChange={(e) => setEmailSmtp(e.target.value)}
                  placeholder="smtp.example.com"
                />
              </FieldRow>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
                      Email Notifications
                    </Typography>
                  }
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: emailNotifications ? '#4cceac' : '#db4f4a',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                  }}
                >
                  {emailNotifications ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={smsNotifications}
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
                      SMS Notifications
                    </Typography>
                  }
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: smsNotifications ? '#4cceac' : '#db4f4a',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                  }}
                >
                  {smsNotifications ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Button variant="contained" color="primary" size="small" startIcon={<SaveOutlined />}>
                  Save
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ================================================================= */}
        {/* Card 5: Meter Update Cycles                                      */}
        {/* ================================================================= */}
        <Grid item xs={12} md={6}>
          <Card sx={darkCard}>
            <CardContent>
              <SectionTitle>Meter Update Cycles</SectionTitle>

              <FieldRow label="Power Update Interval">
                <FormControl size="small" fullWidth>
                  <Select
                    value={powerUpdateInterval}
                    onChange={(e) => setPowerUpdateInterval(e.target.value)}
                  >
                    <MenuItem value="1min">1 minute</MenuItem>
                    <MenuItem value="5min">5 minutes</MenuItem>
                    <MenuItem value="15min">15 minutes</MenuItem>
                    <MenuItem value="30min">30 minutes</MenuItem>
                    <MenuItem value="1hr">1 hour</MenuItem>
                  </Select>
                </FormControl>
              </FieldRow>

              <FieldRow label="Energy Update Interval">
                <FormControl size="small" fullWidth>
                  <Select
                    value={energyUpdateInterval}
                    onChange={(e) => setEnergyUpdateInterval(e.target.value)}
                  >
                    <MenuItem value="15min">15 minutes</MenuItem>
                    <MenuItem value="30min">30 minutes</MenuItem>
                    <MenuItem value="1hr">1 hour</MenuItem>
                    <MenuItem value="6hr">6 hours</MenuItem>
                  </Select>
                </FormControl>
              </FieldRow>

              <FieldRow label="Network Update Interval">
                <FormControl size="small" fullWidth>
                  <Select
                    value={networkUpdateInterval}
                    onChange={(e) => setNetworkUpdateInterval(e.target.value)}
                  >
                    <MenuItem value="1hr">1 hour</MenuItem>
                    <MenuItem value="6hr">6 hours</MenuItem>
                    <MenuItem value="12hr">12 hours</MenuItem>
                    <MenuItem value="24hr">24 hours</MenuItem>
                  </Select>
                </FormControl>
              </FieldRow>

              <FieldRow label="Load Status Update">
                <FormControl size="small" fullWidth>
                  <Select
                    value={loadStatusUpdate}
                    onChange={(e) => setLoadStatusUpdate(e.target.value)}
                  >
                    <MenuItem value="Real-time">Real-time</MenuItem>
                    <MenuItem value="1min">1 minute</MenuItem>
                    <MenuItem value="5min">5 minutes</MenuItem>
                  </Select>
                </FormControl>
              </FieldRow>

              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Button variant="contained" color="primary" size="small" startIcon={<SaveOutlined />}>
                  Save
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
