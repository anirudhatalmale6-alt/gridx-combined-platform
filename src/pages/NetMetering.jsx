import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, useTheme, Grid, CircularProgress, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, Tab, Tabs, Select, MenuItem,
  TextField, Button, Snackbar, Alert, FormControl, InputLabel,
  IconButton,
} from "@mui/material";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import Header from "../components/Header";
import { tokens } from "../theme";
import { netMeteringAPI } from "../services/api";
import SpeedIcon from "@mui/icons-material/Speed";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SettingsIcon from "@mui/icons-material/Settings";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";

const REFRESH_INTERVAL_MS = 30000;
const TARIFF_RATE = 2.50;

const formatPower = (watts) => {
  if (watts == null) return "N/A";
  const kw = Math.abs(watts) / 1000;
  return kw < 1 ? `${Math.abs(watts).toFixed(0)} W` : `${kw.toFixed(2)} kW`;
};

const toKwh = (wh) => ((wh || 0) / 1000).toFixed(1);

export default function NetMetering() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";

  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState(null);
  const [activeMeters, setActiveMeters] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [trendPeriod, setTrendPeriod] = useState("daily");
  const [activeTab, setActiveTab] = useState(0);
  const [configs, setConfigs] = useState([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [editingDrn, setEditingDrn] = useState(null);
  const [editMode, setEditMode] = useState(0);
  const [editFeedInRate, setEditFeedInRate] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const NM_MODES = [
    { value: 0, label: "Gross Metering", desc: "Credit deducted 1:1 with consumption regardless of export. Net metering is display-only." },
    { value: 1, label: "Net Billing", desc: "Credit only deducted when importing more than exporting. No credit accumulation during export." },
    { value: 2, label: "Feed-in Credit", desc: "Export energy adds credits back at a configurable feed-in rate. Credit counter can increase during generation." },
    { value: 3, label: "TOU Net Metering", desc: "Same as Feed-in Credit but uses current Time-of-Use tariff rate. Export during peak hours earns more." },
  ];

  const fetchConfigs = useCallback(async () => {
    setConfigLoading(true);
    try {
      const [metersRes, configsRes] = await Promise.allSettled([
        netMeteringAPI.getActiveMeters(),
        netMeteringAPI.getAllConfigs(),
      ]);
      const meters = metersRes.status === "fulfilled" ? metersRes.value?.data || [] : activeMeters;
      const cfgs = configsRes.status === "fulfilled" ? configsRes.value?.data || [] : [];
      const cfgMap = {};
      cfgs.forEach(c => { cfgMap[c.DRN] = c; });
      const merged = meters.map(m => ({
        ...m,
        nm_mode: cfgMap[m.DRN]?.nm_mode ?? 0,
        feed_in_rate: cfgMap[m.DRN]?.feed_in_rate ?? 0,
        config_updated: cfgMap[m.DRN]?.updated_at || null,
      }));
      setConfigs(merged);
    } catch (err) { console.error("Config fetch error:", err); }
    finally { setConfigLoading(false); }
  }, [activeMeters]);

  const saveConfig = async (drn) => {
    try {
      await netMeteringAPI.setConfig(drn, { nm_mode: editMode, feed_in_rate: parseFloat(editFeedInRate) || 0 });
      setSnack({ open: true, msg: `Mode updated for ${drn} and sent to meter via MQTT`, severity: "success" });
      setEditingDrn(null);
      fetchConfigs();
    } catch (err) {
      setSnack({ open: true, msg: `Error: ${err.message}`, severity: "error" });
    }
  };

  useEffect(() => {
    if (activeTab === 1) fetchConfigs();
  }, [activeTab, fetchConfigs]);

  const fetchDashboard = useCallback(async (showLoading = false, period) => {
    if (showLoading) setLoading(true);
    try {
      const p = period || trendPeriod;
      const [dashRes, metersRes] = await Promise.allSettled([
        netMeteringAPI.getDashboard(p),
        netMeteringAPI.getActiveMeters(),
      ]);
      if (dashRes.status === "fulfilled" && dashRes.value?.data) setDashData(dashRes.value.data);
      if (metersRes.status === "fulfilled" && metersRes.value?.data) setActiveMeters(metersRes.value.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [trendPeriod]);

  useEffect(() => {
    fetchDashboard(true);
    const interval = setInterval(() => fetchDashboard(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handlePeriodChange = (_, val) => {
    if (val) {
      setTrendPeriod(val);
      fetchDashboard(false, val);
    }
  };

  const totalExport = dashData?.total_export || 0;
  const totalImport = dashData?.total_import || 0;
  const netEnergy = totalImport - totalExport;
  const totalMeters = dashData?.total_meters || activeMeters.length || 0;
  const revenue = (totalExport / 1000) * TARIFF_RATE;

  const todayImport = dashData?.today_import || 0;
  const todayExport = dashData?.today_export || 0;

  const hourlyData = (dashData?.hourly || []).map((h, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    import: (h?.import || 0) / 1000,
    export: (h?.export || 0) / 1000,
    net: ((h?.import || 0) - (h?.export || 0)) / 1000,
  }));

  const trendData = (dashData?.daily || []).map((d) => ({
    date: d?.label || d?.date || "",
    import: (d?.import || 0) / 1000,
    export: (d?.export || 0) / 1000,
    net: ((d?.import || 0) - (d?.export || 0)) / 1000,
  }));

  const trendLabel = { daily: "Daily (Last 30 Days)", weekly: "Weekly (Last 12 Weeks)", monthly: "Monthly (Last 12 Months)", yearly: "Yearly" }[trendPeriod] || "Trends";

  const cardStyle = {
    p: "20px", borderRadius: "16px",
    bgcolor: isDark ? colors.primary[400] : "#fff",
    border: `1px solid ${isDark ? colors.primary[300] : "#e0e0e0"}`,
  };

  const thStyle = { color: colors.grey[300], fontWeight: 700, fontSize: "11px", borderBottom: `1px solid ${colors.grey[700]}` };
  const tdStyle = { borderBottom: `1px solid ${colors.grey[800]}` };

  if (loading) {
    return (
      <Box sx={{ p: "20px" }}>
        <Header title="NET METERING" subtitle="System-wide Net Metering Dashboard" />
        <Box sx={{ display: "flex", justifyContent: "center", mt: "80px" }}>
          <CircularProgress sx={{ color: colors.greenAccent[500] }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: "20px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        <Header title="NET METERING" subtitle="System-wide Net Metering Dashboard" />
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "13px" } }}>
        <Tab label="Dashboard" icon={<SpeedIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Configuration" icon={<SettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {activeTab === 1 && (
        <Box>
          <Box sx={{ ...cardStyle, mb: 3 }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100], mb: 1 }}>
              Net Metering Mode Configuration
            </Typography>
            <Typography sx={{ fontSize: "12px", color: colors.grey[300], mb: 3 }}>
              Configure how each meter handles credit deduction in relation to solar export. Changes are sent to the meter via MQTT.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {NM_MODES.map((m) => (
                <Grid item xs={12} sm={6} md={3} key={m.value}>
                  <Box sx={{
                    p: 2, borderRadius: "12px",
                    border: `1px solid ${isDark ? colors.primary[300] : "#e0e0e0"}`,
                    bgcolor: isDark ? colors.primary[500] : "#fafafa",
                  }}>
                    <Chip label={`Mode ${m.value}`} size="small" sx={{
                      bgcolor: ["#64748b20", "#2196f320", "#4caf5020", "#ff980020"][m.value],
                      color: ["#94a3b8", "#42a5f5", "#66bb6a", "#ffa726"][m.value],
                      fontWeight: 700, fontSize: "10px", mb: 1,
                    }} />
                    <Typography sx={{ fontSize: "13px", fontWeight: 700, color: colors.grey[100], mb: 0.5 }}>{m.label}</Typography>
                    <Typography sx={{ fontSize: "11px", color: colors.grey[400], lineHeight: 1.4 }}>{m.desc}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ ...cardStyle }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100] }}>
                Meter Configuration ({configs.length})
              </Typography>
              <RefreshIcon
                sx={{ fontSize: 18, color: colors.grey[400], cursor: "pointer", "&:hover": { color: colors.greenAccent[500] } }}
                onClick={fetchConfigs}
              />
            </Box>
            {configLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={30} sx={{ color: colors.greenAccent[500] }} />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["DRN", "Customer", "Current Mode", "Feed-in Rate", "Last Updated", "Actions"].map(h => (
                        <TableCell key={h} sx={thStyle}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {configs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ textAlign: "center", color: colors.grey[400], py: 4 }}>
                          No net metering meters found
                        </TableCell>
                      </TableRow>
                    ) : (
                      configs.map((c) => {
                        const isEditing = editingDrn === c.DRN;
                        const modeInfo = NM_MODES[c.nm_mode] || NM_MODES[0];
                        const modeColor = ["#94a3b8", "#42a5f5", "#66bb6a", "#ffa726"][c.nm_mode] || "#94a3b8";

                        return (
                          <TableRow key={c.DRN} sx={{ "&:hover": { bgcolor: isDark ? colors.primary[300] : "#f5f5f5" } }}>
                            <TableCell sx={{ ...tdStyle, color: colors.grey[100], fontSize: "12px", fontWeight: 600 }}>{c.DRN}</TableCell>
                            <TableCell sx={{ ...tdStyle, color: colors.grey[200], fontSize: "12px" }}>{c.customer_name || c.DRN}</TableCell>
                            <TableCell sx={tdStyle}>
                              {isEditing ? (
                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                  <Select value={editMode} onChange={(e) => setEditMode(e.target.value)}
                                    sx={{ fontSize: "12px", color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}>
                                    {NM_MODES.map(m => (
                                      <MenuItem key={m.value} value={m.value} sx={{ fontSize: "12px" }}>{m.label}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                <Chip label={modeInfo.label} size="small" sx={{ bgcolor: `${modeColor}20`, color: modeColor, fontWeight: 600, fontSize: "10px" }} />
                              )}
                            </TableCell>
                            <TableCell sx={tdStyle}>
                              {isEditing ? (
                                <TextField size="small" type="number" value={editFeedInRate}
                                  onChange={(e) => setEditFeedInRate(e.target.value)}
                                  placeholder="0.00" inputProps={{ step: "0.01", min: "0" }}
                                  disabled={editMode !== 2}
                                  sx={{ width: 120, "& input": { fontSize: "12px", color: colors.grey[100] }, "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}
                                />
                              ) : (
                                <Typography sx={{ fontSize: "12px", color: c.nm_mode === 2 ? "#4caf50" : colors.grey[500] }}>
                                  {c.nm_mode === 2 ? `N$ ${(c.feed_in_rate || 0).toFixed(4)}/kWh` : "N/A"}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ ...tdStyle, color: colors.grey[300], fontSize: "11px" }}>
                              {c.config_updated ? new Date(c.config_updated).toLocaleString() : "Not configured"}
                            </TableCell>
                            <TableCell sx={tdStyle}>
                              {isEditing ? (
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <Button size="small" variant="contained" startIcon={<SaveIcon sx={{ fontSize: 14 }} />}
                                    onClick={() => saveConfig(c.DRN)}
                                    sx={{ fontSize: "11px", textTransform: "none", bgcolor: colors.greenAccent[500], "&:hover": { bgcolor: colors.greenAccent[600] } }}>
                                    Save
                                  </Button>
                                  <Button size="small" variant="outlined" onClick={() => setEditingDrn(null)}
                                    sx={{ fontSize: "11px", textTransform: "none", color: colors.grey[300], borderColor: colors.grey[600] }}>
                                    Cancel
                                  </Button>
                                </Box>
                              ) : (
                                <IconButton size="small" onClick={() => { setEditingDrn(c.DRN); setEditMode(c.nm_mode); setEditFeedInRate(String(c.feed_in_rate || 0)); }}
                                  sx={{ color: colors.grey[400], "&:hover": { color: colors.greenAccent[500] } }}>
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
            <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ fontSize: "12px" }}>{snack.msg}</Alert>
          </Snackbar>
        </Box>
      )}

      {activeTab === 0 && (<Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {lastUpdated && (
            <Typography sx={{ fontSize: "11px", color: colors.grey[400] }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <RefreshIcon
            sx={{ fontSize: 18, color: colors.grey[400], cursor: "pointer", "&:hover": { color: colors.greenAccent[500] } }}
            onClick={() => fetchDashboard(false)}
          />
        </Box>
      </Box>

      {/* Hourly Energy Flow — Full Width with Summary Card */}
      <Box sx={{ ...cardStyle, mb: 3 }}>
        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100], mb: 2 }}>
          Today - Hourly Energy Flow
        </Typography>

        {/* Dark blue summary strip */}
        <Box sx={{
          display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 2,
          bgcolor: isDark ? "#1a2332" : "#1e3a5f", borderRadius: "12px", p: 2, mb: 2,
        }}>
          {[
            { label: "Total Export", value: `${toKwh(todayExport)} kWh`, color: "#4caf50", icon: <TrendingUpIcon sx={{ color: "#4caf50", fontSize: 20 }} /> },
            { label: "Total Import", value: `${toKwh(todayImport)} kWh`, color: "#f44336", icon: <TrendingDownIcon sx={{ color: "#f44336", fontSize: 20 }} /> },
            { label: "Est. Revenue", value: `N$ ${((todayExport / 1000) * TARIFF_RATE).toFixed(2)}`, color: "#64b5f6", icon: <AccountBalanceWalletIcon sx={{ color: "#64b5f6", fontSize: 20 }} /> },
            { label: "Active Net Meters", value: totalMeters, color: "#4cceac", icon: <SpeedIcon sx={{ color: "#4cceac", fontSize: 20 }} /> },
          ].map((item) => (
            <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 140 }}>
              {item.icon}
              <Box>
                <Typography sx={{ fontSize: "18px", fontWeight: 800, color: "#fff" }}>{item.value}</Typography>
                <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? colors.grey[700] : "#f0f0f0"} />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: colors.grey[400] }} />
            <YAxis tick={{ fontSize: 10, fill: colors.grey[400] }} label={{ value: "kWh", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: colors.grey[400] } }} />
            <RechartsTooltip contentStyle={{
              backgroundColor: isDark ? colors.primary[500] : "#fff",
              border: `1px solid ${colors.grey[600]}`, borderRadius: "8px", fontSize: "12px",
            }} />
            <Area type="monotone" dataKey="export" stackId="1" stroke="#4caf50" fill="#4caf5040" name="Export (kWh)" />
            <Area type="monotone" dataKey="import" stackId="2" stroke="#f44336" fill="#f4433640" name="Import (kWh)" />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
          </AreaChart>
        </ResponsiveContainer>
      </Box>

      {/* Net Energy Balance + Revenue Overview Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <Box sx={{ ...cardStyle, height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100], mb: 2 }}>
              Net Energy Balance
            </Typography>
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 2 }}>
              <Box sx={{
                width: 120, height: 120, borderRadius: "50%",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: netEnergy <= 0 ? `linear-gradient(135deg, #4caf5020, #4caf5040)` : `linear-gradient(135deg, #f4433620, #f4433640)`,
                border: `3px solid ${netEnergy <= 0 ? "#4caf50" : "#f44336"}`,
              }}>
                <Typography sx={{ fontSize: "22px", fontWeight: 800, color: netEnergy <= 0 ? "#4caf50" : "#f44336" }}>
                  {netEnergy <= 0 ? "+" : "-"}{Math.abs(netEnergy / 1000).toFixed(1)}
                </Typography>
                <Typography sx={{ fontSize: "11px", color: colors.grey[400] }}>kWh Net</Typography>
              </Box>
              <Chip
                label={netEnergy <= 0 ? "Net Surplus (Exporting)" : "Net Deficit (Importing)"}
                size="small"
                sx={{ bgcolor: netEnergy <= 0 ? "#4caf5020" : "#f4433620", color: netEnergy <= 0 ? "#4caf50" : "#f44336", fontWeight: 600, fontSize: "11px" }}
              />
              <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "10px", color: "#4caf50", fontWeight: 600 }}>EXPORT</Typography>
                  <Typography sx={{ fontSize: "16px", fontWeight: 700, color: colors.grey[100] }}>{toKwh(totalExport)}</Typography>
                  <Typography sx={{ fontSize: "10px", color: colors.grey[400] }}>kWh</Typography>
                </Box>
                <Box sx={{ width: "1px", bgcolor: colors.grey[600] }} />
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "10px", color: "#f44336", fontWeight: 600 }}>IMPORT</Typography>
                  <Typography sx={{ fontSize: "16px", fontWeight: 700, color: colors.grey[100] }}>{toKwh(totalImport)}</Typography>
                  <Typography sx={{ fontSize: "10px", color: colors.grey[400] }}>kWh</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={7}>
          <Box sx={{ ...cardStyle, height: "100%" }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100], mb: 2 }}>
              Revenue Overview
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: "12px", color: colors.grey[300] }}>Export Credits</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#4caf50" }}>N$ {revenue.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: "12px", color: colors.grey[300] }}>Import Cost</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#f44336" }}>N$ {((totalImport / 1000) * TARIFF_RATE).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ height: "1px", bgcolor: colors.grey[700] }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: "12px", fontWeight: 600, color: colors.grey[200] }}>Net Savings</Typography>
                {(() => {
                  const netSavings = revenue - ((totalImport / 1000) * TARIFF_RATE);
                  return (
                    <Typography sx={{ fontSize: "14px", fontWeight: 700, color: netSavings >= 0 ? "#4caf50" : "#f44336" }}>
                      {netSavings >= 0 ? "+" : "-"} N$ {Math.abs(netSavings).toFixed(2)}
                    </Typography>
                  );
                })()}
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 600, color: colors.grey[200], mb: 1 }}>Peak Times (Today)</Typography>
              <Box sx={{ display: "flex", gap: 4 }}>
                <Box>
                  <Typography sx={{ fontSize: "10px", color: "#4caf50", fontWeight: 600, textTransform: "uppercase" }}>Peak Export</Typography>
                  <Typography sx={{ fontSize: "20px", fontWeight: 700, color: colors.grey[100] }}>
                    {dashData?.peak_export_hour != null ? `${String(dashData.peak_export_hour).padStart(2, "0")}:00` : "--:--"}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "10px", color: "#f44336", fontWeight: 600, textTransform: "uppercase" }}>Peak Import</Typography>
                  <Typography sx={{ fontSize: "20px", fontWeight: 700, color: colors.grey[100] }}>
                    {dashData?.peak_import_hour != null ? `${String(dashData.peak_import_hour).padStart(2, "0")}:00` : "--:--"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Net Energy Trends with Period Selector */}
      <Box sx={{ ...cardStyle, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonthIcon sx={{ fontSize: 18, color: colors.grey[400] }} />
            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100] }}>
              Net Energy Trends — {trendLabel}
            </Typography>
          </Box>
          <ToggleButtonGroup size="small" value={trendPeriod} exclusive onChange={handlePeriodChange}
            sx={{
              "& .MuiToggleButton-root": {
                color: colors.grey[300], fontSize: "11px", px: 1.5, py: 0.3, textTransform: "none",
                borderColor: colors.grey[600],
                "&.Mui-selected": { bgcolor: colors.greenAccent[500] + "25", color: colors.greenAccent[500], borderColor: colors.greenAccent[500] },
              },
            }}
          >
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="yearly">Yearly</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={trendData.length ? trendData : [{ date: "No data", import: 0, export: 0, net: 0 }]}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? colors.grey[700] : "#f0f0f0"} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.grey[400] }} interval={0} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 10, fill: colors.grey[400] }} />
            <RechartsTooltip contentStyle={{
              backgroundColor: isDark ? colors.primary[500] : "#fff",
              border: `1px solid ${colors.grey[600]}`, borderRadius: "8px", fontSize: "12px",
            }} />
            <Bar dataKey="import" fill="#f44336" name="Import (kWh)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="export" fill="#4caf50" name="Export (kWh)" radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Active Meters Table */}
      <Box sx={{ ...cardStyle, mb: 3 }}>
        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100], mb: 2 }}>
          Active Net Meters ({activeMeters.length})
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["DRN", "Customer", "Power Flow", "Live Power", "Import (kWh)", "Export (kWh)", "Net (kWh)", "Revenue", "Last Seen", "Status"].map(h => (
                  <TableCell key={h} sx={thStyle} align={["Live Power", "Import (kWh)", "Export (kWh)", "Net (kWh)", "Revenue"].includes(h) ? "right" : "left"}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {activeMeters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: "center", color: colors.grey[400], py: 4 }}>
                    No net metering data available yet
                  </TableCell>
                </TableRow>
              ) : (
                activeMeters.map((m) => {
                  const netBal = (m.total_import || 0) - (m.total_export || 0);
                  const meterRevenue = ((m.total_export || 0) / 1000) * TARIFF_RATE;
                  const isOnline = m.status === "Online";
                  const direction = m.power_direction || "IDLE";
                  const dirColor = direction === "EXPORT" ? "#4caf50" : direction === "IMPORT" ? "#f44336" : colors.grey[400];

                  return (
                    <TableRow key={m.DRN} sx={{ "&:hover": { bgcolor: isDark ? colors.primary[300] : "#f5f5f5" } }}>
                      <TableCell sx={{ ...tdStyle, color: colors.grey[100], fontSize: "12px", fontWeight: 600 }}>{m.DRN}</TableCell>
                      <TableCell sx={{ ...tdStyle, color: colors.grey[200], fontSize: "12px" }}>{m.customer_name || m.DRN}</TableCell>
                      <TableCell sx={tdStyle}>
                        <Chip label={direction} size="small" sx={{ bgcolor: `${dirColor}20`, color: dirColor, fontWeight: 700, fontSize: "10px", height: 22 }} />
                      </TableCell>
                      <TableCell align="right" sx={{ ...tdStyle, color: dirColor, fontSize: "12px", fontWeight: 600 }}>
                        {m.live_power != null ? formatPower(m.live_power) : "--"}
                      </TableCell>
                      <TableCell align="right" sx={{ ...tdStyle, color: "#f44336", fontSize: "12px" }}>{toKwh(m.total_import)}</TableCell>
                      <TableCell align="right" sx={{ ...tdStyle, color: "#4caf50", fontSize: "12px" }}>{toKwh(m.total_export)}</TableCell>
                      <TableCell align="right" sx={{ ...tdStyle, color: netBal <= 0 ? "#4caf50" : "#f44336", fontSize: "12px", fontWeight: 600 }}>
                        {netBal <= 0 ? "+" : "-"}{Math.abs(netBal / 1000).toFixed(1)}
                      </TableCell>
                      <TableCell align="right" sx={{ ...tdStyle, color: "#4caf50", fontSize: "12px" }}>N$ {meterRevenue.toFixed(2)}</TableCell>
                      <TableCell sx={{ ...tdStyle, color: colors.grey[300], fontSize: "11px" }}>
                        {m.last_reading ? new Date(m.last_reading).toLocaleString() : "--"}
                      </TableCell>
                      <TableCell sx={tdStyle}>
                        <Chip label={isOnline ? "Online" : "Offline"} size="small" sx={{
                          bgcolor: isOnline ? "#4caf5020" : "#f4433620", color: isOnline ? "#4caf50" : "#f44336",
                          fontWeight: 600, fontSize: "10px", height: 22,
                        }} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>)}

    </Box>
  );
}
