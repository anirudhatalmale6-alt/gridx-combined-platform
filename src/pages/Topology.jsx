import { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  LocationCityOutlined,
  PlaceOutlined,
  ElectricalServicesOutlined,
  SpeedOutlined,
  ExpandMore,
  ChevronRight,
  BoltOutlined,
  PowerOutlined,
  FiberManualRecord,
  VisibilityOutlined,
  GroupOutlined,
  TransformOutlined,
} from '@mui/icons-material';
import Header from '../components/Header';
import { topologyData, meters } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Helpers ----
const fmt = (n) => Number(n).toLocaleString();

// ---- Status color map ----
const statusColors = {
  Online: { bg: 'rgba(76, 206, 172, 0.15)', text: '#4cceac' },
  Offline: { bg: 'rgba(108, 117, 125, 0.2)', text: '#6c757d' },
  Tampered: { bg: 'rgba(219, 79, 74, 0.15)', text: '#db4f4a' },
};

// ---- Type icons + colors ----
const typeConfig = {
  utility: { icon: <LocationCityOutlined />, color: '#00e5ff', label: 'Utility' },
  location: { icon: <PlaceOutlined />, color: '#4cceac', label: 'Location' },
  transformer: { icon: <ElectricalServicesOutlined />, color: '#f2b705', label: 'Transformer' },
  meter: { icon: <SpeedOutlined />, color: '#00b4d8', label: 'Meter' },
};

// ---- Utility: count all meters in a subtree ----
function countMeters(node) {
  if (node.type === 'meter') return 1;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + countMeters(child), 0);
}

// ---- Utility: sum power in a subtree ----
function sumPower(node) {
  if (node.type === 'meter') return node.power || 0;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + sumPower(child), 0);
}

// ---- Utility: count children of a specific type ----
function countType(node, type) {
  if (node.type === type) return 1;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + countType(child, type), 0);
}

// ---- Utility: collect all meters from subtree ----
function collectMeters(node) {
  if (node.type === 'meter') return [node];
  if (!node.children) return [];
  return node.children.flatMap((child) => collectMeters(child));
}

