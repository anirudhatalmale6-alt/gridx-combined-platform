import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  BuildOutlined,
  CardGiftcardOutlined,
  VpnKeyOutlined,
  RestoreOutlined,
  ContentCopyOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import { transactions } from '../services/mockData';

// ---- Helpers ----------------------------------------------------------------

const cardSx = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
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

function generateToken() {
  let t = '';
  for (let i = 0; i < 20; i++) t += Math.floor(Math.random() * 10);
  return t;
}

function formatToken(t) {
  return t.replace(/(.{4})/g, '$1 ').trim();
}

// ---- Token Display ----------------------------------------------------------

function TokenDisplay({ token, onCopy, copied }) {
  if (!token) return null;
  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 1,
        background: 'rgba(0,188,212,0.06)',
        border: '1px solid rgba(0,188,212,0.25)',
        textAlign: 'center',
      }}
    >
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.5 }}>
        Generated Token
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Typography
          variant="h6"
          sx={{ fontFamily: '"Courier New", monospace', fontWeight: 700, color: '#00bcd4', letterSpacing: 2 }}
        >
          {formatToken(token)}
        </Typography>
        <Tooltip title={copied ? 'Copied!' : 'Copy token'}>
          <IconButton
            size="small"
            onClick={onCopy}
            sx={{ color: copied ? '#4caf50' : 'rgba(255,255,255,0.4)' }}
          >
            <ContentCopyOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ---- Main Component ---------------------------------------------------------

