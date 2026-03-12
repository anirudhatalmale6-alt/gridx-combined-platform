import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import {
  PersonAddOutlined,
  EditOutlined,
  CheckCircle,
  Cancel,
  FiberManualRecord,
} from '@mui/icons-material';
import Header from '../components/Header';
import { operators, auditLog } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Role chip color map ----
const roleColor = {
  ADMIN:      { bg: 'rgba(0, 180, 216, 0.15)',  text: '#00b4d8' },
  SUPERVISOR: { bg: 'rgba(104, 112, 250, 0.15)', text: '#6870fa' },
  OPERATOR:   { bg: 'rgba(76, 206, 172, 0.15)',  text: '#4cceac' },
  VIEWER:     { bg: 'rgba(158, 158, 158, 0.15)', text: '#9e9e9e' },
};

// ---- Status dot color map ----
const statusDotColor = {
  Online:    '#4cceac',
  Offline:   '#9e9e9e',
  Suspended: '#db4f4a',
};

// ---- Audit log type border colors ----
const auditTypeColor = {
  VEND:   '#00b4d8',
  LOGIN:  '#4cceac',
  CREATE: '#6870fa',
  UPDATE: '#f2b705',
  DELETE: '#db4f4a',
  SYSTEM: '#9e9e9e',
};

// ---- Permissions matrix definition ----
const permissions = [
  'Vend Tokens',
  'View Transactions',
  'Reverse Transactions',
  'Customer Management',
  'Vendor Management',
  'Tariff Configuration',
  'Reports Access',
  'System Admin',
  'API Access',
];

const roles = ['ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER'];

const permissionMatrix = {
  ADMIN:      [true, true, true, true, true, true, true, true, true],
  SUPERVISOR: [true, true, true, true, true, true, true, false, false],
  OPERATOR:   [true, true, false, true, false, false, false, false, false],
  VIEWER:     [false, true, false, false, false, false, true, false, false],
};

// ---- Helpers ----
function formatDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-NA', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-NA', { hour: '2-digit', minute: '2-digit' });
}

function formatTimestamp(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-NA', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-NA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ===========================================================================
// Admin Page
// ===========================================================================
export default function Admin() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Header
        title="System Administration"
        subtitle="Operator management, permissions, and audit trail"
      />

      {/* ---- Tab Navigation ---- */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.85rem',
          },
          '& .Mui-selected': { color: '#00b4d8' },
          '& .MuiTabs-indicator': { backgroundColor: '#00b4d8' },
        }}
      >
        <Tab label="Operator Management" />
        <Tab label="Role Permissions" />
        <Tab label="Audit Log" />
      </Tabs>

      {/* ================================================================= */}
      {/* TAB 0 - Operator Management                                       */}
      {/* ================================================================= */}
      {activeTab === 0 && (
        <Card sx={darkCard}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>
                Operators
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<PersonAddOutlined />}
              >
                Add Operator
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Name', 'Username', 'Role', 'Last Login', 'Status', 'Actions'].map((col) => (
                      <TableCell
                        key={col}
                        sx={{
                          color: 'rgba(255,255,255,0.5)',
                          fontWeight: 600,
                          fontSize: '0.75rem',
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
                  {operators.map((op) => {
                    const rc = roleColor[op.role] || roleColor.VIEWER;
                    const dotColor = statusDotColor[op.status] || '#9e9e9e';
                    return (
                      <TableRow
                        key={op.id}
                        sx={{
                          '&:hover': { bgcolor: 'rgba(0,180,216,0.06)' },
                          '& td': {
                            borderBottom: '1px solid rgba(30,58,95,0.3)',
                            color: 'rgba(255,255,255,0.85)',
                            fontSize: '0.8rem',
                            py: 1.2,
                          },
                        }}
                      >
                        <TableCell sx={{ color: '#fff', fontWeight: 500 }}>
                          {op.name}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                          {op.username}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={op.role}
                            size="small"
                            sx={{
                              bgcolor: rc.bg,
                              color: rc.text,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24,
                            }}
                          />
                        </TableCell>
                        <TableCell>{formatDateTime(op.lastLogin)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <FiberManualRecord sx={{ fontSize: 10, color: dotColor }} />
                            <Typography
                              variant="body2"
                              sx={{ color: dotColor, fontWeight: 500, fontSize: '0.78rem' }}
                            >
                              {op.status}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditOutlined sx={{ fontSize: 16 }} />}
                            sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* TAB 1 - Role Permissions Matrix                                   */}
      {/* ================================================================= */}
      {activeTab === 1 && (
        <Card sx={darkCard}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem', mb: 2 }}>
              Role Permissions Matrix
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        color: 'rgba(255,255,255,0.5)',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderBottom: '2px solid rgba(30,58,95,0.6)',
                        minWidth: 200,
                      }}
                    >
                      Permission
                    </TableCell>
                    {roles.map((role) => {
                      const rc = roleColor[role];
                      return (
                        <TableCell
                          key={role}
                          align="center"
                          sx={{
                            borderBottom: '2px solid rgba(30,58,95,0.6)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Chip
                            label={role}
                            size="small"
                            sx={{
                              bgcolor: rc.bg,
                              color: rc.text,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24,
                            }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((perm, idx) => (
                    <TableRow
                      key={perm}
                      sx={{
                        '&:hover': { bgcolor: 'rgba(0,180,216,0.04)' },
                        '& td': {
                          borderBottom: '1px solid rgba(30,58,95,0.3)',
                          py: 1.2,
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          color: 'rgba(255,255,255,0.85)',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                        }}
                      >
                        {perm}
                      </TableCell>
                      {roles.map((role) => (
                        <TableCell key={role} align="center">
                          {permissionMatrix[role][idx] ? (
                            <CheckCircle sx={{ fontSize: 20, color: '#4cceac' }} />
                          ) : (
                            <Cancel sx={{ fontSize: 20, color: '#db4f4a' }} />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* TAB 2 - Audit Log                                                 */}
      {/* ================================================================= */}
      {activeTab === 2 && (
        <Card sx={darkCard}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '1rem', mb: 2 }}>
              Audit Log
            </Typography>

            <List disablePadding>
              {auditLog.map((entry, idx) => {
                const borderColor = auditTypeColor[entry.type] || '#9e9e9e';
                return (
                  <Box key={entry.id}>
                    <ListItem
                      disablePadding
                      sx={{
                        display: 'block',
                        borderLeft: `3px solid ${borderColor}`,
                        pl: 2,
                        py: 1.5,
                        '&:hover': { bgcolor: 'rgba(0,180,216,0.04)' },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.3 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem' }}
                        >
                          {entry.event}
                        </Typography>
                        <Chip
                          label={entry.type}
                          size="small"
                          sx={{
                            bgcolor: `${borderColor}20`,
                            color: borderColor,
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            height: 20,
                            ml: 1,
                            flexShrink: 0,
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.55)',
                          fontSize: '0.75rem',
                          display: 'block',
                          mb: 0.3,
                        }}
                      >
                        {entry.detail}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}
                        >
                          {formatTimestamp(entry.timestamp)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}
                        >
                          by {entry.user}
                        </Typography>
                      </Box>
                    </ListItem>
                    {idx < auditLog.length - 1 && (
                      <Divider sx={{ borderColor: 'rgba(30,58,95,0.3)' }} />
                    )}
                  </Box>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