// ---- Tree Node Component ----
function TreeNode({ node, depth = 0, selectedNode, onSelect }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const config = typeConfig[node.type] || typeConfig.meter;
  const isSelected = selectedNode === node;

  const handleClick = () => {
    onSelect(node);
    if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        selected={isSelected}
        sx={{
          pl: 1.5 + depth * 2,
          py: 0.6,
          borderRadius: 1,
          mb: 0.3,
          minHeight: 36,
          '&.Mui-selected': {
            bgcolor: 'rgba(0, 229, 255, 0.08)',
            borderLeft: '3px solid #00e5ff',
            '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.12)' },
          },
          '&:hover': {
            bgcolor: 'rgba(0, 180, 216, 0.06)',
          },
        }}
      >
        {/* Expand/collapse icon */}
        {hasChildren ? (
          expanded ? (
            <ExpandMore sx={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', mr: 0.5 }} />
          ) : (
            <ChevronRight sx={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', mr: 0.5 }} />
          )
        ) : (
          <Box sx={{ width: 22 }} />
        )}

        {/* Type icon */}
        <ListItemIcon sx={{ minWidth: 30, '& .MuiSvgIcon-root': { fontSize: 18, color: config.color } }}>
          {config.icon}
        </ListItemIcon>

        {/* Node label */}
        <ListItemText
          primary={node.name}
          primaryTypographyProps={{
            fontSize: node.type === 'utility' ? '0.88rem' : node.type === 'meter' ? '0.75rem' : '0.8rem',
            fontWeight: node.type === 'utility' ? 700 : node.type === 'location' ? 600 : 500,
            color: isSelected ? '#00e5ff' : '#fff',
            fontFamily: node.type === 'meter' ? '"Roboto Mono", monospace' : 'inherit',
          }}
        />

        {/* Meter count badge for non-meter nodes */}
        {node.type !== 'meter' && (
          <Chip
            label={countMeters(node)}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              bgcolor: 'rgba(0,180,216,0.12)',
              color: '#00b4d8',
              fontWeight: 600,
            }}
          />
        )}

        {/* Status dot for meters */}
        {node.type === 'meter' && (
          <FiberManualRecord
            sx={{
              fontSize: 10,
              color: node.status === 'Online' ? '#4cceac' : node.status === 'Tampered' ? '#db4f4a' : '#6c757d',
            }}
          />
        )}
      </ListItemButton>

      {/* Children */}
      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {node.children.map((child, i) => (
              <TreeNode
                key={`${child.name}-${i}`}
                node={child}
                depth={depth + 1}
                selectedNode={selectedNode}
                onSelect={onSelect}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

// ---- Detail: City overview ----
function CityDetail({ node }) {
  const totalMeters = countMeters(node);
  const totalLocations = countType(node, 'location');
  const totalTransformers = countType(node, 'transformer');
  const totalPower = sumPower(node);

  return (
    <>
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 0.5, fontSize: '1.1rem' }}>
        {node.name}
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 3, fontSize: '0.82rem' }}>
        Utility-level overview of the entire grid network
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <PlaceOutlined sx={{ fontSize: 28, color: '#4cceac', mb: 0.5 }} />
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem' }}>{totalLocations}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Locations</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <ElectricalServicesOutlined sx={{ fontSize: 28, color: '#f2b705', mb: 0.5 }} />
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem' }}>{totalTransformers}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Transformers</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <SpeedOutlined sx={{ fontSize: 28, color: '#00b4d8', mb: 0.5 }} />
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem' }}>{totalMeters}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Meters</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <BoltOutlined sx={{ fontSize: 28, color: '#db4f4a', mb: 0.5 }} />
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem' }}>{totalPower.toFixed(1)}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>kW Total Load</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Location breakdown */}
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mt: 3, mb: 2, fontSize: '0.95rem' }}>
        Locations
      </Typography>
      <Grid container spacing={1.5}>
        {(node.children || []).map((loc, i) => (
          <Grid item xs={12} sm={6} key={i}>
            <Box
              sx={{
                bgcolor: 'rgba(10,22,40,0.6)',
                border: '1px solid rgba(30,58,95,0.4)',
                borderRadius: 2,
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>
                  {loc.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>
                  {countType(loc, 'transformer')} transformers &bull; {countMeters(loc)} meters
                </Typography>
              </Box>
              <Chip
                label={`${sumPower(loc).toFixed(1)} kW`}
                size="small"
                sx={{ bgcolor: 'rgba(0,229,255,0.1)', color: '#00e5ff', fontWeight: 600, fontSize: '0.72rem' }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </>
  );
}

// ---- Detail: Location overview ----
function LocationDetail({ node }) {
  const meterCount = countMeters(node);
  const transformerCount = countType(node, 'transformer');
  const totalPower = sumPower(node);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <PlaceOutlined sx={{ color: '#4cceac', fontSize: 24 }} />
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
          {node.name}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 3, fontSize: '0.82rem' }}>
        Location-level stats
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#f2b705', fontWeight: 700, fontSize: '1.5rem' }}>{transformerCount}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Transformers</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#00b4d8', fontWeight: 700, fontSize: '1.5rem' }}>{meterCount}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Meters</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#4cceac', fontWeight: 700, fontSize: '1.5rem' }}>{totalPower.toFixed(1)}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>kW Load</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Transformers listing */}
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
        Transformers
      </Typography>
      {(node.children || []).map((tx, i) => (
        <Box
          key={i}
          sx={{
            bgcolor: 'rgba(10,22,40,0.6)',
            border: '1px solid rgba(30,58,95,0.4)',
            borderRadius: 2,
            p: 2,
            mb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ElectricalServicesOutlined sx={{ color: '#f2b705', fontSize: 20 }} />
              <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem', fontFamily: 'monospace' }}>
                {tx.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {tx.capacity && (
                <Chip label={tx.capacity} size="small" sx={{ bgcolor: 'rgba(242,183,5,0.12)', color: '#f2b705', fontSize: '0.68rem', height: 22 }} />
              )}
              <Chip
                label={`${sumPower(tx).toFixed(1)} kW`}
                size="small"
                sx={{ bgcolor: 'rgba(0,229,255,0.1)', color: '#00e5ff', fontSize: '0.68rem', height: 22 }}
              />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>
            {countMeters(tx)} connected meters {tx.load ? `\u2022 ${tx.load}% loaded` : ''}
          </Typography>
        </Box>
      ))}
    </>
  );
}

// ---- Detail: Transformer overview ----
function TransformerDetail({ node }) {
  const meterList = collectMeters(node);
  const totalPower = sumPower(node);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <ElectricalServicesOutlined sx={{ color: '#f2b705', fontSize: 24 }} />
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'monospace' }}>
          {node.name}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 3, fontSize: '0.82rem' }}>
        {node.capacity ? `Capacity: ${node.capacity}` : 'Transformer'} {node.load ? `\u2022 Load: ${node.load}%` : ''}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#00b4d8', fontWeight: 700, fontSize: '1.5rem' }}>{meterList.length}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Connected Meters</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#4cceac', fontWeight: 700, fontSize: '1.5rem' }}>{totalPower.toFixed(1)}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>kW Total Load</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            {node.load !== undefined ? (
              <>
                <Typography variant="h5" sx={{ color: node.load > 80 ? '#db4f4a' : node.load > 60 ? '#f2b705' : '#4cceac', fontWeight: 700, fontSize: '1.5rem' }}>
                  {node.load}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Capacity Used</Typography>
              </>
            ) : (
              <>
                <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '1.5rem' }}>N/A</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Capacity Used</Typography>
              </>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Connected meters list */}
      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontSize: '0.95rem' }}>
        Connected Meters
      </Typography>
      {meterList.map((m, i) => {
        const sc = statusColors[m.status] || statusColors.Online;
        // Find full meter data from meters array
        const fullMeter = meters.find((fm) => fm.meterNo === m.meterNo);
        return (
          <Box
            key={i}
            sx={{
              bgcolor: 'rgba(10,22,40,0.6)',
              border: '1px solid rgba(30,58,95,0.4)',
              borderRadius: 2,
              p: 2,
              mb: 1.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem', fontFamily: 'monospace' }}>
                {m.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>
                {m.customer} &bull; {m.power} kW
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={m.status}
                size="small"
                sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 600, fontSize: '0.68rem', height: 22 }}
              />
              {fullMeter && (
                <Button
                  component={RouterLink}
                  to={`/meter/${fullMeter.drn}`}
                  variant="outlined"
                  size="small"
                  sx={{ fontSize: '0.68rem', minWidth: 'auto', py: 0.3, px: 1 }}
                >
                  Profile
                </Button>
              )}
            </Box>
          </Box>
        );
      })}
    </>
  );
}

