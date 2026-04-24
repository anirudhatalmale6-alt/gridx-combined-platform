import { useState, useEffect } from "react";
import { Box, Typography, useTheme, Grid, CircularProgress, Chip } from "@mui/material";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import Header from "../components/Header";
import { tokens } from "../theme";
import { netMeteringAPI, meterAPI } from "../services/api";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import SpeedIcon from "@mui/icons-material/Speed";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

const StatCard = ({ title, value, unit, icon, color, bgColor, subtitle }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{
      p: "20px",
      borderRadius: "16px",
      bgcolor: isDark ? colors.primary[400] : "#fff",
      border: `1px solid ${isDark ? colors.primary[300] : "#e0e0e0"}`,
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 25px rgba(0,0,0,0.15)" },
    }}>
      <Box sx={{
        position: "absolute", top: -10, right: -10, width: 60, height: 60,
        borderRadius: "50%", bgcolor: `${bgColor}15`, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: "11px", fontWeight: 600, color: color, textTransform: "uppercase", letterSpacing: "1px" }}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: "4px", mt: "8px" }}>
        <Typography sx={{ fontSize: "28px", fontWeight: 800, color: colors.grey[100] }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: "13px", fontWeight: 500, color: colors.grey[400] }}>
          {unit}
        </Typography>
      </Box>
      {subtitle && (
        <Typography sx={{ fontSize: "11px", color: colors.grey[400], mt: "4px" }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default function NetMetering() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";

  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState(null);
  const [activeMeters, setActiveMeters] = useState([]);
  const [period, setPeriod] = useState("daily");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, metersRes] = await Promise.allSettled([
        netMeteringAPI.getDashboard(),
        netMeteringAPI.getActiveMeters(),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value?.data) {
        setDashData(dashRes.value.data);
      }
      if (metersRes.status === "fulfilled" && metersRes.value?.data) {
        setActiveMeters(metersRes.value.data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalExport = dashData?.total_export || 0;
  const totalImport = dashData?.total_import || 0;
  const netEnergy = totalExport - totalImport;
  const totalMeters = dashData?.total_meters || activeMeters.length || 0;
  const tariffRate = 2.50;
  const revenue = (totalExport / 1000) * tariffRate;

  const hourlyData = (dashData?.hourly || []).map((h, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    import: (h?.import || 0) / 1000,
    export: (h?.export || 0) / 1000,
    net: ((h?.export || 0) - (h?.import || 0)) / 1000,
  }));

  const dailyData = (dashData?.daily || []).map((d) => ({
    date: d?.label || d?.date || "",
    import: (d?.import || 0) / 1000,
    export: (d?.export || 0) / 1000,
    net: ((d?.export || 0) - (d?.import || 0)) / 1000,
  }));

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
      <Header title="NET METERING" subtitle="System-wide Net Metering Dashboard" />

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Net Meters"
            value={totalMeters}
            unit="meters"
            icon={<SpeedIcon sx={{ color: colors.greenAccent[500], fontSize: 24 }} />}
            color={colors.greenAccent[500]}
            bgColor={colors.greenAccent[500]}
            subtitle="With bidirectional metering"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Export"
            value={(totalExport / 1000).toFixed(1)}
            unit="kWh"
            icon={<TrendingUpIcon sx={{ color: "#4caf50", fontSize: 24 }} />}
            color="#4caf50"
            bgColor="#4caf50"
            subtitle="Energy fed to grid"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Import"
            value={(totalImport / 1000).toFixed(1)}
            unit="kWh"
            icon={<TrendingDownIcon sx={{ color: "#f44336", fontSize: 24 }} />}
            color="#f44336"
            bgColor="#f44336"
            subtitle="Energy from grid"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Est. Revenue"
            value={`N$ ${revenue.toFixed(2)}`}
            unit=""
            icon={<AccountBalanceWalletIcon sx={{ color: colors.blueAccent[500], fontSize: 24 }} />}
            color={colors.blueAccent[500]}
            bgColor={colors.blueAccent[500]}
            subtitle="From export credits"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Hourly Import/Export Chart */}
        <Grid item xs={12} md={7}>
          <Box sx={{
            p: "20px", borderRadius: "16px",
            bgcolor: isDark ? colors.primary[400] : "#fff",
            border: `1px solid ${isDark ? colors.primary[300] : "#e0e0e0"}`,
          }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100], mb: 2 }}>
              Hourly Energy Flow
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={hourlyData.length ? hourlyData : Array.from({length: 24}, (_, i) => ({ hour: `${String(i).padStart(2, "0")}:00`, import: 0, export: 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? colors.grey[700] : "#f0f0f0"} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: colors.grey[400] }} />
                <YAxis tick={{ fontSize: 10, fill: colors.grey[400] }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDark ? colors.primary[500] : "#fff",
                    border: `1px solid ${colors.grey[600]}`,
                    borderRadius: "8px", fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="export" stackId="1" stroke="#4caf50" fill="#4caf5040" name="Export (kWh)" />
                <Area type="monotone" dataKey="import" stackId="2" stroke="#f44336" fill="#f4433640" name="Import (kWh)" />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Grid>

        {/* Net Energy Summary */}
        <Grid item xs={12} md={5}>
          <Box sx={{
            p: "20px", borderRadius: "16px", height: "100%",
            bgcolor: isDark ? colors.primary[400] : "#fff",
            border: `1px solid ${isDark ? colors.primary[300] : "#e0e0e0"}`,
            display: "flex", flexDirection: "column",
          }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100], mb: 2 }}>
              Net Energy Balance
            </Typography>

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 2 }}>
              <Box sx={{
                width: 120, height: 120, borderRadius: "50%",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: netEnergy >= 0
                  ? `linear-gradient(135deg, #4caf5020, #4caf5040)`
                  : `linear-gradient(135deg, #f4433620, #f4433640)`,
                border: `3px solid ${netEnergy >= 0 ? "#4caf50" : "#f44336"}`,
              }}>
                <Typography sx={{ fontSize: "22px", fontWeight: 800, color: netEnergy >= 0 ? "#4caf50" : "#f44336" }}>
                  {netEnergy >= 0 ? "+" : ""}{(netEnergy / 1000).toFixed(1)}
                </Typography>
                <Typography sx={{ fontSize: "11px", color: colors.grey[400] }}>kWh Net</Typography>
              </Box>

              <Chip
                label={netEnergy >= 0 ? "Net Surplus" : "Net Deficit"}
                size="small"
                sx={{
                  bgcolor: netEnergy >= 0 ? "#4caf5020" : "#f4433620",
                  color: netEnergy >= 0 ? "#4caf50" : "#f44336",
                  fontWeight: 600, fontSize: "11px",
                }}
              />

              <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "10px", color: "#4caf50", fontWeight: 600 }}>EXPORT</Typography>
                  <Typography sx={{ fontSize: "16px", fontWeight: 700, color: colors.grey[100] }}>
                    {(totalExport / 1000).toFixed(1)}
                  </Typography>
                  <Typography sx={{ fontSize: "10px", color: colors.grey[400] }}>kWh</Typography>
                </Box>
                <Box sx={{ width: "1px", bgcolor: colors.grey[600] }} />
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "10px", color: "#f44336", fontWeight: 600 }}>IMPORT</Typography>
                  <Typography sx={{ fontSize: "16px", fontWeight: 700, color: colors.grey[100] }}>
                    {(totalImport / 1000).toFixed(1)}
                  </Typography>
                  <Typography sx={{ fontSize: "10px", color: colors.grey[400] }}>kWh</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Daily Trends Chart */}
      <Box sx={{
        p: "20px", borderRadius: "16px", mb: 3,
        bgcolor: isDark ? colors.primary[400] : "#fff",
        border: `1px solid ${isDark ? colors.primary[300] : "#e0e0e0"}`,
      }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100] }}>
            Daily Net Energy Trends
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {["daily", "weekly", "monthly"].map((p) => (
              <Chip
                key={p}
                label={p.charAt(0).toUpperCase() + p.slice(1)}
                size="small"
                onClick={() => setPeriod(p)}
                sx={{
                  bgcolor: period === p ? colors.blueAccent[500] : "transparent",
                  color: period === p ? "#fff" : colors.grey[400],
                  fontWeight: 600, fontSize: "11px", cursor: "pointer",
                  border: period === p ? "none" : `1px solid ${colors.grey[600]}`,
                  "&:hover": { bgcolor: period === p ? colors.blueAccent[400] : `${colors.blueAccent[500]}20` },
                }}
              />
            ))}
          </Box>
        </Box>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData.length ? dailyData : Array.from({length: 7}, (_, i) => ({ date: `Day ${i+1}`, import: 0, export: 0, net: 0 }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? colors.grey[700] : "#f0f0f0"} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.grey[400] }} />
            <YAxis tick={{ fontSize: 10, fill: colors.grey[400] }} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: isDark ? colors.primary[500] : "#fff",
                border: `1px solid ${colors.grey[600]}`,
                borderRadius: "8px", fontSize: "12px",
              }}
            />
            <Bar dataKey="export" fill="#4caf50" name="Export (kWh)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="import" fill="#f44336" name="Import (kWh)" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="net" stroke={colors.blueAccent[500]} strokeWidth={2} name="Net (kWh)" dot={false} />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Performance Analytics */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{
            p: "20px", borderRadius: "16px",
            bgcolor: isDark ? colors.primary[400] : "#fff",
            border: `1px solid ${isDark ? colors.primary[300] : "#e0e0e0"}`,
          }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100], mb: 2 }}>
              System Efficiency
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: "4px" }}>
                  <Typography sx={{ fontSize: "12px", color: colors.grey[300] }}>Self-Consumption Rate</Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 700, color: colors.greenAccent[500] }}>
                    {totalExport + totalImport > 0 ? (((totalExport + totalImport - totalExport) / (totalExport + totalImport)) * 100).toFixed(0) : 0}%
                  </Typography>
                </Box>
                <Box sx={{ height: 6, borderRadius: 3, bgcolor: `${colors.greenAccent[500]}20` }}>
                  <Box sx={{
                    height: "100%", borderRadius: 3, bgcolor: colors.greenAccent[500],
                    width: `${totalExport + totalImport > 0 ? ((totalImport / (totalExport + totalImport)) * 100) : 0}%`,
                    transition: "width 1s ease",
                  }} />
                </Box>
              </Box>
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: "4px" }}>
                  <Typography sx={{ fontSize: "12px", color: colors.grey[300] }}>Grid Independence</Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 700, color: colors.blueAccent[500] }}>
                    {totalExport + totalImport > 0 ? ((totalExport / (totalExport + totalImport)) * 100).toFixed(0) : 0}%
                  </Typography>
                </Box>
                <Box sx={{ height: 6, borderRadius: 3, bgcolor: `${colors.blueAccent[500]}20` }}>
                  <Box sx={{
                    height: "100%", borderRadius: 3, bgcolor: colors.blueAccent[500],
                    width: `${totalExport + totalImport > 0 ? ((totalExport / (totalExport + totalImport)) * 100) : 0}%`,
                    transition: "width 1s ease",
                  }} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{
            p: "20px", borderRadius: "16px",
            bgcolor: isDark ? colors.primary[400] : "#fff",
            border: `1px solid ${isDark ? colors.primary[300] : "#e0e0e0"}`,
          }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100], mb: 2 }}>
              Revenue Overview
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: "12px", color: colors.grey[300] }}>Export Credits</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#4caf50" }}>
                  N$ {revenue.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: "12px", color: colors.grey[300] }}>Import Cost</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#f44336" }}>
                  N$ {((totalImport / 1000) * tariffRate).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ height: "1px", bgcolor: colors.grey[700] }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: "12px", fontWeight: 600, color: colors.grey[200] }}>Net Savings</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.blueAccent[400] }}>
                  N$ {(revenue - ((totalImport / 1000) * tariffRate)).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{
            p: "20px", borderRadius: "16px",
            bgcolor: isDark ? colors.primary[400] : "#fff",
            border: `1px solid ${isDark ? colors.primary[300] : "#e0e0e0"}`,
          }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: colors.grey[100], mb: 2 }}>
              Peak Times
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: "10px", color: "#4caf50", fontWeight: 600, textTransform: "uppercase" }}>
                  Peak Export Hour
                </Typography>
                <Typography sx={{ fontSize: "18px", fontWeight: 700, color: colors.grey[100] }}>
                  {dashData?.peak_export_hour != null ? `${String(dashData.peak_export_hour).padStart(2, "0")}:00` : "--:--"}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "10px", color: "#f44336", fontWeight: 600, textTransform: "uppercase" }}>
                  Peak Import Hour
                </Typography>
                <Typography sx={{ fontSize: "18px", fontWeight: 700, color: colors.grey[100] }}>
                  {dashData?.peak_import_hour != null ? `${String(dashData.peak_import_hour).padStart(2, "0")}:00` : "--:--"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
