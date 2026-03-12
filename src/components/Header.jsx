import { Box, Typography } from '@mui/material';

/**
 * Header - Simple page header component
 *
 * @param {string}    title    - Page title (rendered as h5, bold)
 * @param {string}    subtitle - Secondary description text (body2, muted)
 * @param {ReactNode} action   - Optional React node for action buttons (right side)
 */
export default function Header({ title, subtitle, action }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#fff',
            fontSize: '1.4rem',
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.85rem',
              mt: 0.3,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {action}
        </Box>
      )}
    </Box>
  );
}
