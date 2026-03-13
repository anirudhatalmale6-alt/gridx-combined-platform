import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  SearchOutlined,
  FiberManualRecord,
  VisibilityOutlined,
  BoltOutlined,
  WaterDropOutlined,
  MyLocationOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Polyline,
} from "@react-google-maps/api";
import Header from "../components/Header";
import { tokens } from "../theme";
import { meterAPI } from "../services/api";

const GOOGLE_MAPS_KEY = "AIzaSyCdPt-Y9HoyNJF5I-sbyuS4n6U1KhKaIzk";

const MAP_CONTAINER = { width: "100%", height: "100%" };

const DEFAULT_CENTER = { lat: -22.5609, lng: 17.0658 }; // Windhoek

const MAP_OPTIONS = {
  styles: [
    { elementType: "geometry", stylers: [{ color: "#0a1628" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0a1628" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#5a6884" }] },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#141d2e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1a2640" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0e1a2b" }],
    },
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      stylers: [{ visibility: "off" }],
    },
  ],
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

/* ---- Marker icon helpers (SVG data URLs) ---- */
function meterIcon(isOnline) {
  const color = isOnline ? "%234cceac" : "%23db4f4a";
  return {
    url: `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="${decodeURIComponent(
        color
      )}" stroke="white" stroke-width="2"/><text x="14" y="18" text-anchor="middle" font-size="12" fill="white" font-weight="bold">⚡</text></svg>`
    )}`,
    scaledSize: { width: 28, height: 28, equals: () => false },
    anchor: { x: 14, y: 14, equals: () => false },
  };
}

function transformerIcon() {
  return {
    url: `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" rx="4" fill="%23f2b705" stroke="white" stroke-width="2"/><text x="16" y="21" text-anchor="middle" font-size="14" fill="white" font-weight="bold">T</text></svg>`
    )}`,
    scaledSize: { width: 32, height: 32, equals: () => false },
    anchor: { x: 16, y: 16, equals: () => false },
  };
}

/* ==================================================================== */
/* Map Page                                                             */
/* ==================================================================== */
export default function Map() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [meterLocations, setMeterLocations] = useState([]);
  const [transformers, setTransformers] = useState([]);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [selectedTransformer, setSelectedTransformer] = useState(null);
  const [connectedMeters, setConnectedMeters] = useState([]);
  const [mapRef, setMapRef] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  });

  /* ---- Fetch data ---- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [locResult, transResult] = await Promise.allSettled([
        meterAPI.getAllLocations(),
        meterAPI.getAllTransformers(),
      ]);
      if (locResult.status === "fulfilled") {
        setMeterLocations(
          Array.isArray(locResult.value) ? locResult.value : []
        );
      }
      if (transResult.status === "fulfilled") {
        setTransformers(
          Array.isArray(transResult.value) ? transResult.value : []
        );
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  /* ---- Filtered meters ---- */
  const filteredMeters = useMemo(() => {
    if (!search) return meterLocations;
    const q = search.toLowerCase();
    return meterLocations.filter(
      (m) =>
        (m.DRN || "").toLowerCase().includes(q) ||
        (m.LocationName || "").toLowerCase().includes(q)
    );
  }, [meterLocations, search]);

  /* ---- Area summary ---- */
  const areaSummary = useMemo(() => {
    const areas = {};
    meterLocations.forEach((m) => {
      const area = m.LocationName || "Unknown";
      if (!areas[area]) areas[area] = { total: 0, online: 0 };
      areas[area].total++;
      if (m.Status === "1" || m.Status === 1 || m.Status === "Active") {
        areas[area].online++;
      }
    });
    return Object.entries(areas)
      .map(([area, data]) => ({
        area,
        ...data,
        offline: data.total - data.online,
      }))
      .sort((a, b) => b.total - a.total);
  }, [meterLocations]);

  /* ---- Transformer click: load connected meters ---- */
  const handleTransformerClick = useCallback(
    async (trans) => {
      setSelectedMeter(null);
      setSelectedTransformer(trans);
      try {
        const meters = await meterAPI.getMetersByTransformer(trans.DRN);
        setConnectedMeters(Array.isArray(meters) ? meters : []);
      } catch {
        setConnectedMeters([]);
      }
    },
    []
  );

  /* ---- Map callbacks ---- */
  const onMapLoad = useCallback((map) => {
    setMapRef(map);
  }, []);

  const fitBounds = useCallback(() => {
    if (!mapRef || meterLocations.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    meterLocations.forEach((m) => {
      const lat = parseFloat(m.Lat);
      const lng = parseFloat(m.Longitude);
      if (!isNaN(lat) && !isNaN(lng)) bounds.extend({ lat, lng });
    });
    transformers.forEach((t) => {
      const lat = parseFloat(t.pLat);
      const lng = parseFloat(t.pLng);
      if (!isNaN(lat) && !isNaN(lng)) bounds.extend({ lat, lng });
    });
    mapRef.fitBounds(bounds, 60);
  }, [mapRef, meterLocations, transformers]);

  useEffect(() => {
    if (mapRef && meterLocations.length > 0) {
      fitBounds();
    }
  }, [mapRef, meterLocations.length, fitBounds]);

  /* ---- Polylines from meters to their transformer ---- */
  const polylines = useMemo(() => {
    if (!selectedTransformer || connectedMeters.length === 0) return [];
    const tLat = parseFloat(selectedTransformer.pLat);
    const tLng = parseFloat(selectedTransformer.pLng);
    if (isNaN(tLat) || isNaN(tLng)) return [];
    return connectedMeters
      .map((m) => {
        const mLat = parseFloat(m.Lat);
        const mLng = parseFloat(m.Longitude);
        if (isNaN(mLat) || isNaN(mLng)) return null;
        return [
          { lat: tLat, lng: tLng },
          { lat: mLat, lng: mLng },
        ];
      })
      .filter(Boolean);
  }, [selectedTransformer, connectedMeters]);

  if (loading) {
    return (
      <Box
        m="20px"
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress sx={{ color: colors.greenAccent[500] }} />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header
        title="MAP & LOCATIONS"
        subtitle="Geographic meter and transformer distribution"
      />

      <Box
        display="grid"
        gridTemplateColumns="300px 1fr"
        gap="5px"
        height="calc(100vh - 180px)"
      >
        {/* ---- Left sidebar ---- */}
        <Box
          backgroundColor={colors.primary[400]}
          borderRadius="4px"
          overflow="auto"
          display="flex"
          flexDirection="column"
        >
          {/* Search */}
          <Box p="10px" pb={0}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search DRN or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined
                      sx={{ color: colors.grey[400], fontSize: 18 }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Summary */}
          <Box p="10px">
            <Typography
              variant="caption"
              color={colors.grey[400]}
              fontSize="0.68rem"
              mb={1}
              display="block"
            >
              AREAS ({areaSummary.length})
            </Typography>
            {areaSummary.map((as) => (
              <Box
                key={as.area}
                mb={1}
                p={1.2}
                borderRadius="4px"
                backgroundColor="rgba(10,22,40,0.5)"
                border="1px solid rgba(255,255,255,0.05)"
              >
                <Typography
                  variant="body2"
                  color={colors.grey[100]}
                  fontWeight={600}
                  fontSize="0.82rem"
                >
                  {as.area}
                </Typography>
                <Box display="flex" gap={1.5} mt={0.3}>
                  <Box display="flex" alignItems="center" gap={0.3}>
                    <FiberManualRecord
                      sx={{ fontSize: 7, color: colors.greenAccent[500] }}
                    />
                    <Typography
                      variant="caption"
                      color={colors.greenAccent[500]}
                      fontSize="0.68rem"
                    >
                      {as.online} online
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.3}>
                    <FiberManualRecord
                      sx={{ fontSize: 7, color: colors.grey[400] }}
                    />
                    <Typography
                      variant="caption"
                      color={colors.grey[400]}
                      fontSize="0.68rem"
                    >
                      {as.offline} offline
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Legend */}
          <Box p="10px" mt="auto" borderTop="1px solid rgba(255,255,255,0.05)">
            <Typography
              variant="caption"
              color={colors.grey[400]}
              fontSize="0.68rem"
              mb={0.8}
              display="block"
            >
              LEGEND
            </Typography>
            <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: colors.greenAccent[500],
                  border: "1px solid white",
                }}
              />
              <Typography variant="caption" color={colors.grey[100]} fontSize="0.72rem">
                Meter (Online)
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#db4f4a",
                  border: "1px solid white",
                }}
              />
              <Typography variant="caption" color={colors.grey[100]} fontSize="0.72rem">
                Meter (Offline)
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "4px",
                  backgroundColor: "#f2b705",
                  border: "1px solid white",
                }}
              />
              <Typography variant="caption" color={colors.grey[100]} fontSize="0.72rem">
                Transformer
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.8}>
              <Box
                sx={{
                  width: 12,
                  height: 2,
                  backgroundColor: "#f2b705",
                }}
              />
              <Typography variant="caption" color={colors.grey[100]} fontSize="0.72rem">
                Meter-Transformer Link
              </Typography>
            </Box>
            <Box mt={1}>
              <Chip
                label="LIVE DATA"
                size="small"
                sx={{
                  bgcolor: "rgba(76,206,172,0.15)",
                  color: colors.greenAccent[500],
                  fontWeight: 700,
                  fontSize: "0.62rem",
                  height: 20,
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* ---- Map area ---- */}
        <Box
          backgroundColor={colors.primary[400]}
          borderRadius="4px"
          overflow="hidden"
          position="relative"
        >
          {/* Stats overlay */}
          <Box
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 10,
              display: "flex",
              gap: 1,
            }}
          >
            <Chip
              label={`${meterLocations.length} Meters`}
              size="small"
              sx={{
                bgcolor: "rgba(10,22,40,0.85)",
                color: colors.greenAccent[500],
                fontWeight: 600,
                fontSize: "0.72rem",
                backdropFilter: "blur(4px)",
              }}
            />
            <Chip
              label={`${transformers.length} Transformers`}
              size="small"
              sx={{
                bgcolor: "rgba(10,22,40,0.85)",
                color: "#f2b705",
                fontWeight: 600,
                fontSize: "0.72rem",
                backdropFilter: "blur(4px)",
              }}
            />
          </Box>

          {/* Recenter button */}
          <IconButton
            onClick={fitBounds}
            sx={{
              position: "absolute",
              top: 10,
              right: 60,
              zIndex: 10,
              bgcolor: "rgba(10,22,40,0.85)",
              color: colors.greenAccent[500],
              "&:hover": { bgcolor: "rgba(10,22,40,0.95)" },
              backdropFilter: "blur(4px)",
            }}
          >
            <MyLocationOutlined sx={{ fontSize: 20 }} />
          </IconButton>

          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER}
              center={DEFAULT_CENTER}
              zoom={13}
              options={MAP_OPTIONS}
              onLoad={onMapLoad}
            >
              {/* Meter markers */}
              {filteredMeters.map((m) => {
                const lat = parseFloat(m.Lat);
                const lng = parseFloat(m.Longitude);
                if (isNaN(lat) || isNaN(lng)) return null;
                const isOnline =
                  m.Status === "1" || m.Status === 1 || m.Status === "Active";
                return (
                  <Marker
                    key={`meter-${m.DRN}`}
                    position={{ lat, lng }}
                    icon={meterIcon(isOnline)}
                    onClick={() => {
                      setSelectedTransformer(null);
                      setConnectedMeters([]);
                      setSelectedMeter(m);
                    }}
                  />
                );
              })}

              {/* Transformer markers */}
              {transformers.map((t) => {
                const lat = parseFloat(t.pLat);
                const lng = parseFloat(t.pLng);
                if (isNaN(lat) || isNaN(lng)) return null;
                return (
                  <Marker
                    key={`trans-${t.DRN}`}
                    position={{ lat, lng }}
                    icon={transformerIcon()}
                    onClick={() => handleTransformerClick(t)}
                  />
                );
              })}

              {/* Polylines from transformer to connected meters */}
              {polylines.map((path, i) => (
                <Polyline
                  key={`line-${i}`}
                  path={path}
                  options={{
                    strokeColor: "#f2b705",
                    strokeOpacity: 0.7,
                    strokeWeight: 2,
                  }}
                />
              ))}

              {/* Meter InfoWindow */}
              {selectedMeter && (() => {
                const lat = parseFloat(selectedMeter.Lat);
                const lng = parseFloat(selectedMeter.Longitude);
                if (isNaN(lat) || isNaN(lng)) return null;
                const isOnline =
                  selectedMeter.Status === "1" ||
                  selectedMeter.Status === 1 ||
                  selectedMeter.Status === "Active";
                return (
                  <InfoWindow
                    position={{ lat, lng }}
                    onCloseClick={() => setSelectedMeter(null)}
                  >
                    <Box
                      sx={{
                        minWidth: 220,
                        p: 0.5,
                        color: "#0a1628",
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={0.5}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          fontFamily="monospace"
                          fontSize="0.85rem"
                        >
                          {selectedMeter.DRN}
                        </Typography>
                        <Chip
                          label={isOnline ? "Online" : "Offline"}
                          size="small"
                          sx={{
                            bgcolor: isOnline
                              ? "rgba(76,206,172,0.2)"
                              : "rgba(219,79,74,0.2)",
                            color: isOnline ? "#2a9d6a" : "#c0413c",
                            fontWeight: 600,
                            fontSize: "0.62rem",
                            height: 18,
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        color="#555"
                        display="block"
                        mb={0.3}
                      >
                        Location: {selectedMeter.LocationName || "-"}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#555"
                        display="block"
                        mb={0.3}
                      >
                        GPS: {lat.toFixed(6)}, {lng.toFixed(6)}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          pt: 0.8,
                          borderTop: "1px solid #eee",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#1976d2",
                            cursor: "pointer",
                            fontWeight: 600,
                            "&:hover": { textDecoration: "underline" },
                          }}
                          onClick={() =>
                            navigate(`/meter/${selectedMeter.DRN}`)
                          }
                        >
                          View Profile →
                        </Typography>
                      </Box>
                    </Box>
                  </InfoWindow>
                );
              })()}

              {/* Transformer InfoWindow */}
              {selectedTransformer && (() => {
                const lat = parseFloat(selectedTransformer.pLat);
                const lng = parseFloat(selectedTransformer.pLng);
                if (isNaN(lat) || isNaN(lng)) return null;
                return (
                  <InfoWindow
                    position={{ lat, lng }}
                    onCloseClick={() => {
                      setSelectedTransformer(null);
                      setConnectedMeters([]);
                    }}
                  >
                    <Box sx={{ minWidth: 220, p: 0.5, color: "#0a1628" }}>
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "2px",
                            bgcolor: "#f2b705",
                          }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          fontSize="0.85rem"
                        >
                          Transformer
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="#555"
                        display="block"
                        mb={0.2}
                      >
                        DRN: {selectedTransformer.DRN}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#555"
                        display="block"
                        mb={0.2}
                      >
                        Name: {selectedTransformer.Name || "-"}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#555"
                        display="block"
                        mb={0.2}
                      >
                        Location: {selectedTransformer.LocationName || "-"}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#555"
                        display="block"
                        mb={0.2}
                      >
                        Power Rating: {selectedTransformer.powerRating || "-"} W
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#555"
                        display="block"
                        mb={0.2}
                      >
                        City: {selectedTransformer.city || "-"}
                      </Typography>
                      {connectedMeters.length > 0 && (
                        <Box
                          sx={{
                            mt: 0.8,
                            pt: 0.8,
                            borderTop: "1px solid #eee",
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color="#333"
                            display="block"
                            mb={0.3}
                          >
                            Connected Meters ({connectedMeters.length})
                          </Typography>
                          {connectedMeters.map((cm) => (
                            <Typography
                              key={cm.DRN}
                              variant="caption"
                              sx={{
                                display: "block",
                                fontFamily: "monospace",
                                fontSize: "0.7rem",
                                color: "#1976d2",
                                cursor: "pointer",
                                "&:hover": { textDecoration: "underline" },
                              }}
                              onClick={() => navigate(`/meter/${cm.DRN}`)}
                            >
                              {cm.DRN}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </InfoWindow>
                );
              })()}
            </GoogleMap>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <CircularProgress sx={{ color: colors.greenAccent[500] }} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
