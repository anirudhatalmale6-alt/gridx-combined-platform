import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  useTheme,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  SaveOutlined,
  BoltOutlined,
  RefreshOutlined,
  SendOutlined,
} from "@mui/icons-material";
import { tokens } from "../theme";
import Header from "../components/Header";
import { vendingAPI, meterTariffAPI } from "../services/api";
import { tariffGroups as mockTariffGroups, tariffConfig as mockTariffConfig } from "../services/mockData";

// ---- Block tier colors ----
const blockColors = ["#2E7D32", "#00b4d8", "#f2b705", "#db4f4a"];

// ---- Default tariff rate labels ----
const RATE_LABELS = [
  "Free / Emergency",
  "Lifeline",
  "Standard",
  "Commercial",
  "Industrial",
  "Custom 5",
  "Custom 6",
  "Custom 7",
  "Custom 8",
  "Custom 9",
];

const RATE_COLORS = [
  "#2E7D32", // 0 green
  "#66bb6a", // 1 lighter green
  "#00b4d8", // 2 blue
  "#f2b705", // 3 yellow
  "#ff7043", // 4 orange
  "#ab47bc", // 5 purple
  "#5c6bc0", // 6 indigo
  "#26a69a", // 7 teal
  "#8d6e63", // 8 brown
  "#78909c", // 9 grey-blue
];

const DEFAULT_RATES = [0.00, 1.50, 2.80, 3.50, 4.50, 2.80, 2.80, 2.80, 2.80, 2.80];

/* ================================================================
   STS TARIFFS TAB (existing content)
   ================================================================ */
