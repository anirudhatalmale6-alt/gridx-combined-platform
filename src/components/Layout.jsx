import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../vending.css";

const NAV_ITEMS = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", route: "/", icon: "\ud83d\udcca" },
      { label: "Vend Token", route: "/vending", icon: "\u26a1", badge: "LIVE" },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      { label: "Customers", route: "/customers", icon: "\ud83d\udc65" },
      { label: "Transactions", route: "/transactions", icon: "\ud83d\udccb" },
      { label: "Vendors", route: "/vendors", icon: "\ud83c\udfea" },
    ],
  },
  {
    section: "CONFIGURATION",
    items: [
      { label: "Tariff Management", route: "/tariffs", icon: "\ud83d\udcb0" },
      { label: "Reports", route: "/reports", icon: "\ud83d\udcc8" },
      { label: "System Admin", route: "/admin", icon: "\u2699\ufe0f" },
    ],
  },
];

const PAGE_META = {
  "/": {
    title: "Dashboard",
    subtitle: "NamPower STS Prepaid Electricity Vending System",
  },
  "/vending": {
    title: "Vend Token",
    subtitle: "Generate STS prepaid electricity token (IEC 62055-41)",
  },
  "/customers": {
    title: "Customer Management",
    subtitle: "Register, search and manage STS prepaid meter accounts",
  },
  "/transactions": {
    title: "Transaction History",
    subtitle: "Full audit trail with reprint and reversal capability",
  },
  "/vendors": {
    title: "Vendor Management",
    subtitle: "Vendor channels, commissions and batch management",
  },
  "/tariffs": {
    title: "Tariff Management",
    subtitle: "Step tariff configuration and levy settings",
  },
  "/reports": {
    title: "Reports",
    subtitle: "Real-time sales, revenue and performance reports",
  },
  "/admin": {
    title: "System Administration",
    subtitle: "User management, access control and system configuration",
  },
};

const formatClock = (date) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const day = days[date.getDay()];
  const dd = date.getDate();
  const mon = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  const hh = String(hours).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${day}, ${dd} ${mon} ${year}, ${hh}:${mm}:${ss} ${ampm}`;
};

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [clock, setClock] = useState(formatClock(new Date()));

  // Auth guard
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(formatClock(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    sessionStorage.clear();
    navigate("/login");
  };

  const currentPath = location.pathname;
  const meta = PAGE_META[currentPath] || {
    title: "GRIDx",
    subtitle: "STS Vending Platform",
  };

  const userName = user?.name || user?.username || "User";
  const userInitials = getInitials(userName);

  return (
    <div className="app-shell">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            GRID<span>x</span>
          </div>
          <div className="sidebar-tagline">STS VENDING PLATFORM</div>
          <div className="sidebar-client">
            <strong>NamPower</strong>
            Namibia Power Corporation &bull; 3,000 Meters
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((section) => (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map((item) => {
                const isActive =
                  item.route === "/"
                    ? currentPath === "/"
                    : currentPath.startsWith(item.route);
                return (
                  <Link
                    key={item.route}
                    to={item.route}
                    className={`nav-item${isActive ? " active" : ""}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{userInitials}</div>
            <div className="user-info">
              <div className="name">{userName}</div>
              <div className="role">Administrator</div>
            </div>
            <button
              className="btn-sidebar-logout"
              onClick={handleLogout}
              title="Logout"
            >
              &#x2192;
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="topbar-title">{meta.title}</div>
            <div className="topbar-subtitle">{meta.subtitle}</div>
          </div>
          <div className="topbar-actions">
            <div className="status-indicator">
              <span className="status-dot online"></span>
              STS Gateway: Connected
            </div>
            <div className="status-indicator">
              <span className="status-dot online"></span>
              Server: Online
            </div>
            <div className="status-indicator mono">
              {clock}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
