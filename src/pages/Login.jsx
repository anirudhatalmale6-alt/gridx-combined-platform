import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Link,
  Grid,
  useTheme,
} from "@mui/material";
import { bgBlur } from "../css";
import { tokens } from "../theme";
import { useAuth } from "../context/AuthContext";
import logoImage from "../assets/logo.png";

export default function Login() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ Email: "", Password: "" });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.Email.trim()) errors.Email = "Email Address is required";
    if (!formData.Password || formData.Password.length < 4)
      errors.Password = "Password is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setFormErrors({});

    try {
      await login(formData.Email, formData.Password);
      navigate("/");
    } catch (err) {
      setFormErrors({ general: err.message || "Incorrect email or password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        width: "100%",
        height: "100vh",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundImage:
          'url("https://static.wixstatic.com/media/9c7957_fe36476a7254414199bc39e191905939~mv2.png/v1/crop/x_470,y_211,w_980,h_658,q_90,enc_auto/9c7957_fe36476a7254414199bc39e191905939~mv2.png")',
        borderRadius: 0,
      }}
    >
      <Container
        component="main"
        maxWidth="xs"
        sx={{
          ...bgBlur({
            color: theme.palette.background.default,
          }),
          borderRadius: "15px",
          padding: "10px",
        }}
      >
        <Box
          sx={{
            mt: 4,
            mb: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img src={logoImage} alt="GRIDx Logo" width="100" height="100" />

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1, width: "100%", px: 2 }}
          >
            {formErrors.general && (
              <Alert
                severity="error"
                onClose={() =>
                  setFormErrors((prev) => ({ ...prev, general: "" }))
                }
                sx={{ mb: 2 }}
              >
                {formErrors.general}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="Email"
              label="Email Address"
              name="Email"
              autoComplete="email"
              autoFocus
              value={formData.Email}
              onChange={handleInputChange}
              error={!!formErrors.Email}
              helperText={formErrors.Email}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="Password"
              label="Password"
              type="password"
              id="Password"
              autoComplete="current-password"
              value={formData.Password}
              onChange={handleInputChange}
              error={!!formErrors.Password}
              helperText={formErrors.Password}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.3 }}
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Signing In...</span>
                </Box>
              ) : (
                "Sign In"
              )}
            </Button>

            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2" sx={{ color: colors.greenAccent[400] }}>
                  Forgot Password?
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            color: colors.grey[400],
            fontSize: "11px",
            mb: 2,
          }}
        >
          &copy; 2026 Pulsar Electronic Solutions | GRIDx
        </Typography>
      </Container>
    </Paper>
  );
}
