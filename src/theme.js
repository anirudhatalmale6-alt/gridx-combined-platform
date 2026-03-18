import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// color design tokens export
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#e0e0e0", 200: "#c2c2c2", 300: "#a3a3a3", 400: "#858585",
          500: "#666666", 600: "#525252", 700: "#3d3d3d", 800: "#292929", 900: "#141414",
        },
        primary: {
          100: "#d0d5d1", 200: "#a1aba4", 300: "#728177", 400: "#1a2e1f",
          500: "#0d1a11", 600: "#0a150e", 700: "#08100a", 800: "#050b07", 900: "#030604",
        },
        greenAccent: {
          100: "#c8e6c9", 200: "#a5d6a7", 300: "#81c784", 400: "#66bb6a",
          500: "#2E7D32", 600: "#1B5E20", 700: "#145218", 800: "#0d3b10", 900: "#062508",
        },
        redAccent: {
          100: "#f8dcdb", 200: "#f1b9b7", 300: "#e99592", 400: "#e2726e",
          500: "#db4f4a", 600: "#af3f3b", 700: "#832f2c", 800: "#58201e", 900: "#2c100f",
        },
        blueAccent: {
          100: "#fef8e7", 200: "#fcedc5", 300: "#f7dc8a", 400: "#f0ca4f",
          500: "#D4A843", 600: "#b08b35", 700: "#8c6e28", 800: "#68511c", 900: "#443410",
        },
        yellowAccent: {
          100: "#fef8e7", 200: "#fcedc5", 300: "#f7dc8a", 400: "#f0ca4f",
          500: "#D4A843", 600: "#b08b35", 700: "#8c6e28", 800: "#68511c", 900: "#443410",
        },
        outline: { 100: "#FFD0D0", 500: "#eeeedd", 900: "#2E7D32" },
        card: { 100: "#08100a" },
        label: { 100: "#FBFBFB", 900: "#1C1C1C" },
      }
    : {
        grey: {
          100: "#141414", 200: "#292929", 300: "#3d3d3d", 400: "#525252",
          500: "#666666", 600: "#858585", 700: "#a3a3a3", 800: "#c2c2c2", 900: "#e0e0e0",
        },
        primary: {
          100: "#030604", 200: "#050b07", 300: "#08100a", 400: "#E8F0E9",
          500: "#0d1a11", 600: "#1a2e1f", 700: "#728177", 800: "#a1aba4", 900: "#F5F7F5",
        },
        greenAccent: {
          100: "#062508", 200: "#0d3b10", 300: "#145218", 400: "#1B5E20",
          500: "#2E7D32", 600: "#66bb6a", 700: "#81c784", 800: "#a5d6a7", 900: "#c8e6c9",
        },
        redAccent: {
          100: "#2c100f", 200: "#58201e", 300: "#832f2c", 400: "#af3f3b",
          500: "#db4f4a", 600: "#e2726e", 700: "#e99592", 800: "#f1b9b7", 900: "#f8dcdb",
        },
        blueAccent: {
          100: "#443410", 200: "#68511c", 300: "#8c6e28", 400: "#b08b35",
          500: "#D4A843", 600: "#f0ca4f", 700: "#f7dc8a", 800: "#fcedc5", 900: "#fef8e7",
        },
        yellowAccent: {
          100: "#443410", 200: "#68511c", 300: "#8c6e28", 400: "#b08b35",
          500: "#D4A843", 600: "#f0ca4f", 700: "#f7dc8a", 800: "#fcedc5", 900: "#fef8e7",
        },
        outline: { 100: "#FF9EAA", 500: "#443355", 900: "#2E7D32" },
        card: { 100: "#fcedc5" },
        label: { 100: "#1C1C1C", 900: "#FBFBFB" },
      }),
});

// mui theme settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            primary: { main: colors.primary[500] },
            secondary: { main: colors.greenAccent[500] },
            neutral: { dark: colors.grey[700], main: colors.grey[500], light: colors.grey[100] },
            background: { default: colors.primary[500] },
          }
        : {
            primary: { main: colors.primary[100] },
            secondary: { main: colors.greenAccent[500] },
            neutral: { dark: colors.grey[700], main: colors.grey[500], light: colors.grey[100] },
            background: { default: colors.primary[900] },
          }),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s',
            '&:hover': { transform: 'scale(1.02)', backgroundColor: 'transparent' },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { "&.Mui-focused $notchedOutline": { borderColor: colors.label[900] } },
        },
      },
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 40 },
      h2: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 32 },
      h3: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 24 },
      h4: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 20 },
      h5: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 16 },
      h6: { fontFamily: ["Source Sans Pro", "sans-serif"].join(","), fontSize: 14 },
    },
  };
};

// context for color mode
export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useMode = () => {
  const [mode, setMode] = useState("dark");
  const colorMode = useMemo(
    () => ({ toggleColorMode: () => setMode((prev) => (prev === "light" ? "dark" : "light")) }),
    []
  );
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode];
};