export default function Engineering() {
  // Card 1: Engineering Token
  const [engMeter, setEngMeter] = useState('');
  const [engTokenType, setEngTokenType] = useState('');
  const [engParams, setEngParams] = useState('');
  const [engToken, setEngToken] = useState(null);
  const [engCopied, setEngCopied] = useState(false);

  // Card 2: Free Units Token
  const [freeMeter, setFreeMeter] = useState('');
  const [freeKwh, setFreeKwh] = useState('');
  const [freeReason, setFreeReason] = useState('');
  const [freeToken, setFreeToken] = useState(null);
  const [freeCopied, setFreeCopied] = useState(false);

  // Card 3: Key Change Token
  const [keyMeter, setKeyMeter] = useState('');
  const [keyNewRevision, setKeyNewRevision] = useState('');
  const [keyToken, setKeyToken] = useState(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Card 4: Replacement Token
  const [replRef, setReplRef] = useState('');
  const [replOriginal, setReplOriginal] = useState(null);
  const [replToken, setReplToken] = useState(null);
  const [replCopied, setReplCopied] = useState(false);

  const handleCopy = (token, setCopied) => {
    navigator.clipboard.writeText(formatToken(token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplSearch = () => {
    const found = transactions.find(
      (t) => t.refNo.toLowerCase() === replRef.trim().toLowerCase()
    );
    setReplOriginal(found || null);
  };

  const engineeringTokenTypes = [
    'Set Power Limit',
    'Clear Tamper',
    'Test Display',
    'Clear Credit',
    'Set Tariff Rate',
  ];

  return (
    <Box>
      <Header
        title="Engineering Tokens"
        subtitle="Generate specialized STS tokens for meter management"
      />

      <Grid container spacing={3}>
        {/* ---- Card 1: Engineering Token ---- */}
        <Grid item xs={12} md={6}>
          <Card sx={cardSx}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,188,212,0.15)',
                  }}
                >
                  <BuildOutlined sx={{ color: '#00bcd4' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                    Engineering Token
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    Generate tokens for meter configuration and diagnostics
                  </Typography>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Meter Number"
                value={engMeter}
                onChange={(e) => setEngMeter(e.target.value)}
                sx={{ ...textFieldSx, mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.45)', '&.Mui-focused': { color: '#00bcd4' } }}>
                  Token Type
                </InputLabel>
                <Select
                  value={engTokenType}
                  label="Token Type"
                  onChange={(e) => setEngTokenType(e.target.value)}
                  sx={selectSx}
                  MenuProps={{ PaperProps: { sx: { backgroundColor: '#1a2d47', color: '#fff' } } }}
                >
                  {engineeringTokenTypes.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Optional Parameters (JSON)"
                value={engParams}
                onChange={(e) => setEngParams(e.target.value)}
                multiline
                rows={2}
                sx={{ ...textFieldSx, mb: 2 }}
              />

              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!engMeter || !engTokenType}
                  onClick={() => { setEngToken(generateToken()); }}
                  sx={{
                    py: 1.2,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #00bcd4, #0097a7)',
                    color: '#0a1628',
                    '&:hover': { background: 'linear-gradient(135deg, #00acc1, #00838f)' },
                    '&.Mui-disabled': { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  Generate Engineering Token
                </Button>

                <TokenDisplay
                  token={engToken}
                  onCopy={() => handleCopy(engToken, setEngCopied)}
                  copied={engCopied}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ---- Card 2: Free Units Token ---- */}
        <Grid item xs={12} md={6}>
          <Card sx={cardSx}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(76,175,80,0.15)',
                  }}
                >
                  <CardGiftcardOutlined sx={{ color: '#4caf50' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                    Free Units Token
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    Issue complimentary electricity units to a meter
                  </Typography>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Meter Number"
                value={freeMeter}
                onChange={(e) => setFreeMeter(e.target.value)}
                sx={{ ...textFieldSx, mb: 2 }}
              />

              <TextField
                fullWidth
                label="kWh Amount"
                type="number"
                value={freeKwh}
                onChange={(e) => setFreeKwh(e.target.value)}
                sx={{ ...textFieldSx, mb: 2 }}
              />

              <TextField
                fullWidth
                label="Reason"
                value={freeReason}
                onChange={(e) => setFreeReason(e.target.value)}
                sx={{ ...textFieldSx, mb: 2 }}
              />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  Authorized By
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                  Admin User (System Administrator)
                </Typography>
              </Box>

              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!freeMeter || !freeKwh || !freeReason}
                  onClick={() => { setFreeToken(generateToken()); }}
                  sx={{
                    py: 1.2,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                    color: '#fff',
                    '&:hover': { background: 'linear-gradient(135deg, #43a047, #2e7d32)' },
                    '&.Mui-disabled': { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  Generate Free Units Token
                </Button>

                <TokenDisplay
                  token={freeToken}
                  onCopy={() => handleCopy(freeToken, setFreeCopied)}
                  copied={freeCopied}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ---- Card 3: Key Change Token ---- */}
        <Grid item xs={12} md={6}>
          <Card sx={cardSx}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255,193,7,0.15)',
                  }}
                >
                  <VpnKeyOutlined sx={{ color: '#ffc107' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                    Key Change Token
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    Change the Supply Group Code encryption key on a meter
                  </Typography>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Meter Number"
                value={keyMeter}
                onChange={(e) => setKeyMeter(e.target.value)}
                sx={{ ...textFieldSx, mb: 2 }}
              />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  Current Key Revision
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#ffc107', fontWeight: 600, fontFamily: 'monospace' }}
                >
                  KRN: 1
                </Typography>
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.45)', '&.Mui-focused': { color: '#ffc107' } }}>
                  New Key Revision
                </InputLabel>
                <Select
                  value={keyNewRevision}
                  label="New Key Revision"
                  onChange={(e) => setKeyNewRevision(e.target.value)}
                  sx={{
                    ...selectSx,
                    '&.Mui-focused fieldset': { borderColor: '#ffc107' },
                  }}
                  MenuProps={{ PaperProps: { sx: { backgroundColor: '#1a2d47', color: '#fff' } } }}
                >
                  <MenuItem value={2}>KRN: 2</MenuItem>
                  <MenuItem value={3}>KRN: 3</MenuItem>
                  <MenuItem value={4}>KRN: 4</MenuItem>
                </Select>
              </FormControl>

              <Alert
                severity="warning"
                sx={{
                  mb: 2,
                  backgroundColor: 'rgba(255,152,0,0.1)',
                  color: '#ff9800',
                  border: '1px solid rgba(255,152,0,0.3)',
                  '& .MuiAlert-icon': { color: '#ff9800' },
                }}
              >
                Key change tokens are irreversible. Ensure the correct meter number and key revision before generating.
              </Alert>

              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!keyMeter || !keyNewRevision}
                  onClick={() => { setKeyToken(generateToken()); }}
                  sx={{
                    py: 1.2,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #ffc107, #ffa000)',
                    color: '#0a1628',
                    '&:hover': { background: 'linear-gradient(135deg, #ffb300, #ff8f00)' },
                    '&.Mui-disabled': { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  Generate Key Change Token
                </Button>

                <TokenDisplay
                  token={keyToken}
                  onCopy={() => handleCopy(keyToken, setKeyCopied)}
                  copied={keyCopied}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ---- Card 4: Replacement Token ---- */}
        <Grid item xs={12} md={6}>
          <Card sx={cardSx}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(33,150,243,0.15)',
                  }}
                >
                  <RestoreOutlined sx={{ color: '#2196f3' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                    Replacement Token
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    Re-issue a token for a previous transaction
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Original Transaction Reference"
                  placeholder="e.g. TXN-100001"
                  value={replRef}
                  onChange={(e) => { setReplRef(e.target.value); setReplOriginal(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleReplSearch()}
                  sx={textFieldSx}
                />
                <Button
                  variant="outlined"
                  onClick={handleReplSearch}
                  sx={{
                    minWidth: 48,
                    color: '#2196f3',
                    borderColor: 'rgba(33,150,243,0.4)',
                    '&:hover': { borderColor: '#2196f3', backgroundColor: 'rgba(33,150,243,0.1)' },
                  }}
                >
                  <SearchOutlined />
                </Button>
              </Box>

              {replOriginal && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: 'rgba(33,150,243,0.06)',
                    border: '1px solid rgba(33,150,243,0.2)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 1 }}>
                    Original Transaction Found
                  </Typography>
                  {[
                    ['Ref', replOriginal.refNo],
                    ['Customer', replOriginal.customerName],
                    ['Meter', replOriginal.meterNo],
                    ['Amount', `N$ ${replOriginal.amount.toFixed(2)}`],
                    ['kWh', replOriginal.kWh.toFixed(2)],
                    ['Date', new Date(replOriginal.dateTime).toLocaleString()],
                    ['Status', replOriginal.status],
                  ].map(([label, val]) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>
                        {val}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {replRef && !replOriginal && replRef.length >= 5 && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 2,
                    backgroundColor: 'rgba(33,150,243,0.08)',
                    color: '#90caf9',
                    border: '1px solid rgba(33,150,243,0.2)',
                    '& .MuiAlert-icon': { color: '#2196f3' },
                  }}
                >
                  Enter a transaction reference and click search to look up the original transaction.
                </Alert>
              )}

              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!replOriginal}
                  onClick={() => { setReplToken(generateToken()); }}
                  sx={{
                    py: 1.2,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #2196f3, #1976d2)',
                    color: '#fff',
                    '&:hover': { background: 'linear-gradient(135deg, #1e88e5, #1565c0)' },
                    '&.Mui-disabled': { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  Generate Replacement Token
                </Button>

                <TokenDisplay
                  token={replToken}
                  onCopy={() => handleCopy(replToken, setReplCopied)}
                  copied={replCopied}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
