import { Chip } from "@mui/material";

/**
 * Small badge to indicate whether data is live (from real meters) or sample.
 * Usage: <DataBadge live /> or <DataBadge />
 */
export default function DataBadge({ live = false, sx = {} }) {
  return (
    <Chip
      label={live ? "LIVE DATA" : "SAMPLE DATA"}
      size="small"
      sx={{
        bgcolor: live ? "rgba(76,206,172,0.15)" : "rgba(242,183,5,0.15)",
        color: live ? "#2E7D32" : "#f2b705",
        fontWeight: 700,
        fontSize: "0.58rem",
        height: 18,
        letterSpacing: "0.5px",
        ...sx,
      }}
    />
  );
}
