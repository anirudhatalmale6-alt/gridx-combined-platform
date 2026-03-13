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
  ElectricMeterOutlined,
  TransformOutlined,
  OpenInNewOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
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

/* ---- Marker icon helpers (SVG data URLs with animations) ---- */
function meterIcon(isOnline) {
  const fill = isOnline ? "#4cceac" : "#db4f4a";
  const glow = isOnline ? "#4cceac" : "#db4f4a";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="grad" cx="40%" cy="35%">
        <stop offset="0%" stop-color="${isOnline ? '#70d8bd' : '#e99592'}"/>
        <stop offset="100%" stop-color="${fill}"/>
      </radialGradient>
    </defs>
    ${isOnline ? `<circle cx="22" cy="22" r="18" fill="none" stroke="${glow}" stroke-width="1.5" opacity="0.3">
      <animate attributeName="r" values="14;20;14" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="22" cy="22" r="15" fill="none" stroke="${glow}" stroke-width="1" opacity="0.2">
      <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite" begin="0.5s"/>
      <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" begin="0.5s"/>
    </circle>` : ''}
    <circle cx="22" cy="22" r="13" fill="url(#grad)" filter="url(#glow)"/>
    <circle cx="22" cy="22" r="13" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2"/>
    <path d="M19 14 L15 23 H20 L18 30 L27 20 H22 L25 14 Z" fill="white" opacity="0.95"/>
  </svg>`;
  return {
    url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    scaledSize: { width: 44, height: 44, equals: () => false },
    anchor: { x: 22, y: 22, equals: () => false },
  };
}

function transformerIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <defs>
      <filter id="tglow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="tgrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f5c537"/>
        <stop offset="100%" stop-color="#f2b705"/>
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="20" fill="none" stroke="#f2b705" stroke-width="1.5" opacity="0.2">
      <animate attributeName="r" values="16;22;16" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite"/>
    </circle>
    <rect x="8" y="8" width="32" height="32" rx="8" fill="url(#tgrad)" filter="url(#tglow)"/>
    <rect x="8" y="8" width="32" height="32" rx="8" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2"/>
    <g transform="translate(24,24)">
      <rect x="-4" y="-10" width="8" height="8" rx="1" fill="none" stroke="white" stroke-width="1.5"/>
      <rect x="-4" y="2" width="8" height="8" rx="1" fill="none" stroke="white" stroke-width="1.5"/>
      <line x1="0" y1="-2" x2="0" y2="2" stroke="white" stroke-width="1.5"/>
      <line x1="-6" y1="-6" x2="-4" y2="-6" stroke="white" stroke-width="1.5"/>
      <line x1="4" y1="-6" x2="6" y2="-6" stroke="white" stroke-width="1.5"/>
      <line x1="-6" y1="6" x2="-4" y2="6" stroke="white" stroke-width="1.5"/>
      <line x1="4" y1="6" x2="6" y2="6" stroke="white" stroke-width="1.5"/>
    </g>
  </svg>`;
  return {
    url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    scaledSize: { width: 48, height: 48, equals: () => false },
    anchor: { x: 24, y: 24, equals: () => false },
  };
}

function selectedMeterIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
    <defs>
      <filter id="sglow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="28" cy="28" r="24" fill="none" stroke="#6870fa" stroke-width="2" opacity="0.4">
      <animate attributeName="r" values="18;26;18" dur="1.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="28" cy="28" r="20" fill="none" stroke="#6870fa" stroke-width="1.5" opacity="0.3">
      <animate attributeName="r" values="16;22;16" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
      <animate attributeName="opacity" values="0.4;0;0.4" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
    </circle>
    <circle cx="28" cy="28" r="15" fill="#6870fa" filter="url(#sglow)"/>
    <circle cx="28" cy="28" r="15" fill="none" stroke="white" stroke-width="2.5"/>
    <path d="M25 18 L21 27 H26 L24 34 L33 24 H28 L31 18 Z" fill="white"/>
  </svg>`;
  return {
    url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    scaledSize: { width: 56, height: 56, equals: () => false },
    anchor: { x: 28, y: 28, equals: () => false },
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
  const [networkSearch, setNetworkSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [meterLocations, setMeterLocations] = useState([]);
  const [transformers, setTransformers] = useState([]);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [selectedTransformer, setSelectedTransformer] = useState(null);
  const [connectedMeters, setConnectedMeters] = useState([]);
  const [mapRef, setMapRef] = useState(null);
  const [networkTab, setNetworkTab] = useState("meters"); // "meters" | "transformers"
  const [expandedTrans, setExpandedTrans] = useState(null);

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

  /* ---- Filtered network items ---- */
  const filteredNetworkMeters = useMemo(() => {
    if (!networkSearch) return meterLocations;
    const q = networkSearch.toLowerCase();
    return meterLocations.filter(
      (m) =>
        (m.DRN || "").toLowerCase().includes(q) ||
        (m.LocationName || "").toLowerCase().includes(q)
    );
  }, [meterLocations, networkSearch]);

  const filteredNetworkTransformers = useMemo(() => {
    if (!networkSearch) return transformers;
    const q = networkSearch.toLowerCase();
    return transformers.filter(
      (t) =>
        (t.DRN || "").toLowerCase().includes(q) ||
        (t.Name || "").toLowerCase().includes(q) ||
        (t.city || "").toLowerCase().includes(q)
    );
  }, [transformers, networkSearch]);

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

  /* ---- Focus meter on map ---- */
  const focusMeterOnMap = useCallback(
    (meter) => {
      const lat = parseFloat(meter.Lat);
      const lng = parseFloat(meter.Longitude);
      if (isNaN(lat) || isNaN(lng) || !mapRef) return;
      mapRef.panTo({ lat, lng });
      mapRef.setZoom(17);
      setSelectedTransformer(null);
      setConnectedMeters([]);
      setSelectedMeter(meter);
    },
    [mapRef]
  );

  /* ---- Focus transformer on map ---- */
  const focusTransformerOnMap = useCallback(
    (trans) => {
      const lat = parseFloat(trans.pLat);
      const lng = parseFloat(trans.pLng);
      if (isNaN(lat) || isNaN(lng) || !mapRef) return;
      mapRef.panTo({ lat, lng });
      mapRef.setZoom(16);
      handleTransformerClick(trans);
    },
    [mapRef, handleTransformerClick]
  );

  /* ---- Expand transformer to load its meters ---- */
  const handleExpandTransformer = useCallback(
    async (trans) => {
      if (expandedTrans === trans.DRN) {
        setExpandedTrans(null);
        setConnectedMeters([]);
        return;
      }
      setExpandedTrans(trans.DRN);
      try {
        const meters = await meterAPI.getMetersByTransformer(trans.DRN);
        setConnectedMeters(Array.isArray(meters) ? meters : []);
      } catch {
        setConnectedMeters([]);
      }
    },
    [expandedTrans]
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
        gridTemplateColumns="260px 1fr 280px"
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
                const isSelected = selectedMeter && selectedMeter.DRN === m.DRN;
                return (
                  <Marker
                    key={`meter-${m.DRN}`}
                    position={{ lat, lng }}
                    icon={isSelected ? selectedMeterIcon() : meterIcon(isOnline)}
                    onClick={() => {
                      setSelectedTransformer(null);
                      setConnectedMeters([]);
                      setSelectedMeter(m);
                    }}
                    animation={isSelected ? 1 : undefined}
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
                    strokeOpacity: 0.6,
                    strokeWeight: 2.5,
                    icons: [{
                      icon: {
                        path: "M 0,-1 0,1",
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        scale: 3,
                      },
                      offset: "0",
                      repeat: "15px",
                    }],
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

        {/* ---- Right sidebar: Network Navigator ---- */}
        <Box
          backgroundColor={colors.primary[400]}
          borderRadius="4px"
          overflow="auto"
          display="flex"
          flexDirection="column"
        >
          {/* Header */}
          <Box p="10px" pb={0}>
            <Typography
              variant="caption"
              color={colors.greenAccent[500]}
              fontSize="0.72rem"
              fontWeight={700}
              letterSpacing="0.5px"
              display="block"
              mb={1}
            >
              NETWORK NAVIGATOR
            </Typography>

            {/* Search */}
            <TextField
              size="small"
              fullWidth
              placeholder="Search network..."
              value={networkSearch}
              onChange={(e) => setNetworkSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ color: colors.grey[400], fontSize: 16 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            {/* Tabs */}
            <Box display="flex" gap={0.5} mb={1}>
              <Chip
                icon={<ElectricMeterOutlined sx={{ fontSize: 14 }} />}
                label={`Meters (${filteredNetworkMeters.length})`}
                size="small"
                onClick={() => setNetworkTab("meters")}
                sx={{
                  bgcolor: networkTab === "meters" ? "rgba(76,206,172,0.2)" : "transparent",
                  color: networkTab === "meters" ? colors.greenAccent[500] : colors.grey[400],
                  fontWeight: 600,
                  fontSize: "0.68rem",
                  border: `1px solid ${networkTab === "meters" ? colors.greenAccent[700] : "rgba(255,255,255,0.08)"}`,
                  cursor: "pointer",
                }}
              />
              <Chip
                icon={<TransformOutlined sx={{ fontSize: 14 }} />}
                label={`Transformers (${filteredNetworkTransformers.length})`}
                size="small"
                onClick={() => setNetworkTab("transformers")}
                sx={{
                  bgcolor: networkTab === "transformers" ? "rgba(242,183,5,0.2)" : "transparent",
                  color: networkTab === "transformers" ? "#f2b705" : colors.grey[400],
                  fontWeight: 600,
                  fontSize: "0.68rem",
                  border: `1px solid ${networkTab === "transformers" ? "rgba(242,183,5,0.3)" : "rgba(255,255,255,0.08)"}`,
                  cursor: "pointer",
                }}
              />
            </Box>
          </Box>

          {/* Meter List */}
          {networkTab === "meters" && (
            <Box flex={1} overflow="auto" px="10px" pb="10px">
              {filteredNetworkMeters.map((m) => {
                const isOnline = m.Status === "1" || m.Status === 1 || m.Status === "Active";
                return (
                  <Box
                    key={m.DRN}
                    p={1}
                    mb={0.5}
                    borderRadius="4px"
                    backgroundColor="rgba(10,22,40,0.5)"
                    border="1px solid rgba(255,255,255,0.05)"
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: "rgba(76,206,172,0.08)",
                        borderColor: "rgba(76,206,172,0.2)",
                      },
                    }}
                    onClick={() => focusMeterOnMap(m)}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <FiberManualRecord
                          sx={{ fontSize: 8, color: isOnline ? colors.greenAccent[500] : "#db4f4a" }}
                        />
                        <Typography
                          variant="caption"
                          color={colors.grey[100]}
                          fontFamily="monospace"
                          fontSize="0.72rem"
                          fontWeight={600}
                        >
                          {m.DRN}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/meter/${m.DRN}`);
                        }}
                        sx={{ color: colors.greenAccent[500], p: 0.3 }}
                      >
                        <OpenInNewOutlined sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                    <Typography
                      variant="caption"
                      color={colors.grey[400]}
                      fontSize="0.62rem"
                      display="block"
                      mt={0.2}
                    >
                      {m.LocationName || "Unknown Location"}
                    </Typography>
                  </Box>
                );
              })}
              {filteredNetworkMeters.length === 0 && (
                <Typography variant="caption" color={colors.grey[500]} textAlign="center" display="block" mt={2}>
                  No meters found
                </Typography>
              )}
            </Box>
          )}

          {/* Transformer List */}
          {networkTab === "transformers" && (
            <Box flex={1} overflow="auto" px="10px" pb="10px">
              {filteredNetworkTransformers.map((t) => (
                <Box key={t.DRN} mb={0.5}>
                  <Box
                    p={1}
                    borderRadius="4px"
                    backgroundColor="rgba(10,22,40,0.5)"
                    border="1px solid rgba(255,255,255,0.05)"
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: "rgba(242,183,5,0.08)",
                        borderColor: "rgba(242,183,5,0.2)",
                      },
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      onClick={() => focusTransformerOnMap(t)}
                    >
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "2px",
                            bgcolor: "#f2b705",
                          }}
                        />
                        <Typography
                          variant="caption"
                          color={colors.grey[100]}
                          fontFamily="monospace"
                          fontSize="0.72rem"
                          fontWeight={600}
                        >
                          {t.DRN}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.3}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpandTransformer(t);
                          }}
                          sx={{ color: colors.grey[400], p: 0.3 }}
                        >
                          {expandedTrans === t.DRN ? (
                            <ExpandLessOutlined sx={{ fontSize: 16 }} />
                          ) : (
                            <ExpandMoreOutlined sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      color={colors.grey[400]}
                      fontSize="0.62rem"
                      display="block"
                      mt={0.2}
                    >
                      {t.Name || t.city || "Transformer"} {t.powerRating ? `· ${t.powerRating}W` : ""}
                    </Typography>
                  </Box>

                  {/* Expanded: connected meters */}
                  {expandedTrans === t.DRN && connectedMeters.length > 0 && (
                    <Box
                      ml={2}
                      mt={0.3}
                      pl={1}
                      borderLeft={`2px solid rgba(242,183,5,0.3)`}
                    >
                      {connectedMeters.map((cm) => (
                        <Box
                          key={cm.DRN}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          py={0.4}
                          px={0.5}
                          borderRadius="3px"
                          sx={{
                            cursor: "pointer",
                            "&:hover": { backgroundColor: "rgba(76,206,172,0.08)" },
                          }}
                          onClick={() => {
                            const meter = meterLocations.find((ml) => ml.DRN === cm.DRN);
                            if (meter) focusMeterOnMap(meter);
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={0.4}>
                            <BoltOutlined sx={{ fontSize: 12, color: colors.greenAccent[500] }} />
                            <Typography
                              variant="caption"
                              fontFamily="monospace"
                              fontSize="0.68rem"
                              color={colors.grey[200]}
                            >
                              {cm.DRN}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/meter/${cm.DRN}`);
                            }}
                            sx={{ color: colors.greenAccent[500], p: 0.2 }}
                          >
                            <OpenInNewOutlined sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                  {expandedTrans === t.DRN && connectedMeters.length === 0 && (
                    <Typography
                      variant="caption"
                      color={colors.grey[500]}
                      fontSize="0.6rem"
                      ml={3}
                      display="block"
                      mt={0.3}
                    >
                      No connected meters found
                    </Typography>
                  )}
                </Box>
              ))}
              {filteredNetworkTransformers.length === 0 && (
                <Typography variant="caption" color={colors.grey[500]} textAlign="center" display="block" mt={2}>
                  No transformers found
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
