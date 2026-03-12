import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  BoltOutlined,
  AttachMoneyOutlined,
  MapOutlined,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Header from '../components/Header';
import { analysisData } from '../services/mockData';

// ---- Shared card styling ----
const darkCard = {
  background: '#152238',
  border: '1px solid rgba(30, 58, 95, 0.5)',
  borderRadius: 2,
};

// ---- Helpers ----
const fmt = (n) => Number(n).toLocaleString();
const fmtCurrency = (n) => `N$ ${Number(n).toLocaleString()}`;

// ---- Suburb colors for stacked chart ----
const suburbColors = [
  '#00b4d8', '#4cceac', '#6870fa', '#f2b705', '#db4f4a',
  '#e76f51', '#2a9d8f', '#a855f7', '#f472b6',
];

// ---- Power trend data (7 days, stacked by suburb) ----
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const powerTrendData = dayLabels.map((day, di) => {
  const row = { day };
  analysisData.powerBySuburb.forEach((s) => {
    // Simulate daily variation around the suburb's daily value
    const variance = [0.92, 1.05, 0.97, 1.08, 1.12, 0.85, 0.78];
    row[s.suburb] = Math.round(s.daily * variance[di]);
  });
  return row;
});

// ---- Revenue grouped bar data ----
const revenueBarData = analysisData.revenueBySuburb.map((s) => ({
  suburb: s.suburb,
  Daily: s.daily,
  Weekly: s.weekly,
  Monthly: s.monthly,
}));

// ---- Table cell styles ----
const thSx = {
  color: 'rgba(255,255,255,0.55)',
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  py: 1.2,
};

const tdSx = {
  color: '#fff',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  fontSize: '0.85rem',
  py: 1.3,
};

// ---- Custom tooltip ----
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ background: '#0d1b2a', border: '1px solid rgba(0,180,216,0.3)', borderRadius: 1, px: 1.5, py: 1, maxWidth: 220 }}>
      <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, display: 'block', mb: 0.5 }}>{label}</Typography>
      {payload.map((p, i) => (
        <Typography key={i} variant="caption" sx={{ display: 'block', color: p.color || '#00b4d8', fontSize: '0.72rem' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? p.value.toLocaleString() : p.value}
          {p.unit || ''}
        </Typography>
      ))}
    </Box>
  );
}

// ---- Availability color helper ----
function availabilityColor(pct) {
  if (pct >= 90) return '#4cceac';
  if (pct >= 70) return '#f2b705';
  return '#db4f4a';
}

export default function Analysis() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Header
        title="Analysis"
        subtitle="Power consumption, revenue trends, and regional meter availability"
      />

      {/* ---- Tabs ---- */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'none',
              fontWeight: 600,
              '&.Mui-selected': { color: '#00b4d8' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#00b4d8' },
          }}
        >
          <Tab icon={<BoltOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Power Analysis" />
          <Tab icon={<AttachMoneyOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Revenue Analysis" />
          <Tab icon={<MapOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Regional Overview" />
        </Tabs>
      </Box>

      {/* ============================================ */}
      {/* TAB 0: Power Analysis                       */}
      {/* ============================================ */}
      {tab === 0 && (
        <Box>
          {/* Stacked Area Chart */}
          <Card sx={{ ...darkCard, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                Power Consumption Trend (7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={powerTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}
                  />
                  {analysisData.powerBySuburb.map((s, i) => (
                    <Area
                      key={s.suburb}
                      type="monotone"
                      dataKey={s.suburb}
                      stackId="1"
                      stroke={suburbColors[i]}
                      fill={suburbColors[i]}
                      fillOpacity={0.35}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Suburb consumption stats cards */}
          <Grid container spacing={2}>
            {analysisData.powerBySuburb.map((s, i) => (
              <Grid item xs={12} sm={6} md={4} key={s.suburb}>
                <Card sx={darkCard}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: suburbColors[i] }} />
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                        {s.suburb}
                      </Typography>
                    </Box>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', fontSize: '0.68rem' }}>
                          Daily
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                          {fmt(s.daily)} kWh
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', fontSize: '0.68rem' }}>
                          Weekly
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                          {fmt(s.weekly)} kWh
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', fontSize: '0.68rem' }}>
                          Monthly
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                          {fmt(s.monthly)} kWh
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ============================================ */}
      {/* TAB 1: Revenue Analysis                     */}
      {/* ============================================ */}
      {tab === 1 && (
        <Box>
          {/* Grouped Bar Chart */}
          <Card sx={{ ...darkCard, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                Revenue by Suburb
              </Typography>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={revenueBarData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="suburb"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                    tickFormatter={(v) => `N$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }} />
                  <Bar dataKey="Daily" fill="#00b4d8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Weekly" fill="#4cceac" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Monthly" fill="#6870fa" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue breakdown table */}
          <Card sx={darkCard}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                Revenue Breakdown by Suburb
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={thSx}>Suburb</TableCell>
                      <TableCell sx={thSx} align="right">Daily Revenue</TableCell>
                      <TableCell sx={thSx} align="right">Weekly Revenue</TableCell>
                      <TableCell sx={thSx} align="right">Monthly Revenue</TableCell>
                      <TableCell sx={thSx} align="right">% of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const totalMonthly = analysisData.revenueBySuburb.reduce((s, r) => s + r.monthly, 0);
                      return analysisData.revenueBySuburb.map((r, i) => (
                        <TableRow key={r.suburb} sx={{ '&:hover': { background: 'rgba(0,180,216,0.05)' } }}>
                          <TableCell sx={tdSx}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: suburbColors[i] }} />
                              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{r.suburb}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={tdSx} align="right">{fmtCurrency(r.daily)}</TableCell>
                          <TableCell sx={tdSx} align="right">{fmtCurrency(r.weekly)}</TableCell>
                          <TableCell sx={tdSx} align="right">{fmtCurrency(r.monthly)}</TableCell>
                          <TableCell sx={tdSx} align="right">
                            <Typography variant="body2" sx={{ color: suburbColors[i], fontWeight: 600 }}>
                              {((r.monthly / totalMonthly) * 100).toFixed(1)}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ============================================ */}
      {/* TAB 2: Regional Overview                    */}
      {/* ============================================ */}
      {tab === 2 && (
        <Box>
          <Grid container spacing={2}>
            {analysisData.meterAvailability.map((region) => {
              const color = availabilityColor(region.percentage);
              const unavailable = region.total - region.available;
              return (
                <Grid item xs={12} sm={6} md={4} key={region.region}>
                  <Card sx={darkCard}>
                    <CardContent sx={{ py: 2.5, '&:last-child': { pb: 2.5 } }}>
                      {/* Region name and percentage */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                          {region.region}
                        </Typography>
                        <Typography variant="h6" sx={{ color, fontWeight: 700, fontSize: '1.2rem' }}>
                          {region.percentage}%
                        </Typography>
                      </Box>

                      {/* Progress bar */}
                      <LinearProgress
                        variant="determinate"
                        value={region.percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          mb: 2,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor: color,
                          },
                        }}
                      />

                      {/* Meter counts */}
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', fontSize: '0.68rem' }}>
                            Total
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                            {fmt(region.total)}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', fontSize: '0.68rem' }}>
                            Available
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#4cceac', fontWeight: 600 }}>
                            {fmt(region.available)}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', fontSize: '0.68rem' }}>
                            Unavailable
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#db4f4a', fontWeight: 600 }}>
                            {fmt(unavailable)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
