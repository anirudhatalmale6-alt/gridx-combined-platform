import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// Color design tokens
const tokens = {
  grey: {
    100: "#e0e0e0",
    200: "#c2c2c2",
    300: "#a3a3a3",
    400: "#858585",
    500: "#666666",
    600: "#525252",
    700: "#3d3d3d",
    800: "#292929",
    900: "#141414",
  },
  primary: {
    100: "#d0f4ff",
    200: "#a1e9ff",
    300: "#72deff",
    400: "#43d3ff",
    500: "#00b4d8",
    600: "#0090ad",
    700: "#006c82",
    800: "#004856",
    900: "#00242b",
  },
  greenAccent: {
    100: "#dbf5ee",
    200: "#b7ebde",
    300: "#94e2cd",
    400: "#70d8bd",
    500: "#4cceac",
    600: "#3da58a",
    700: "#2e7c67",
    800: "#1e5245",
    900: "#0f2922",
  },
  redAccent: {
    100: "#f8dcdb",
    200: "#f1b9b7",
    300: "#e99592",
    400: "#e2726e",
    500: "#db4f4a",
    600: "#af3f3b",
    700: "#832f2c",
    800: "#58201e",
    900: "#2c100f",
  },
  blueAccent: {
    100: "#e1e2fe",
    200: "#c3c6fd",
    300: "#a4a9fc",
    400: "#868dfb",
    500: "#6870fa",
    600: "#535ac8",
    700: "#3e4396",
    800: "#2a2d64",
    900: "#151632",
  },
  yellowAccent: {
    100: "#fdf3cd",
    200: "#fbe79b",
    300: "#f8db69",
    400: "#f6cf37",
    500: "#f2b705",
    600: "#c29304",
    700: "#916e03",
    800: "#614902",
    900: "#302501",
  },
};

