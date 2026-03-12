import { Box, Card, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

/**
 * StatBox - Reusable stat card component
 *
 * @param {string}    title      - Metric label (e.g. "Total Revenue")
 * @param {string}    value      - Display value (e.g. "$12,540")
 * @param {ReactNode} icon       - MUI icon element
 * @param {number}    change     - Percentage change (e.g. 12.5)
 * @param {string}    changeType - 'increase' | 'decrease'
 * @param {string}    color      - Accent color (defaults to cyan #00e5ff)
 * @param {string}    subtitle   - Optional secondary text
 */
export default function StatBox({
  title,
  value,
  icon,
  change,
  changeType = 'increase',
  color = '#00e5ff',
  subtitle,
}) {
  const isIncrease = changeType === 'increase';
  const changeColor = isIncrease ? '#66bb6a' : '#f44336';

  return (
    <Card
      sx={{
        bgcolor: '#152238',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px',
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'visible',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: 'rgba(255,255,255,0.1)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        },
      }}
    >
      {/* Top row: title + icon */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.8rem',
            fontWeight: 500,
            letterSpacing: '0.2px',
            lineHeight: 1.4,
            maxWidth: '70%',
          }}
        >
          {title}
        </Typography>

        {icon && (
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              bgcolor: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              '& .MuiSvgIcon-root': {
                fontSize: 22,
                color: color,
              },
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      {/* Value */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          fontSize: '1.75rem',
          color: '#fff',
          lineHeight: 1.2,
          mb: 1,
        }}
      >
        {value}
      </Typography>

      {/* Bottom row: change + subtitle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {change !== undefined && change !== null && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.3,
              bgcolor: `${changeColor}15`,
              borderRadius: '6px',
              px: 0.8,
              py: 0.2,
            }}
          >
            {isIncrease ? (
              <TrendingUp sx={{ fontSize: 16, color: changeColor }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: changeColor }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: changeColor,
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              {isIncrease ? '+' : '-'}{Math.abs(change)}%
            </Typography>
          </Box>
        )}

        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.72rem',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Card>
  );
}
