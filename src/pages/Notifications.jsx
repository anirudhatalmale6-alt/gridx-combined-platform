import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ErrorOutlined,
  WarningAmberOutlined,
  CheckCircleOutlined,
  InfoOutlined,
  FiberManualRecord,
  MarkEmailReadOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import { notifications } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Notification type configuration ----
const typeConfig = {
  Critical: { color: '#db4f4a', icon: ErrorOutlined,          bg: 'rgba(219, 79, 74, 0.15)' },
  Warning:  { color: '#f2b705', icon: WarningAmberOutlined,   bg: 'rgba(242, 183, 5, 0.15)' },
  Success:  { color: '#4cceac', icon: CheckCircleOutlined,    bg: 'rgba(76, 206, 172, 0.15)' },
  Info:     { color: '#6870fa', icon: InfoOutlined,            bg: 'rgba(104, 112, 250, 0.15)' },
};

const filterTabs = ['All', 'Critical', 'Warning', 'Success', 'Info'];

// ---- Helpers ----
function formatRelativeTime(iso) {
  const now = new Date('2026-03-12T09:00:00');
  const d = new Date(iso);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return d.toLocaleDateString('en-NA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===========================================================================
// Notifications Page
// ===========================================================================
export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [readState, setReadState] = useState(() => {
    const map = {};
    notifications.forEach((n) => { map[n.id] = n.read; });
    return map;
  });

  // ---- Counts by type ----
  const counts = useMemo(() => {
    const c = { Critical: 0, Warning: 0, Success: 0, Info: 0 };
    notifications.forEach((n) => { if (c[n.type] !== undefined) c[n.type]++; });
    return c;
  }, []);

  // ---- Filtered + sorted notifications ----
  const filteredNotifications = useMemo(() => {
    const list = activeFilter === 'All'
      ? [...notifications]
      : notifications.filter((n) => n.type === activeFilter);
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [activeFilter]);

  const handleMarkRead = (id) => {
    setReadState((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <Box>
      <Header
        title="Notifications"
        subtitle="System alerts and meter events"
      />

      {/* ---- Summary Chips ---- */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([type, count]) => {
          const cfg = typeConfig[type];
          return (
            <Chip
              key={type}
              icon={<cfg.icon sx={{ color: `${cfg.color} !important`, fontSize: 18 }} />}
              label={`${type}: ${count}`}
              sx={{
                bgcolor: cfg.bg,
                color: cfg.color,
                fontWeight: 600,
                fontSize: '0.78rem',
                height: 32,
                '& .MuiChip-icon': { ml: 0.5 },
              }}
            />
          );
        })}
      </Box>

      {/* ---- Filter Tabs ---- */}
      <Tabs
        value={activeFilter}
        onChange={(_, v) => setActiveFilter(v)}
        sx={{
          mb: 2,
          '& .MuiTab-root': {
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.82rem',
            minWidth: 80,
          },
          '& .Mui-selected': { color: '#00b4d8' },
          '& .MuiTabs-indicator': { backgroundColor: '#00b4d8' },
        }}
      >
        {filterTabs.map((tab) => (
          <Tab key={tab} label={tab} value={tab} />
        ))}
      </Tabs>

      {/* ---- Notification List ---- */}
      <Card sx={darkCard}>
        <List disablePadding>
          {filteredNotifications.map((ntf, idx) => {
            const cfg = typeConfig[ntf.type] || typeConfig.Info;
            const IconComp = cfg.icon;
            const isRead = readState[ntf.id];

            return (
              <Box key={ntf.id}>
                <ListItem
                  disablePadding
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    px: 2.5,
                    py: 2,
                    bgcolor: isRead ? 'transparent' : 'rgba(0, 180, 216, 0.04)',
                    '&:hover': { bgcolor: isRead ? 'rgba(0,180,216,0.03)' : 'rgba(0, 180, 216, 0.07)' },
                  }}
                >
                  {/* ---- Left: Icon Circle ---- */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: cfg.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.3,
                    }}
                  >
                    <IconComp sx={{ color: cfg.color, fontSize: 22 }} />
                  </Box>

                  {/* ---- Center: Content ---- */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        {ntf.title}
                      </Typography>
                      {!isRead && (
                        <FiberManualRecord sx={{ fontSize: 8, color: '#00b4d8' }} />
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.78rem',
                        lineHeight: 1.5,
                        mb: 0.5,
                      }}
                    >
                      {ntf.message}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}
                      >
                        {formatRelativeTime(ntf.timestamp)}
                      </Typography>
                      {ntf.meterNo && (
                        <Chip
                          label={ntf.meterNo}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.5)',
                            fontFamily: 'monospace',
                            fontSize: '0.68rem',
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* ---- Right: Read Indicator / Mark as Read ---- */}
                  <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {!isRead ? (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<MarkEmailReadOutlined sx={{ fontSize: 16 }} />}
                        onClick={() => handleMarkRead(ntf.id)}
                        sx={{
                          fontSize: '0.7rem',
                          textTransform: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Mark as Read
                      </Button>
                    ) : (
                      <Typography
                        variant="caption"
                        sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.68rem' }}
                      >
                        Read
                      </Typography>
                    )}
                  </Box>
                </ListItem>
                {idx < filteredNotifications.length - 1 && (
                  <Divider sx={{ borderColor: 'rgba(30,58,95,0.3)' }} />
                )}
              </Box>
            );
          })}
          {filteredNotifications.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                No notifications match the selected filter.
              </Typography>
            </Box>
          )}
        </List>
      </Card>
    </Box>
  );
}
