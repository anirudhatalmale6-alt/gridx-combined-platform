import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layout
import Layout from "./components/Layout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vending from "./pages/Vending";
import Customers from "./pages/Customers";
import Transactions from "./pages/Transactions";
import Vendors from "./pages/Vendors";
import Engineering from "./pages/Engineering";
import Batches from "./pages/Batches";
import Tariffs from "./pages/Tariffs";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import Map from "./pages/Map";
import MeterProfile from "./pages/MeterProfile";
import MeterSummary from "./pages/MeterSummary";
import Topology from "./pages/Topology";
import Analysis from "./pages/Analysis";
import Billing from "./pages/Billing";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes wrapped in Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vending" element={<Vending />} />
          <Route path="customers" element={<Customers />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="engineering" element={<Engineering />} />
          <Route path="batches" element={<Batches />} />
          <Route path="tariffs" element={<Tariffs />} />
          <Route path="reports" element={<Reports />} />
          <Route path="admin" element={<Admin />} />
          <Route path="map" element={<Map />} />
          <Route path="meter/:drn" element={<MeterProfile />} />
          <Route path="meter-summary" element={<MeterSummary />} />
          <Route path="topology" element={<Topology />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="billing" element={<Billing />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
