import { Typography, Box, useTheme } from "@mui/material";
import { tokens } from "../theme";
import Divider from '@mui/material/Divider';

const Header = ({ title, subtitle }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box mb="30px">
      <Typography
        variant="h2"
        color={colors.grey[100]}
        fontWeight="bold"
        sx={{ m: "70px 0 5px 0" }}
      >
        {title}
      </Typography>
      <Typography variant="h5" color={colors.greenAccent[400]}>
        {subtitle}
      </Typography>
      <Divider sx={{ mt: "15px", mx: "-20px", mr: "-20px", backgroundColor: colors.greenAccent[300], width: "calc(100% + 40px)" }} />
    </Box>
  );
};

export default Header;
