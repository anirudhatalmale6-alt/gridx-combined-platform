import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  InputBase,
  Badge,
  Avatar,
  Chip,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  DashboardOutlined,
  MapOutlined,
  BoltOutlined,
  BuildOutlined,
  Inventory2Outlined,
  SpeedOutlined,
  AccountTreeOutlined,
  PeopleOutlined,
  StorefrontOutlined,
  ReceiptLongOutlined,
  TuneOutlined,
  RequestQuoteOutlined,
  AssessmentOutlined,
  InsightsOutlined,
  AdminPanelSettingsOutlined,
  SettingsOutlined,
  NotificationsOutlined,
  SearchOutlined,
  ChevronLeft,
  ChevronRight,
  DarkModeOutlined,
  LightModeOutlined,
  KeyboardArrowDown,
  Logout,
  Person,
} from '@mui/icons-material';

const DRAWER_WIDTH = 280;
const DRAWER_COLLAPSED = 72;
const TOPBAR_HEIGHT = 64;

// Navigation configuration
const navSections = [
  {
    label: 'OVERVIEW',
    items: [
      { text: 'Dashboard', icon: DashboardOutlined, path: '/' },
      { text: 'Map & Locations', icon: MapOutlined, path: '/map' },
    ],
  },
  {
    label: 'VENDING',
    items: [
      { text: 'Vend Token', icon: BoltOutlined, path: '/vending', badge: 'LIVE' },
      { text: 'Engineering', icon: BuildOutlined, path: '/engineering' },
      { text: 'Batches', icon: Inventory2Outlined, path: '/batches' },
    ],
  },
  {
    label: 'METERS',
    items: [
      { text: 'Meter Summary', icon: SpeedOutlined, path: '/meter-summary' },
      { text: 'Grid Topology', icon: AccountTreeOutlined, path: '/topology' },
    ],
  },
  {
    label: 'CUSTOMERS & VENDORS',
    items: [
      { text: 'Customers', icon: PeopleOutlined, path: '/customers' },
      { text: 'Vendors', icon: StorefrontOutlined, path: '/vendors' },
    ],
  },
  {
    label: 'FINANCIALS',
    items: [
      { text: 'Transactions', icon: ReceiptLongOutlined, path: '/transactions' },
      { text: 'Tariff Mgmt', icon: TuneOutlined, path: '/tariffs' },
      { text: 'Billing', icon: RequestQuoteOutlined, path: '/billing' },
      { text: 'Reports', icon: AssessmentOutlined, path: '/reports' },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { text: 'Analysis', icon: InsightsOutlined, path: '/analysis' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { text: 'Admin', icon: AdminPanelSettingsOutlined, path: '/admin' },
      { text: 'Settings', icon: SettingsOutlined, path: '/settings' },
      { text: 'Notifications', icon: NotificationsOutlined, path: '/notifications' },
    ],
  },
];

// Map paths to page titles for breadcrumb
const pageTitles = {};
navSections.forEach((section) => {
  section.items.forEach((item) => {
    pageTitles[item.path] = item.text;
  });
});

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  const drawerWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const currentPageTitle = pageTitles[location.pathname] || 'Dashboard';

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0a1120' }}>
      {/* ── Sidebar ── */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          transition: 'width 0.25s ease',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#0d1526',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            transition: 'width 0.25s ease',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Brand Area */}
        <Box
          sx={{
            height: TOPBAR_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            px: collapsed ? 1.5 : 2.5,
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          {/* Logo icon - cyan gradient circle */}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00e5ff 0%, #00b0ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BoltOutlined sx={{ color: '#0d1526', fontSize: 22 }} />
          </Box>
          {!collapsed && (
            <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  letterSpacing: '0.5px',
                  background: 'linear-gradient(135deg, #00e5ff 0%, #00b0ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                }}
              >
                GRIDx
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', letterSpacing: '0.5px' }}
              >
                Smart Metering Platform
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 1 }} />

        {/* Navigation */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            py: 1,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
            },
          }}
        >
          {navSections.map((section, sIdx) => (
            <Box key={section.label} sx={{ mb: 0.5 }}>
              {/* Section Label */}
              {!collapsed && (
                <Typography
                  variant="overline"
                  sx={{
                    px: 2.5,
                    py: 1,
                    display: 'block',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '1.2px',
                    mt: sIdx > 0 ? 1 : 0,
                  }}
                >
                  {section.label}
                </Typography>
              )}
              {collapsed && sIdx > 0 && (
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', mx: 1, my: 0.5 }} />
              )}

              <List disablePadding>
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <ListItem key={item.path} disablePadding sx={{ px: 1 }}>
                      <Tooltip title={collapsed ? item.text : ''} placement="right" arrow>
                        <ListItemButton
                          onClick={() => navigate(item.path)}
                          sx={{
                            minHeight: 42,
                            borderRadius: '8px',
                            px: collapsed ? 1.5 : 2,
                            py: 0.6,
                            mb: 0.3,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            position: 'relative',
                            bgcolor: active ? 'rgba(0,229,255,0.08)' : 'transparent',
                            '&:hover': {
                              bgcolor: active
                                ? 'rgba(0,229,255,0.12)'
                                : 'rgba(255,255,255,0.04)',
                            },
                            // Active left border indicator
                            '&::before': active
                              ? {
                                  content: '""',
                                  position: 'absolute',
                                  left: 0,
                                  top: '20%',
                                  bottom: '20%',
                                  width: 3,
                                  borderRadius: '0 3px 3px 0',
                                  bgcolor: '#00e5ff',
                                }
                              : {},
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: collapsed ? 'auto' : 40,
                              color: active ? '#00e5ff' : 'rgba(255,255,255,0.5)',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon sx={{ fontSize: 22 }} />
                          </ListItemIcon>
                          {!collapsed && (
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontSize: '0.84rem',
                                fontWeight: active ? 600 : 400,
                                color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                              }}
                            />
                          )}
                          {!collapsed && item.badge && (
                            <Chip
                              label={item.badge}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                bgcolor: 'rgba(76,175,80,0.15)',
                                color: '#66bb6a',
                                border: '1px solid rgba(76,175,80,0.3)',
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ))}
        </Box>

        {/* Collapse Toggle */}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 1 }} />
        <Box sx={{ p: 1, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            size="small"
            sx={{
              color: 'rgba(255,255,255,0.4)',
              '&:hover': { color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
          </IconButton>
        </Box>

        {/* Sidebar Footer */}
        {!collapsed && (
          <Box sx={{ px: 2.5, pb: 2, pt: 0.5, flexShrink: 0 }}>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', display: 'block' }}
            >
              Pulsar Electronic Solutions
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.55rem' }}
            >
              v4.0
            </Typography>
          </Box>
        )}
      </Drawer>

      {/* ── Main Area ── */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.25s ease',
        }}
      >
        {/* Top Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            height: TOPBAR_HEIGHT,
            bgcolor: '#111b2e',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            zIndex: (theme) => theme.zIndex.drawer - 1,
          }}
        >
          <Toolbar
            sx={{
              height: TOPBAR_HEIGHT,
              minHeight: `${TOPBAR_HEIGHT}px !important`,
              px: { xs: 2, sm: 3 },
              gap: 2,
            }}
          >
            {/* Left: Page Title / Breadcrumb */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentPageTitle}
              </Typography>
            </Box>

            {/* Center: Search */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                px: 1.5,
                py: 0.3,
                width: 280,
                transition: 'border-color 0.2s',
                '&:focus-within': {
                  borderColor: 'rgba(0,229,255,0.4)',
                },
              }}
            >
              <SearchOutlined sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20, mr: 1 }} />
              <InputBase
                placeholder="Search meters, customers..."
                sx={{
                  flex: 1,
                  fontSize: '0.85rem',
                  color: '#fff',
                  '& ::placeholder': {
                    color: 'rgba(255,255,255,0.35)',
                    opacity: 1,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.2)',
                  fontSize: '0.65rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  px: 0.8,
                  py: 0.1,
                  ml: 1,
                }}
              >
                /
              </Typography>
            </Box>

            {/* Right: Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {/* Theme Toggle */}
              <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
                <IconButton
                  onClick={() => setDarkMode(!darkMode)}
                  size="small"
                  sx={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {darkMode ? (
                    <LightModeOutlined fontSize="small" />
                  ) : (
                    <DarkModeOutlined fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>

              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  onClick={() => navigate('/notifications')}
                  size="small"
                  sx={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  <Badge
                    badgeContent={3}
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: '#f44336',
                        color: '#fff',
                        fontSize: '0.65rem',
                        minWidth: 18,
                        height: 18,
                      },
                    }}
                  >
                    <NotificationsOutlined fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* User Avatar + Dropdown */}
              <Box
                onClick={handleUserMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  ml: 1,
                  cursor: 'pointer',
                  borderRadius: '10px',
                  px: 1,
                  py: 0.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'rgba(0,229,255,0.15)',
                    color: '#00e5ff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  AD
                </Avatar>
                {/* Show name only on larger screens */}
                <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                  <Typography
                    variant="body2"
                    sx={{ color: '#fff', fontWeight: 500, fontSize: '0.82rem', lineHeight: 1.2 }}
                  >
                    Admin
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}
                  >
                    Super Admin
                  </Typography>
                </Box>
                <KeyboardArrowDown
                  sx={{
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: 18,
                    display: { xs: 'none', lg: 'block' },
                  }}
                />
              </Box>

              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    bgcolor: '#152238',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    mt: 1,
                    minWidth: 180,
                    '& .MuiMenuItem-root': {
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.8)',
                      gap: 1.5,
                      py: 1,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                    },
                  },
                }}
              >
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }}>
                  <Person fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }}>
                  <SettingsOutlined fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  Settings
                </MenuItem>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                <MenuItem onClick={handleUserMenuClose}>
                  <Logout fontSize="small" sx={{ color: '#f44336' }} />
                  <Typography sx={{ color: '#f44336' }}>Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            bgcolor: '#0a1120',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