// Theme settings for dark mode
const themeSettings = () => ({
  palette: {
    mode: "dark",
    primary: {
      main: tokens.primary[500],
      light: tokens.primary[300],
      dark: tokens.primary[700],
      contrastText: "#ffffff",
    },
    secondary: {
      main: tokens.greenAccent[500],
      light: tokens.greenAccent[300],
      dark: tokens.greenAccent[700],
      contrastText: "#ffffff",
    },
    error: {
      main: tokens.redAccent[500],
      light: tokens.redAccent[300],
      dark: tokens.redAccent[700],
    },
    warning: {
      main: tokens.yellowAccent[500],
      light: tokens.yellowAccent[300],
      dark: tokens.yellowAccent[700],
    },
    info: {
      main: tokens.blueAccent[500],
      light: tokens.blueAccent[300],
      dark: tokens.blueAccent[700],
    },
    success: {
      main: tokens.greenAccent[500],
      light: tokens.greenAccent[300],
      dark: tokens.greenAccent[700],
    },
    background: {
      default: "#0a1628",
      paper: "#111b2e",
    },
    text: {
      primary: "#e0e0e0",
      secondary: "#a0aec0",
    },
    divider: "rgba(30, 58, 95, 0.6)",
    neutral: {
      dark: tokens.grey[700],
      main: tokens.grey[500],
      light: tokens.grey[100],
    },
  },
  typography: {
    fontFamily: ["'Inter'", "'Source Sans 3'", "sans-serif"].join(","),
    fontSize: 13,
    h1: {
      fontFamily: ["'Inter'", "'Source Sans 3'", "sans-serif"].join(","),
      fontSize: 36,
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: ["'Inter'", "'Source Sans 3'", "sans-serif"].join(","),
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontFamily: ["'Inter'", "'Source Sans 3'", "sans-serif"].join(","),
      fontSize: 22,
      fontWeight: 600,
    },
    h4: {
      fontFamily: ["'Inter'", "'Source Sans 3'", "sans-serif"].join(","),
      fontSize: 18,
      fontWeight: 600,
    },
    h5: {
      fontFamily: ["'Inter'", "'Source Sans 3'", "sans-serif"].join(","),
      fontSize: 15,
      fontWeight: 600,
    },
    h6: {
      fontFamily: ["'Inter'", "'Source Sans 3'", "sans-serif"].join(","),
      fontSize: 13,
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: 14,
      fontWeight: 500,
      color: "#a0aec0",
    },
    subtitle2: {
      fontSize: 12,
      fontWeight: 500,
      color: "#a0aec0",
    },
    body1: {
      fontSize: 14,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: 13,
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      fontSize: 13,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 20px",
          fontWeight: 600,
          fontSize: 13,
          textTransform: "none",
          boxShadow: "none",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0, 180, 216, 0.25)",
            transform: "translateY(-1px)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #00b4d8 0%, #0090ad 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #43d3ff 0%, #00b4d8 100%)",
          },
        },
        containedSecondary: {
          background: "linear-gradient(135deg, #4cceac 0%, #3da58a 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #70d8bd 0%, #4cceac 100%)",
          },
        },
        outlined: {
          borderColor: "rgba(0, 180, 216, 0.5)",
          "&:hover": {
            borderColor: "#00b4d8",
            backgroundColor: "rgba(0, 180, 216, 0.08)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(17, 27, 46, 0.85)",
          backgroundImage: "none",
          border: "1px solid #1e3a5f",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            borderColor: "rgba(0, 180, 216, 0.3)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#111b2e",
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        },
        elevation2: {
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
        },
        elevation3: {
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            backgroundColor: "rgba(10, 22, 40, 0.6)",
            "& fieldset": {
              borderColor: "rgba(30, 58, 95, 0.8)",
              transition: "border-color 0.2s ease",
            },
            "&:hover fieldset": {
              borderColor: "rgba(0, 180, 216, 0.5)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#00b4d8",
              borderWidth: 2,
            },
          },
          "& .MuiInputLabel-root": {
            color: "#a0aec0",
            "&.Mui-focused": {
              color: "#00b4d8",
            },
          },
          "& .MuiInputBase-input": {
            color: "#e0e0e0",
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "1px solid #1e3a5f",
          borderRadius: 12,
          backgroundColor: "rgba(17, 27, 46, 0.6)",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#1a2540",
            borderBottom: "2px solid #1e3a5f",
            color: "#e0e0e0",
            fontSize: 13,
            fontWeight: 600,
          },
          "& .MuiDataGrid-columnHeader": {
            "&:focus, &:focus-within": {
              outline: "none",
            },
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(30, 58, 95, 0.4)",
            color: "#e0e0e0",
            fontSize: 13,
            "&:focus": {
              outline: "none",
            },
          },
          "& .MuiDataGrid-row": {
            transition: "background-color 0.15s ease",
            "&:hover": {
              backgroundColor: "rgba(0, 180, 216, 0.06)",
            },
            "&.Mui-selected": {
              backgroundColor: "rgba(0, 180, 216, 0.12)",
              "&:hover": {
                backgroundColor: "rgba(0, 180, 216, 0.16)",
              },
            },
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "2px solid #1e3a5f",
            backgroundColor: "#1a2540",
          },
          "& .MuiCheckbox-root": {
            color: "#a0aec0",
            "&.Mui-checked": {
              color: "#00b4d8",
            },
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: "#a0aec0",
          },
          "& .MuiTablePagination-root": {
            color: "#a0aec0",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(17, 27, 46, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(30, 58, 95, 0.6)",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.3)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#0d1a2d",
          borderRight: "1px solid rgba(30, 58, 95, 0.6)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#1a2540",
          border: "1px solid #1e3a5f",
          borderRadius: 6,
          fontSize: 12,
          color: "#e0e0e0",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: 12,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#1e3a5f #0a1628",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            width: 8,
            height: 8,
          },
          "&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
            background: "#0a1628",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            backgroundColor: "#1e3a5f",
            borderRadius: 4,
            border: "2px solid #0a1628",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
            {
              backgroundColor: "#2a4a6f",
            },
        },
      },
    },
  },
});

// Color mode context for potential theme toggling
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

// Hook to use the mode
export const useMode = () => {
  const [mode, setMode] = useState("dark");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings()), [mode]);

  return [theme, colorMode];
};

// Export tokens for use in components
export { tokens };

// Default export: pre-built dark theme
const theme = createTheme(themeSettings());
export default theme;