function STSTariffsTab({ colors }) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [tariffGroups, setTariffGroups] = useState(mockTariffGroups);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [config, setConfig] = useState({
    vatRate: mockTariffConfig.vatRate,
    fixedCharge: mockTariffConfig.fixedCharge,
    relLevy: mockTariffConfig.relLevy,
    minPurchase: mockTariffConfig.minPurchase,
  });

  useEffect(() => {
    vendingAPI.getTariffConfig().then(r => {
      if (r.success && r.data) {
        setConfig({
          vatRate: r.data.vatRate ?? mockTariffConfig.vatRate,
          fixedCharge: r.data.fixedCharge ?? mockTariffConfig.fixedCharge,
          relLevy: r.data.relLevy ?? mockTariffConfig.relLevy,
          minPurchase: r.data.minPurchase ?? mockTariffConfig.minPurchase,
        });
      }
    }).catch(() => {});
    vendingAPI.getTariffGroups().then(r => {
      if (r.success && r.data?.length > 0) setTariffGroups(r.data);
    }).catch(() => {});
  }, []);

  const handleChange = (field) => (e) => {
    setConfig((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveConfig = async () => {
    try {
      await vendingAPI.updateTariffConfig(config);
      setSnackbar({ open: true, message: "Configuration saved", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Save failed", severity: "error" });
    }
  };

  const selectedGroup = tariffGroups[selectedTab] || tariffGroups[0];

  return (
    <>
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="5px"
      >
        {/* ---- System config card ---- */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          borderRadius="4px"
          p="20px"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mb="10px">
            System Configuration
          </Typography>
          <Box display="flex" flexDirection="column" gap="12px" flex="1">
            <TextField label="VAT Rate (%)" type="number" size="small" fullWidth value={config.vatRate} onChange={handleChange("vatRate")} />
            <TextField label="Fixed Charge (N$)" type="number" size="small" fullWidth value={config.fixedCharge} onChange={handleChange("fixedCharge")} />
            <TextField label="REL Levy (N$)" type="number" size="small" fullWidth value={config.relLevy} onChange={handleChange("relLevy")} />
            <TextField label="Min Purchase (N$)" type="number" size="small" fullWidth value={config.minPurchase} onChange={handleChange("minPurchase")} />
          </Box>
          <Button
            variant="contained"
            startIcon={<SaveOutlined />}
            onClick={handleSaveConfig}
            sx={{
              mt: "10px",
              backgroundColor: colors.greenAccent[500],
              color: "#000",
              fontWeight: 600,
              "&:hover": { backgroundColor: colors.greenAccent[600] },
            }}
          >
            Save Configuration
          </Button>
        </Box>

        {/* ---- Tariff groups tabs ---- */}
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          borderRadius="4px"
          p="20px"
          display="flex"
          flexDirection="column"
        >
          <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mb="10px">
            Tariff Groups
          </Typography>
          <Tabs
            value={selectedTab}
            onChange={(_, v) => setSelectedTab(v)}
            sx={{
              mb: "15px",
              "& .MuiTab-root": {
                color: colors.grey[300],
                textTransform: "none",
                fontWeight: 600,
                "&.Mui-selected": { color: colors.greenAccent[500] },
              },
              "& .MuiTabs-indicator": { backgroundColor: colors.greenAccent[500] },
            }}
          >
            {tariffGroups.map((g) => (
              <Tab key={g.id} label={g.name} />
            ))}
          </Tabs>
          <Box flex="1" overflow="auto">
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb="8px">
              <Box>
                <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">
                  {selectedGroup.name}
                </Typography>
                <Typography variant="body2" color={colors.grey[300]}>
                  {selectedGroup.description}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="body2" color={colors.greenAccent[500]} fontWeight="600">
                  SGC: {selectedGroup.sgc}
                </Typography>
                <Typography variant="body2" color={colors.grey[400]}>
                  {Number(selectedGroup.customerCount || 0).toLocaleString()} meters
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="caption"
              sx={{
                display: "inline-block",
                px: 1.5,
                py: 0.3,
                borderRadius: 1,
                backgroundColor: `${colors.blueAccent[500]}22`,
                color: colors.blueAccent[500],
                fontWeight: 600,
                mb: "8px",
              }}
            >
              {selectedGroup.type === "Block"
                ? "Step Tariff Blocks"
                : selectedGroup.type === "Flat"
                ? "Flat Rate Tariff"
                : "Time-of-Use Tariff"}
            </Typography>
            <Typography variant="caption" color={colors.grey[400]} display="block">
              Effective from:{" "}
              {new Date(selectedGroup.effectiveDate).toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
          </Box>
        </Box>

        {/* ---- Selected tariff blocks table ---- */}
        <Box
          gridColumn="span 12"
          gridRow="span 3"
          backgroundColor={colors.primary[400]}
          borderRadius="4px"
          overflow="auto"
        >
          <Box p="20px" pb="0">
            <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mb="10px">
              {selectedGroup.name} - Rate Blocks
            </Typography>
          </Box>
          <TableContainer sx={{ px: "20px", pb: "20px" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: colors.grey[100], fontWeight: 700, borderBottom: `1px solid ${colors.grey[700]}` }}>
                    Block Name
                  </TableCell>
                  <TableCell sx={{ color: colors.grey[100], fontWeight: 700, borderBottom: `1px solid ${colors.grey[700]}` }}>
                    Range
                  </TableCell>
                  <TableCell align="right" sx={{ color: colors.grey[100], fontWeight: 700, borderBottom: `1px solid ${colors.grey[700]}` }}>
                    Rate per kWh
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedGroup.blocks.map((block, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ borderBottom: `1px solid ${colors.grey[800]}` }}>
                      <Box display="flex" alignItems="center" gap="10px">
                        <Box
                          sx={{
                            width: 5,
                            height: 36,
                            borderRadius: "2px",
                            backgroundColor: blockColors[idx % blockColors.length],
                            flexShrink: 0,
                          }}
                        />
                        <Typography color={colors.grey[100]} fontWeight="600">
                          {block.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[300], borderBottom: `1px solid ${colors.grey[800]}` }}>
                      {block.range}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: blockColors[idx % blockColors.length],
                        fontWeight: 700,
                        fontSize: "1rem",
                        borderBottom: `1px solid ${colors.grey[800]}`,
                      }}
                    >
                      N$ {Number(block.rate).toFixed(2)}/kWh
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}

/* ================================================================
   GRIDX METER RATES TAB — GLOBAL (applies to all meters)
   ================================================================ */
function GRIDxMeterRatesTab({ colors }) {
  const isDark = useTheme().palette.mode === "dark";
  const [rates, setRates] = useState([...DEFAULT_RATES]);
  const [activeIndex, setActiveIndex] = useState(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingIndex, setSettingIndex] = useState(false);
  const [totalMeters, setTotalMeters] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Load global tariff rates on mount
  useEffect(() => {
    meterTariffAPI.getGlobalRates().then(function(res) {
      var rateValues = res.rates || [];
      if (Array.isArray(rateValues) && rateValues.length > 0) {
        setRates(rateValues.map(function(r) {
          return typeof r === "object" ? Number(r.rate || r.value || 0) : Number(r);
        }));
      }
      if (res.totalMeters !== undefined) setTotalMeters(res.totalMeters);
    }).catch(function() {
      // Use defaults on error
    }).finally(function() {
      setLoading(false);
    });
  }, []);

  const handleRateChange = (idx, value) => {
    const newRates = [...rates];
    newRates[idx] = value === "" ? "" : Number(value);
    setRates(newRates);
  };

  const handleSaveRates = async () => {
    setSaving(true);
    try {
      const numericRates = rates.map(r => r === "" ? 0 : Number(r));
      const res = await meterTariffAPI.updateRatesAll(numericRates);
      setLastResult({ type: "rates", sent: res.sent, failed: res.failed, total: res.totalMeters });
      if (res.totalMeters !== undefined) setTotalMeters(res.totalMeters);
      setSnackbar({
        open: true,
        message: "Tariff rates pushed to " + res.sent + " of " + res.totalMeters + " meters via MQTT",
        severity: res.failed > 0 ? "warning" : "success",
      });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to push rates", severity: "error" });
    }
    setSaving(false);
  };

  const handleSetActiveIndex = async () => {
    setSettingIndex(true);
    try {
      const res = await meterTariffAPI.setActiveIndexAll(activeIndex);
      setLastResult({ type: "index", sent: res.sent, failed: res.failed, total: res.totalMeters });
      if (res.totalMeters !== undefined) setTotalMeters(res.totalMeters);
      setSnackbar({
        open: true,
        message: `Tariff index ${activeIndex} (${RATE_LABELS[activeIndex]}) sent to ${res.sent} of ${res.totalMeters} meters`,
        severity: res.failed > 0 ? "warning" : "success",
      });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to set tariff index", severity: "error" });
    }
    setSettingIndex(false);
  };

  const handleResetDefaults = () => {
    setRates([...DEFAULT_RATES]);
    setSnackbar({ open: true, message: "Rates reset to defaults (not saved yet)", severity: "info" });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress sx={{ color: colors.greenAccent[500] }} />
      </Box>
    );
  }

  return (
    <>
      {/* ---- Summary banner ---- */}
      <Box
        sx={{
          backgroundColor: colors.primary[400],
          borderRadius: "8px",
          p: "16px 20px",
          mb: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <Box display="flex" alignItems="center" gap="12px">
          <Box
            sx={{
              width: 42, height: 42, borderRadius: "10px",
              bgcolor: `${colors.greenAccent[500]}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <BoltOutlined sx={{ color: colors.greenAccent[500], fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">
              Global Tariff Configuration
            </Typography>
            <Typography variant="body2" color={colors.grey[400]}>
              Changes apply to all {totalMeters} NamPower meters simultaneously
            </Typography>
          </Box>
        </Box>
        {lastResult && (
          <Chip
            label={lastResult.type === "rates"
              ? `Rates pushed: ${lastResult.sent}/${lastResult.total} meters`
              : `Index set: ${lastResult.sent}/${lastResult.total} meters`
            }
            size="small"
            sx={{
              bgcolor: lastResult.failed > 0 ? `${colors.redAccent ? colors.redAccent[500] : "#f44336"}20` : `${colors.greenAccent[500]}20`,
              color: lastResult.failed > 0 ? (colors.redAccent ? colors.redAccent[400] : "#f44336") : colors.greenAccent[400],
              fontWeight: 600,
              fontSize: "12px",
            }}
          />
        )}
      </Box>

      {/* ---- Rate table + Active index side by side ---- */}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "7fr 5fr" }} gap="16px">
        {/* ---- Tariff Rate Table ---- */}
        <Box
          sx={{
            backgroundColor: colors.primary[400],
            borderRadius: "8px",
            p: "20px",
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb="16px">
            <Box>
              <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">
                Tariff Rate Table
              </Typography>
              <Typography variant="body2" color={colors.grey[400]}>
                10 rate indices (0-9) — pushed to all meters via MQTT "trt" command
              </Typography>
            </Box>
            <Tooltip title="Reset to defaults">
              <IconButton onClick={handleResetDefaults} sx={{ color: colors.grey[400] }}>
                <RefreshOutlined />
              </IconButton>
            </Tooltip>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: colors.grey[100], fontWeight: 700, borderBottom: `1px solid ${colors.grey[700]}`, width: "60px" }}>
                    Index
                  </TableCell>
                  <TableCell sx={{ color: colors.grey[100], fontWeight: 700, borderBottom: `1px solid ${colors.grey[700]}` }}>
                    Label
                  </TableCell>
                  <TableCell sx={{ color: colors.grey[100], fontWeight: 700, borderBottom: `1px solid ${colors.grey[700]}`, width: "160px" }}>
                    Rate (N$/kWh)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rates.map((rate, idx) => (
                  <TableRow
                    key={idx}
                    sx={{
                      bgcolor: idx === activeIndex ? `${RATE_COLORS[idx]}15` : "transparent",
                      "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" },
                    }}
                  >
                    <TableCell sx={{ borderBottom: `1px solid ${colors.grey[800]}` }}>
                      <Box display="flex" alignItems="center" gap="8px">
                        <Box
                          sx={{
                            width: 4,
                            height: 28,
                            borderRadius: "2px",
                            backgroundColor: RATE_COLORS[idx],
                            flexShrink: 0,
                          }}
                        />
                        <Typography color={colors.grey[100]} fontWeight="700" fontSize="14px">
                          {idx}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${colors.grey[800]}` }}>
                      <Box display="flex" alignItems="center" gap="8px">
                        <Typography color={colors.grey[200]} fontSize="13px">
                          {RATE_LABELS[idx]}
                        </Typography>
                        {idx === activeIndex && (
                          <Chip
                            label="ACTIVE"
                            size="small"
                            sx={{
                              height: "20px",
                              fontSize: "10px",
                              fontWeight: 700,
                              bgcolor: `${colors.greenAccent[500]}25`,
                              color: colors.greenAccent[500],
                              border: `1px solid ${colors.greenAccent[500]}40`,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${colors.grey[800]}` }}>
                      <TextField
                        type="number"
                        size="small"
                        value={rate}
                        onChange={(e) => handleRateChange(idx, e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{
                          width: "130px",
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: idx === activeIndex ? `${RATE_COLORS[idx]}60` : undefined,
                            },
                          },
                          "& input": {
                            fontWeight: 600,
                            color: RATE_COLORS[idx],
                          },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
            onClick={handleSaveRates}
            disabled={saving}
            fullWidth
            sx={{
              mt: "16px",
              py: "10px",
              backgroundColor: colors.greenAccent[500],
              color: "#000",
              fontWeight: 700,
              fontSize: "14px",
              "&:hover": { backgroundColor: colors.greenAccent[600] },
              "&.Mui-disabled": { opacity: 0.5 },
            }}
          >
            {saving ? "Pushing to all meters..." : `Save & Push Rate Table to All ${totalMeters} Meters`}
          </Button>
        </Box>

        {/* ---- Right panel: Active Index + Info ---- */}
        <Box display="flex" flexDirection="column" gap="16px">
          {/* Active Tariff Index setter */}
          <Box
            sx={{
              backgroundColor: colors.primary[400],
              borderRadius: "8px",
              p: "20px",
            }}
          >
            <Typography variant="h5" color={colors.grey[100]} fontWeight="bold" mb="4px">
              Active Tariff Index
            </Typography>
            <Typography variant="body2" color={colors.grey[400]} mb="16px">
              Set which rate index all meters use — sent via MQTT "ti" command
            </Typography>

            <FormControl fullWidth size="small" sx={{ mb: "16px" }}>
              <InputLabel>Active Index</InputLabel>
              <Select
                value={activeIndex}
                label="Active Index"
                onChange={(e) => setActiveIndex(Number(e.target.value))}
              >
                {RATE_LABELS.map((label, idx) => (
                  <MenuItem key={idx} value={idx}>
                    <Box display="flex" alignItems="center" gap="10px" width="100%">
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: RATE_COLORS[idx],
                          flexShrink: 0,
                        }}
                      />
                      <Typography fontSize="13px">
                        {idx} — {label}
                      </Typography>
                      <Typography fontSize="13px" color={colors.grey[400]} ml="auto">
                        N$ {(rates[idx] === "" ? 0 : Number(rates[idx])).toFixed(2)}/kWh
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Preview selected index */}
            <Box
              sx={{
                p: "14px",
                borderRadius: "8px",
                bgcolor: `${RATE_COLORS[activeIndex]}12`,
                border: `1px solid ${RATE_COLORS[activeIndex]}30`,
                mb: "16px",
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontSize="11px" color={colors.grey[400]} textTransform="uppercase" letterSpacing="1px">
                    Selected Rate
                  </Typography>
                  <Typography fontSize="18px" fontWeight="700" color={RATE_COLORS[activeIndex]}>
                    N$ {(rates[activeIndex] === "" ? 0 : Number(rates[activeIndex])).toFixed(2)}
                    <Typography component="span" fontSize="12px" color={colors.grey[400]}> /kWh</Typography>
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    bgcolor: `${RATE_COLORS[activeIndex]}20`,
                  }}
                >
                  <BoltOutlined sx={{ color: RATE_COLORS[activeIndex], fontSize: 24 }} />
                </Box>
              </Box>
              <Typography fontSize="12px" color={colors.grey[300]} mt="4px">
                Index {activeIndex} — {RATE_LABELS[activeIndex]}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={settingIndex ? <CircularProgress size={18} color="inherit" /> : <SendOutlined />}
              onClick={handleSetActiveIndex}
              disabled={settingIndex}
              fullWidth
              sx={{
                py: "10px",
                backgroundColor: colors.blueAccent[600],
                fontWeight: 700,
                fontSize: "14px",
                "&:hover": { backgroundColor: colors.blueAccent[700] },
                "&.Mui-disabled": { opacity: 0.5 },
              }}
            >
              {settingIndex ? "Setting on all meters..." : `Set Active Index on All ${totalMeters} Meters`}
            </Button>
          </Box>

          {/* Info card */}
          <Box
            sx={{
              backgroundColor: colors.primary[400],
              borderRadius: "8px",
              p: "20px",
            }}
          >
            <Typography variant="h6" color={colors.grey[100]} fontWeight="bold" mb="12px">
              How It Works
            </Typography>
            <Box display="flex" flexDirection="column" gap="10px">
              {[
                { num: "1", text: "Edit the 10 tariff rate values (N$/kWh) for indices 0-9." },
                { num: "2", text: "Save to push the rate table to ALL NamPower meters via MQTT." },
                { num: "3", text: "Select the active index to set which rate all meters charge." },
                { num: "4", text: "Click Set Active Index to push it to all meters simultaneously." },
              ].map((step) => (
                <Box key={step.num} display="flex" gap="10px" alignItems="flex-start">
                  <Box
                    sx={{
                      minWidth: 22,
                      height: 22,
                      borderRadius: "6px",
                      bgcolor: `${colors.blueAccent[500]}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography fontSize="11px" fontWeight="700" color={colors.blueAccent[400]}>
                      {step.num}
                    </Typography>
                  </Box>
                  <Typography fontSize="12px" color={colors.grey[300]} lineHeight="1.5">
                    {step.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}

/* ================================================================
   MAIN TARIFFS PAGE
   ================================================================ */
export default function Tariffs() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [mainTab, setMainTab] = useState(0);

  return (
    <Box m="20px">
      <Header
        title="TARIFF MANAGEMENT"
        subtitle={mainTab === 0 ? "Step Tariff Configuration" : "NamPower Meter Rate Configuration"}
      />

      {/* ---- Top-level tabs ---- */}
      <Tabs
        value={mainTab}
        onChange={(_, v) => setMainTab(v)}
        sx={{
          mb: "20px",
          "& .MuiTab-root": {
            color: colors.grey[300],
            textTransform: "none",
            fontWeight: 600,
            fontSize: "14px",
            "&.Mui-selected": { color: colors.greenAccent[400] },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: colors.greenAccent[500],
            height: "3px",
            borderRadius: "3px 3px 0 0",
          },
        }}
      >
        <Tab label="STS Tariffs" />
        <Tab label="NamPower Meter Rates" />
      </Tabs>

      {mainTab === 0 && <STSTariffsTab colors={colors} />}
      {mainTab === 1 && <GRIDxMeterRatesTab colors={colors} />}
    </Box>
  );
}
