import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LockOutlined,
  VerifiedUserOutlined,
  SecurityOutlined,
  HttpsOutlined,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)',
        position: 'relative',
        overflow: 'hidden',
        px: 2,
      }}
    >
      {/* ---- Subtle grid overlay ---- */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,180,216,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,216,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ---- Ambient glow ---- */}
      <Box
        sx={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,180,216,0.08) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ================================================================= */}
      {/* Glassmorphic Login Card                                           */}
      {/* ================================================================= */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
          bgcolor: 'rgba(17, 27, 46, 0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(30, 58, 95, 0.5)',
          borderRadius: 3,
          p: { xs: 3.5, sm: 4.5 },
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* ---- Logo ---- */}
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: '2.4rem',
              letterSpacing: '0.06em',
              background: 'linear-gradient(135deg, #00b4d8 0%, #43d3ff 50%, #00e5ff 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
              lineHeight: 1.2,
            }}
          >
            GRIDx
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.25em',
              fontSize: '0.62rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              display: 'block',
            }}
          >
            Pulsar Electronic Solutions
          </Typography>
        </Box>

        {/* ---- System banner ---- */}
        <Box sx={{ textAlign: 'center', mb: 3.5, mt: 2 }}>
          <Chip
            label="IEC 62055-41 Compliant  |  Web-Based  |  24/7 Real-Time"
            size="small"
            sx={{
              bgcolor: 'rgba(0, 180, 216, 0.08)',
              border: '1px solid rgba(0, 180, 216, 0.2)',
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.62rem',
              fontWeight: 500,
              letterSpacing: '0.03em',
              height: 26,
            }}
          />
        </Box>

        {/* ---- Error alert ---- */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError('')}
            sx={{
              mb: 2.5,
              bgcolor: 'rgba(219, 79, 74, 0.12)',
              color: '#f44336',
              border: '1px solid rgba(219, 79, 74, 0.3)',
              borderRadius: 2,
              '& .MuiAlert-icon': { color: '#f44336' },
              '& .MuiAlert-action .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' },
              fontSize: '0.82rem',
            }}
          >
            {error}
          </Alert>
        )}

        {/* ---- Username ---- */}
        <TextField
          fullWidth
          label="Username"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          InputProps={{
            sx: { fontSize: '0.9rem' },
          }}
          sx={{ mb: 2.5 }}
        />

        {/* ---- Password ---- */}
        <TextField
          fullWidth
          label="Password"
          variant="outlined"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          InputProps={{
            sx: { fontSize: '0.9rem' },
          }}
          sx={{ mb: 3.5 }}
        />

        {/* ---- Sign In button ---- */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || !username || !password}
          sx={{
            py: 1.5,
            fontWeight: 700,
            fontSize: '0.95rem',
            letterSpacing: '0.02em',
            background: 'linear-gradient(135deg, #00b4d8 0%, #0090ad 100%)',
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)',
            transition: 'all 0.25s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #43d3ff 0%, #00b4d8 100%)',
              boxShadow: '0 6px 28px rgba(0, 180, 216, 0.45)',
              transform: 'translateY(-1px)',
            },
            '&:disabled': {
              background: 'rgba(0, 180, 216, 0.2)',
              color: 'rgba(255,255,255,0.3)',
              boxShadow: 'none',
            },
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.7)' }} />
              <span>Authenticating...</span>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockOutlined sx={{ fontSize: 20 }} />
              <span>Sign In</span>
            </Box>
          )}
        </Button>
      </Box>

      {/* ================================================================= */}
      {/* Compliance badges                                                 */}
      {/* ================================================================= */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          gap: 1.5,
          mt: 3,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { label: 'IEC 62055-41', icon: <VerifiedUserOutlined sx={{ fontSize: 13 }} /> },
          { label: 'STS Compliant', icon: <SecurityOutlined sx={{ fontSize: 13 }} /> },
          { label: 'SSL Secured', icon: <HttpsOutlined sx={{ fontSize: 13 }} /> },
        ].map((badge) => (
          <Chip
            key={badge.label}
            icon={badge.icon}
            label={badge.label}
            size="small"
            variant="outlined"
            sx={{
              borderColor: 'rgba(30, 58, 95, 0.5)',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.62rem',
              fontWeight: 500,
              height: 24,
              '& .MuiChip-icon': { color: 'rgba(255,255,255,0.3)' },
            }}
          />
        ))}
      </Box>

      {/* ================================================================= */}
      {/* Footer                                                            */}
      {/* ================================================================= */}
      <Typography
        variant="caption"
        sx={{
          position: 'relative',
          zIndex: 1,
          color: 'rgba(255,255,255,0.2)',
          fontSize: '0.65rem',
          mt: 3,
          textAlign: 'center',
          letterSpacing: '0.02em',
        }}
      >
        &copy; 2026 Pulsar Electronic Solutions | GRIDx Smart Metering Platform v4.0
      </Typography>
    </Box>
  );
}
