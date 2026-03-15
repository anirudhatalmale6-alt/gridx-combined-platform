import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../vending.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-grid"></div>

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="brand">
            GRID<span>x</span>
          </div>
          <div className="tagline">BY PULSAR ELECTRONIC SOLUTIONS</div>
          <div className="powered">
            Procurement No: <strong>NCS/ONB/NPWR-03/2026</strong>
          </div>
        </div>

        {/* Subtitle Box */}
        <div className="login-subtitle">
          <p>
            <strong>NamPower STS Prepaid Electricity Vending System</strong>
          </p>
          <p>
            IEC 62055-41 Compliant | Web-Based | 24/7 Real-Time Operations
          </p>
        </div>

        {/* Error Display */}
        {error && <div className="login-error">{error}</div>}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">USERNAME</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              "Authenticating..."
            ) : (
              <>&#9889; Sign In</>
            )}
          </button>
        </form>

        {/* Footer - Cert Badges */}
        <div className="login-footer">
          <div style={{ marginBottom: "12px" }}>
            <span className="login-cert-badge">&#10003; IEC 62055-41</span>
            <span className="login-cert-badge">&#10003; STS Compliant</span>
            <span className="login-cert-badge">&#10003; SSL Secured</span>
          </div>
          <p>GRIDx Vending Platform v3.2.1</p>
          <p>&copy; 2026 Pulsar Electronic Solutions</p>
        </div>
      </div>
    </div>
  );
}