// ---- Detail: Meter overview ----
function MeterDetail({ node }) {
  const fullMeter = meters.find((m) => m.meterNo === node.meterNo);
  const sc = statusColors[node.status] || statusColors.Online;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <SpeedOutlined sx={{ color: '#00b4d8', fontSize: 24 }} />
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'monospace' }}>
          {node.name}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 3, fontSize: '0.82rem' }}>
        {node.customer}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <BoltOutlined sx={{ fontSize: 22, color: '#f2b705', mb: 0.3 }} />
            <Typography variant="h6" sx={{ color: '#f2b705', fontWeight: 700, fontSize: '1.1rem' }}>
              {fullMeter ? `${fullMeter.power.voltage} V` : 'N/A'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>Voltage</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <ElectricalServicesOutlined sx={{ fontSize: 22, color: '#00b4d8', mb: 0.3 }} />
            <Typography variant="h6" sx={{ color: '#00b4d8', fontWeight: 700, fontSize: '1.1rem' }}>
              {fullMeter ? `${fullMeter.power.current} A` : 'N/A'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>Current</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <PowerOutlined sx={{ fontSize: 22, color: '#4cceac', mb: 0.3 }} />
            <Typography variant="h6" sx={{ color: '#4cceac', fontWeight: 700, fontSize: '1.1rem' }}>
              {node.power} kW
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>Power</Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <FiberManualRecord sx={{ fontSize: 22, color: sc.text, mb: 0.3 }} />
            <Typography variant="h6" sx={{ color: sc.text, fontWeight: 700, fontSize: '1.1rem' }}>
              {node.status}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>Status</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Additional info from full meter data */}
      {fullMeter && (
        <>
          <Divider sx={{ borderColor: 'rgba(30,58,95,0.4)', mb: 2 }} />
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block' }}>Power Factor</Typography>
                <Typography variant="body1" sx={{ color: '#4cceac', fontWeight: 700 }}>{fullMeter.power.powerFactor}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block' }}>Last Update</Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem' }}>
                  {new Date(fullMeter.lastUpdate).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block' }}>Frequency</Typography>
                <Typography variant="body1" sx={{ color: '#00b4d8', fontWeight: 700 }}>{fullMeter.power.frequency} Hz</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ bgcolor: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: 2, p: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block' }}>Temperature</Typography>
                <Typography variant="body1" sx={{ color: '#db4f4a', fontWeight: 700 }}>{fullMeter.power.temperature}{'\u00B0'}C</Typography>
              </Box>
            </Grid>
          </Grid>

          <Button
            component={RouterLink}
            to={`/meter/${fullMeter.drn}`}
            variant="contained"
            fullWidth
            startIcon={<VisibilityOutlined />}
          >
            View Full Profile
          </Button>
        </>
      )}
    </>
  );
}

