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
  Card,
  CardContent,
  Avatar,
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
  TrendingUp,
  CheckCircle,
  PendingActions,
  AssignmentTurnedIn,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { emergencyAPI } from "../services/api";

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

  const getUserInfo = () => {
    try {
      const userInfo = sessionStorage.getItem("user");
      return userInfo ? JSON.parse(userInfo) : null;
    } catch {
      return null;
    }
  };

  const getEmergencyInfo = (code) => {
    const emergencyTypes = {
      0: { label: "Police Required", color: colors.blueAccent[500], icon: <LocalPolice />, severity: "info" },
      1: { label: "Medical Emergency", color: colors.redAccent[500], icon: <LocalHospital />, severity: "error" },
      2: { label: "Fire Emergency", color: colors.redAccent[700], icon: <FireTruck />, severity: "error" },
    };
    return emergencyTypes[code] || { label: "Unknown", color: colors.grey[500], icon: <Phone />, severity: "default" };
  };

  const statistics = useMemo(() => {
    const totalEmergencies = emergencyData.length;
    const attendedEmergencies = emergencyData.filter((item) => item.Responded === 1).length;
    const pendingEmergencies = totalEmergencies - attendedEmergencies;
    const policeRequired = emergencyData.filter((item) => item.emergency_code === 0).length;
    const medicalEmergencies = emergencyData.filter((item) => item.emergency_code === 1).length;
    const fireEmergencies = emergencyData.filter((item) => item.emergency_code === 2).length;

    return { totalEmergencies, attendedEmergencies, pendingEmergencies, policeRequired, medicalEmergencies, fireEmergencies };
  }, [emergencyData]);

  const fetchEmergencyNotifications = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await emergencyAPI.getNotifications();
      if (data && Array.isArray(data.emergencyNotifications)) {
        const mappedData = data.emergencyNotifications.map((n) => ({ ...n, id: n.Id || n.ID }));
        setEmergencyData(mappedData);
        setLastUpdated(new Date());
      } else {
        setEmergencyData([]);
        if (isInitialLoad) setError("No emergency notifications found.");
      }
    } catch (err) {
      if (isInitialLoad) {
        setError("Failed to fetch emergency notifications: " + err.message);
        setEmergencyData([]);
      }
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencyNotifications(true);
    const intervalId = setInterval(() => fetchEmergencyNotifications(false), 30000);
    return () => clearInterval(intervalId);
  }, [fetchEmergencyNotifications]);

  const handleRespond = async () => {
    if (!responseDialog.summary.trim()) {
      setSnackbar({ open: true, message: "Please provide a summary", severity: "error" });
      return;
    }
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.Admin_ID) {
      setSnackbar({ open: true, message: "User information not found", severity: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await emergencyAPI.respond(responseDialog.notificationId, userInfo.Admin_ID.toString(), responseDialog.summary);
      setSnackbar({ open: true, message: "Response submitted successfully", severity: "success" });
      setResponseDialog({ open: false, notificationId: null, summary: "" });
      fetchEmergencyNotifications(false);
    } catch {
      setSnackbar({ open: true, message: "Failed to submit response", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Card
      sx={{
        height: "100%",
        backgroundColor: colors.primary[400],
        borderLeft: `4px solid ${color}`,
        borderRadius: 0,
        transition: "all 0.3s ease",
        "&:hover": { transform: "translateY(-4px)", borderLeftWidth: "6px" },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color={colors.grey[300]} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={colors.grey[100]}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color={colors.grey[400]} mt={1}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUp fontSize="small" sx={{ color: colors.greenAccent[400], mr: 0.5 }} />
                <Typography variant="body2" color={colors.greenAccent[400]}>
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56, borderRadius: 0 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const columns = [
    {
      field: "DRN",
      headerName: "DRN",
      flex: 0.12,
      minWidth: 120,
      renderCell: ({ value }) => (
        <Box
          component={Link}
          to={`/meter/${value}`}
          sx={{
            textDecoration: "none",
            color: colors.blueAccent[400],
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1,
            padding: "4px 8px",
            transition: "all 0.2s ease",
            "&:hover": { backgroundColor: colors.blueAccent[800], color: colors.grey[100] },
          }}
        >
          {value}
        </Box>
      ),
    },
    {
      field: "emergency_code",
      headerName: "Emergency Type",
      flex: 0.15,
      minWidth: 140,
      renderCell: ({ value }) => {
        const info = getEmergencyInfo(value);
        return <Chip label={info.label} icon={info.icon} sx={{ backgroundColor: info.color, color: colors.grey[100], fontWeight: "bold" }} />;
      },
    },
    {
      field: "attended",
      headerName: "Status",
      flex: 0.1,
      minWidth: 100,
      renderCell: ({ row }) => (
        <Chip
          label={row.Responded === 1 ? "Attended" : "Pending"}
          icon={row.Responded === 1 ? <CheckCircle /> : <PendingActions />}
          sx={{
            backgroundColor: row.Responded === 1 ? colors.greenAccent[500] : colors.yellowAccent[500],
            color: colors.grey[100],
            fontWeight: "bold",
          }}
        />
      ),
    },
    {
      field: "full_address",
      headerName: "Address",
      flex: 0.2,
      minWidth: 160,
      renderCell: ({ value }) => (
        <Box display="flex" alignItems="center" gap={1}>
          <LocationOn sx={{ color: colors.blueAccent[400], fontSize: "18px" }} />
          <Typography variant="body2" fontWeight="medium">{value}</Typography>
        </Box>
      ),
    },
    {
      field: "Simnumber",
      headerName: "Contact",
      flex: 0.12,
      minWidth: 100,
      renderCell: ({ value }) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Phone sx={{ color: colors.greenAccent[400], fontSize: "16px" }} />
          <Typography variant="body2">{value}</Typography>
        </Box>
      ),
    },
    {
      field: "date_time",
      headerName: "Date & Time",
      flex: 0.15,
      minWidth: 140,
      renderCell: ({ value }) => {
        const date = new Date(value);
        return (
          <Box>
            <Typography variant="body2" fontWeight="medium">{date.toLocaleDateString()}</Typography>
            <Typography variant="caption" color={colors.grey[400]}>{date.toLocaleTimeString()}</Typography>
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.16,
      minWidth: 130,
      sortable: false,
      renderCell: ({ row }) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View Meter Details">
            <IconButton size="small" onClick={() => navigate(`/meter/${row.DRN}`)} sx={{ color: colors.blueAccent[400] }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.Responded === 1 ? (
            <Tooltip title="View Response">
              <IconButton
                size="small"
                onClick={() =>
                  setViewDialog({
                    open: true,
                    response: { summary: row.Summary, respondedBy: row.Username, responseDate: row.response_time, adminId: row.Admin_ID },
                  })
                }
                sx={{ color: colors.greenAccent[400] }}
              >
                <AssignmentTurnedIn fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Respond to Emergency">
              <IconButton
                size="small"
                onClick={() => setResponseDialog({ open: true, notificationId: row.Id || row.ID, summary: "" })}
                sx={{ color: colors.yellowAccent[400] }}
              >
                <PendingActions fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="Emergency Notifications" subtitle="Critical emergency alerts from the meters" />

      {/* Statistics Cards */}
      {!loading && !error && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Total Emergencies" value={statistics.totalEmergencies} subtitle="All emergency types" icon={<Phone />} color={colors.yellowAccent[500]} trend="Active monitoring" />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Attended" value={statistics.attendedEmergencies} subtitle="Resolved incidents" icon={<CheckCircle />} color={colors.greenAccent[500]} trend="Completed" />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Pending" value={statistics.pendingEmergencies} subtitle="Awaiting response" icon={<PendingActions />} color={colors.redAccent[500]} trend="Requires attention" />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Medical" value={statistics.medicalEmergencies} subtitle="Health incidents" icon={<LocalHospital />} color={colors.redAccent[500]} trend="Critical priority" />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard title="Fire/Police" value={statistics.fireEmergencies + statistics.policeRequired} subtitle="Security & Fire" icon={<FireTruck />} color={colors.blueAccent[500]} trend="High priority" />
          </Grid>
        </Grid>
      )}

      <Box
        sx={{
          backgroundColor: colors.primary[400],
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading && (
          <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
            <Box textAlign="center">
              <Typography variant="h5" color={colors.greenAccent[400]} mb={2}>Loading Emergency Notifications...</Typography>
              <LinearProgress sx={{ width: 300, height: 8, backgroundColor: colors.grey[700], "& .MuiLinearProgress-bar": { backgroundColor: colors.greenAccent[500] } }} />
            </Box>
          </Box>
        )}

        {error && !loading && (
          <Box p={3}>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          </Box>
        )}

        {!loading && !error && (
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight="bold" color={colors.grey[100]}>
                Emergency Response Dashboard ({emergencyData.length} active alerts)
              </Typography>
              {lastUpdated && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color={colors.grey[400]}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </Typography>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: colors.greenAccent[500],
                      animation: "pulse 2s infinite",
                      "@keyframes pulse": { "0%": { opacity: 1 }, "50%": { opacity: 0.5 }, "100%": { opacity: 1 } },
                    }}
                  />
                </Box>
              )}
            </Box>

            <Box height="600px">
              <DataGrid
                rows={emergencyData}
                columns={columns}
                initialState={{
                  pagination: { paginationModel: { pageSize: 15 } },
                  sorting: { sortModel: [{ field: "date_time", sort: "desc" }] },
                }}
                pageSizeOptions={[15, 25, 50, 100]}
                checkboxSelection
                disableRowSelectionOnClick
                sx={{
                  backgroundColor: colors.primary[400],
                  color: colors.primary[100],
                  border: `1px solid ${colors.grey[600]}`,
                  "& .MuiDataGrid-cell": { borderBottom: `1px solid ${colors.grey[700]}`, fontSize: "0.875rem", py: 1 },
                  "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.grey[800], borderBottom: `2px solid ${colors.blueAccent[500]}`, fontSize: "0.9rem", fontWeight: "bold" },
                  "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
                  "& .MuiDataGrid-footerContainer": { borderTop: `2px solid ${colors.grey[700]}`, backgroundColor: colors.grey[800] },
                  "& .MuiCheckbox-root": { color: `${colors.greenAccent[300]} !important` },
                  "& .MuiButton-root": { color: colors.primary[100] },
                  "& .MuiDataGrid-row:hover": { backgroundColor: colors.grey[800] },
                }}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Response Dialog */}
      <Dialog open={responseDialog.open} onClose={() => setResponseDialog({ open: false, notificationId: null, summary: "" })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: colors.primary[400], color: colors.grey[100] }}>Respond to Emergency</DialogTitle>
        <DialogContent sx={{ backgroundColor: colors.primary[400], pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Response Summary"
            placeholder="Describe the actions taken to address this emergency..."
            value={responseDialog.summary}
            onChange={(e) => setResponseDialog((prev) => ({ ...prev, summary: e.target.value }))}
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] }, "&:hover fieldset": { borderColor: colors.grey[500] }, "&.Mui-focused fieldset": { borderColor: colors.blueAccent[400] } },
              "& .MuiInputLabel-root": { color: colors.grey[300] },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.primary[400], p: 2 }}>
          <Button onClick={() => setResponseDialog({ open: false, notificationId: null, summary: "" })} sx={{ color: colors.grey[300] }}>Cancel</Button>
          <Button onClick={handleRespond} disabled={submitting || !responseDialog.summary.trim()} sx={{ backgroundColor: colors.greenAccent[500], color: colors.grey[100], "&:hover": { backgroundColor: colors.greenAccent[600] }, "&:disabled": { backgroundColor: colors.grey[600] } }}>
            {submitting ? "Submitting..." : "Submit Response"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Response Dialog */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false, response: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: colors.primary[400], color: colors.grey[100] }}>Emergency Response Details</DialogTitle>
        <DialogContent sx={{ backgroundColor: colors.primary[400], pt: 2 }}>
          {viewDialog.response && (
            <Box>
              <Typography variant="body1" color={colors.grey[100]} mb={2}>
                <strong>Summary:</strong> {viewDialog.response.summary || "No summary provided"}
              </Typography>
              <Typography variant="body2" color={colors.grey[300]} mb={1}>
                <strong>Responded by:</strong> {viewDialog.response.respondedBy || "Unknown"} (ID: {viewDialog.response.adminId})
              </Typography>
              <Typography variant="body2" color={colors.grey[300]}>
                <strong>Response Date:</strong> {new Date(viewDialog.response.responseDate).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.primary[400], p: 2 }}>
          <Button onClick={() => setViewDialog({ open: false, response: null })} sx={{ color: colors.blueAccent[400] }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
