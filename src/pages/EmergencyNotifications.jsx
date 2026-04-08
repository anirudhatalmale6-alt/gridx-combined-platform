import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  useTheme,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../theme";
import {
  LocalPolice,
  LocalHospital,
  FireTruck,
  Phone,
  LocationOn,
  Visibility,
  CheckCircle,
  PendingActions,
  AssignmentTurnedIn,
  WarningAmberOutlined,
  ReportProblemOutlined,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { notificationAPI } from "../services/api";

export default function EmergencyNotifications() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [emergencyData, setEmergencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [responseDialog, setResponseDialog] = useState({ open: false, notificationId: null, summary: "" });
  const [viewDialog, setViewDialog] = useState({ open: false, response: null });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const getEmergencyInfo = (code) => {
    const types = {
      0: { label: "Police Required", color: colors.blueAccent[500], icon: <LocalPolice sx={{ fontSize: 16 }} /> },
      1: { label: "Medical Emergency", color: colors.redAccent[500], icon: <LocalHospital sx={{ fontSize: 16 }} /> },
      2: { label: "Fire Emergency", color: colors.redAccent[700], icon: <FireTruck sx={{ fontSize: 16 }} /> },
    };
    return types[code] || { label: "Unknown", color: colors.grey[500], icon: <Phone sx={{ fontSize: 16 }} /> };
  };

  const statistics = useMemo(() => {
    const total = emergencyData.length;
    const attended = emergencyData.filter((d) => d.Responded === 1).length;
    return {
      total,
      attended,
      pending: total - attended,
      medical: emergencyData.filter((d) => d.emergency_code === 1).length,
      firePolice: emergencyData.filter((d) => d.emergency_code === 0 || d.emergency_code === 2).length,
    };
  }, [emergencyData]);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) { setLoading(true); setError(null); }
    try {
      const data = await notificationAPI.getEmergency();
      if (data && Array.isArray(data.emergencyNotifications)) {
        setEmergencyData(data.emergencyNotifications.map((n) => ({ ...n, id: n.Id })));
        setLastUpdated(new Date());
      } else {
        setEmergencyData([]);
        if (initial) setError("No emergency notifications found.");
      }
    } catch (err) {
      if (initial) { setError("Failed to fetch: " + err.message); setEmergencyData([]); }
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRespond = async () => {
    if (!responseDialog.summary.trim()) {
      setSnackbar({ open: true, message: "Please provide a summary", severity: "error" });
      return;
    }
    const userInfo = (() => { try { return JSON.parse(sessionStorage.getItem("user")); } catch { return null; } })();
    if (!userInfo?.Admin_ID) {
      setSnackbar({ open: true, message: "User info not found", severity: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await notificationAPI.respond(responseDialog.notificationId, {
        summary: responseDialog.summary,
        userId: userInfo.Admin_ID.toString(),
      });
      setSnackbar({ open: true, message: "Response submitted", severity: "success" });
      setResponseDialog({ open: false, notificationId: null, summary: "" });
      fetchData(false);
    } catch {
      setSnackbar({ open: true, message: "Failed to submit response", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      field: "DRN", headerName: "DRN", flex: 0.12, minWidth: 120,
      renderCell: ({ value }) => (
        <Box component={Link} to={`/meter/${value}`}
          sx={{ textDecoration: "none", color: colors.blueAccent[400], fontWeight: "bold", "&:hover": { color: colors.grey[100] } }}>
          {value}
        </Box>
      ),
    },
    {
      field: "emergency_code", headerName: "Emergency Type", flex: 0.15, minWidth: 140,
      renderCell: ({ value }) => {
        const info = getEmergencyInfo(value);
        return <Chip label={info.label} icon={info.icon} size="small"
          sx={{ bgcolor: info.color, color: "#fff", fontWeight: 600, fontSize: "0.75rem" }} />;
      },
    },
    {
      field: "attended", headerName: "Status", flex: 0.1, minWidth: 100,
      renderCell: ({ row }) => (
        <Chip label={row.Responded === 1 ? "Attended" : "Pending"} size="small"
          icon={row.Responded === 1 ? <CheckCircle sx={{ fontSize: 14 }} /> : <PendingActions sx={{ fontSize: 14 }} />}
          sx={{
            bgcolor: row.Responded === 1 ? colors.greenAccent[500] : "#f2b705",
            color: "#fff", fontWeight: 600, fontSize: "0.75rem",
          }} />
      ),
    },
    {
      field: "full_address", headerName: "Address", flex: 0.2, minWidth: 160,
      renderCell: ({ value }) => (
        <Box display="flex" alignItems="center" gap={1}>
          <LocationOn sx={{ color: colors.blueAccent[400], fontSize: 16 }} />
          <Typography variant="body2">{value}</Typography>
        </Box>
      ),
    },
    {
      field: "Simnumber", headerName: "Contact", flex: 0.12, minWidth: 100,
      renderCell: ({ value }) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Phone sx={{ color: colors.greenAccent[400], fontSize: 14 }} />
          <Typography variant="body2">{value}</Typography>
        </Box>
      ),
    },
    {
      field: "date_time", headerName: "Date & Time", flex: 0.15, minWidth: 140,
      renderCell: ({ value }) => {
        const d = new Date(value);
        return (
          <Box>
            <Typography variant="body2" fontWeight={500}>{d.toLocaleDateString()}</Typography>
            <Typography variant="caption" color={colors.grey[400]}>{d.toLocaleTimeString()}</Typography>
          </Box>
        );
      },
    },
    {
      field: "actions", headerName: "Actions", flex: 0.14, minWidth: 110, sortable: false,
      renderCell: ({ row }) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View Meter">
            <IconButton size="small" onClick={() => navigate(`/meter/${row.DRN}`)} sx={{ color: colors.blueAccent[400] }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.Responded === 1 ? (
            <Tooltip title="View Response">
              <IconButton size="small" sx={{ color: colors.greenAccent[400] }}
                onClick={() => setViewDialog({ open: true, response: { summary: row.Summary, respondedBy: row.Username, responseDate: row.response_time, adminId: row.Admin_ID } })}>
                <AssignmentTurnedIn fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Respond">
              <IconButton size="small" sx={{ color: "#f2b705" }}
                onClick={() => setResponseDialog({ open: true, notificationId: row.Id, summary: "" })}>
                <PendingActions fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <Box sx={{
      bgcolor: colors.primary[400], borderLeft: `4px solid ${color}`, p: 2,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" },
    }}>
      <Box>
        <Typography variant="body2" color={colors.grey[300]}>{title}</Typography>
        <Typography variant="h3" fontWeight="bold" color={colors.grey[100]}>{value}</Typography>
        <Typography variant="caption" color={colors.grey[400]}>{subtitle}</Typography>
      </Box>
      <Box sx={{ bgcolor: color, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 1 }}>
        {icon}
      </Box>
    </Box>
  );

  return (
    <Box m="20px">
      <Header title="EMERGENCY NOTIFICATIONS" subtitle="Critical emergency alerts from the meters" />

      {!loading && !error && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Total Emergencies" value={statistics.total} subtitle="All types" icon={<ReportProblemOutlined sx={{ color: "#fff" }} />} color="#f2b705" />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Attended" value={statistics.attended} subtitle="Resolved" icon={<CheckCircle sx={{ color: "#fff" }} />} color={colors.greenAccent[500]} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Pending" value={statistics.pending} subtitle="Awaiting response" icon={<PendingActions sx={{ color: "#fff" }} />} color={colors.redAccent[500]} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Medical" value={statistics.medical} subtitle="Health incidents" icon={<LocalHospital sx={{ color: "#fff" }} />} color={colors.redAccent[500]} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Fire / Police" value={statistics.firePolice} subtitle="Security & Fire" icon={<LocalPolice sx={{ color: "#fff" }} />} color={colors.blueAccent[500]} />
          </Grid>
        </Grid>
      )}

      <Box sx={{ bgcolor: colors.primary[400], p: 3, position: "relative" }}>
        {loading && (
          <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <Box textAlign="center">
              <Typography variant="h6" color={colors.greenAccent[400]} mb={2}>Loading Emergency Notifications...</Typography>
              <LinearProgress sx={{ width: 280, height: 6, bgcolor: colors.grey[700], "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent[500] } }} />
            </Box>
          </Box>
        )}

        {error && !loading && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!loading && !error && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" color={colors.grey[100]}>
                Emergency Response Dashboard ({emergencyData.length} active alerts)
              </Typography>
              {lastUpdated && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color={colors.grey[400]}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </Typography>
                  <Box sx={{
                    width: 8, height: 8, borderRadius: "50%", bgcolor: colors.greenAccent[500],
                    animation: "pulse 2s infinite",
                    "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.5 } },
                  }} />
                </Box>
              )}
            </Box>

            <Box height="600px">
              <DataGrid
                rows={emergencyData}
                columns={columns}
                initialState={{ pagination: { paginationModel: { pageSize: 15 } }, sorting: { sortModel: [{ field: "date_time", sort: "desc" }] } }}
                pageSizeOptions={[15, 25, 50]}
                checkboxSelection
                disableRowSelectionOnClick
                sx={{
                  bgcolor: colors.primary[400], color: colors.primary[100],
                  border: `1px solid ${colors.grey[700]}`,
                  "& .MuiDataGrid-cell": { borderBottom: `1px solid ${colors.grey[700]}`, fontSize: "0.85rem", py: 1 },
                  "& .MuiDataGrid-columnHeaders": { bgcolor: colors.grey[800], borderBottom: `2px solid ${colors.blueAccent[500]}`, fontWeight: "bold" },
                  "& .MuiDataGrid-virtualScroller": { bgcolor: colors.primary[400] },
                  "& .MuiDataGrid-footerContainer": { borderTop: `2px solid ${colors.grey[700]}`, bgcolor: colors.grey[800] },
                  "& .MuiCheckbox-root": { color: `${colors.greenAccent[300]} !important` },
                  "& .MuiDataGrid-row:hover": { bgcolor: colors.grey[800] },
                }}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
              />
            </Box>
          </>
        )}
      </Box>

      {/* Response Dialog */}
      <Dialog open={responseDialog.open} onClose={() => setResponseDialog({ open: false, notificationId: null, summary: "" })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.primary[400], color: colors.grey[100] }}>Respond to Emergency</DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[400], pt: 2 }}>
          <TextField fullWidth multiline rows={4} label="Response Summary"
            placeholder="Describe the actions taken..."
            value={responseDialog.summary}
            onChange={(e) => setResponseDialog((p) => ({ ...p, summary: e.target.value }))}
            sx={{
              "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] }, "&:hover fieldset": { borderColor: colors.grey[500] }, "&.Mui-focused fieldset": { borderColor: colors.blueAccent[400] } },
              "& .MuiInputLabel-root": { color: colors.grey[300] },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.primary[400], p: 2 }}>
          <Button onClick={() => setResponseDialog({ open: false, notificationId: null, summary: "" })} sx={{ color: colors.grey[300] }}>Cancel</Button>
          <Button onClick={handleRespond} disabled={submitting || !responseDialog.summary.trim()}
            sx={{ bgcolor: colors.greenAccent[500], color: "#fff", "&:hover": { bgcolor: colors.greenAccent[600] }, "&:disabled": { bgcolor: colors.grey[600] } }}>
            {submitting ? "Submitting..." : "Submit Response"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Response Dialog */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false, response: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.primary[400], color: colors.grey[100] }}>Emergency Response Details</DialogTitle>
        <DialogContent sx={{ bgcolor: colors.primary[400], pt: 2 }}>
          {viewDialog.response && (
            <Box>
              <Typography variant="body1" color={colors.grey[100]} mb={2}><strong>Summary:</strong> {viewDialog.response.summary || "No summary"}</Typography>
              <Typography variant="body2" color={colors.grey[300]} mb={1}><strong>Responded by:</strong> {viewDialog.response.respondedBy || "Unknown"} (ID: {viewDialog.response.adminId})</Typography>
              <Typography variant="body2" color={colors.grey[300]}><strong>Date:</strong> {new Date(viewDialog.response.responseDate).toLocaleString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.primary[400], p: 2 }}>
          <Button onClick={() => setViewDialog({ open: false, response: null })} sx={{ color: colors.blueAccent[400] }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