// ---- Node detail dispatcher ----
function NodeDetail({ node }) {
  if (!node) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <SpeedOutlined sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 1 }} />
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.35)' }}>
          Select a node from the tree to view details
        </Typography>
      </Box>
    );
  }

  switch (node.type) {
    case 'utility':
      return <CityDetail node={node} />;
    case 'location':
      return <LocationDetail node={node} />;
    case 'transformer':
      return <TransformerDetail node={node} />;
    case 'meter':
      return <MeterDetail node={node} />;
    default:
      return null;
  }
}

// ===========================================================================
// Topology Page
// ===========================================================================
export default function Topology() {
  const [selectedNode, setSelectedNode] = useState(topologyData);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <Header
        title="Grid Topology"
        subtitle="Network hierarchy: City \u2192 Location \u2192 Transformer \u2192 Meter"
      />

      {/* ================================================================= */}
      {/* Main Layout: Tree (4 cols) + Details (8 cols)                      */}
      {/* ================================================================= */}
      <Grid container spacing={2.5}>
        {/* ---- Left Sidebar: Tree View ---- */}
        <Grid item xs={12} md={4}>
          <Card sx={{ ...darkCard, height: '100%', minHeight: 600 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  mb: 1.5,
                  px: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Network Tree
              </Typography>
              <List disablePadding sx={{ maxHeight: 560, overflowY: 'auto' }}>
                <TreeNode
                  node={topologyData}
                  depth={0}
                  selectedNode={selectedNode}
                  onSelect={setSelectedNode}
                />
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* ---- Right Main Area: Selected Node Details ---- */}
        <Grid item xs={12} md={8}>
          <Card sx={{ ...darkCard, height: '100%', minHeight: 600 }}>
            <CardContent>
              <NodeDetail node={selectedNode} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
