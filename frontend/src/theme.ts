import { createTheme } from '@mui/material/styles';

const border = '#e6dfd4';

export const theme = createTheme({
    palette: {
        primary: { main: '#1f5462' },
        secondary: { main: '#b8643a' },
        background: { default: '#f7f4ee', paper: '#ffffff' },
        text: { primary: '#1c2b31', secondary: '#5d6a70' },
        divider: border,
    },
    shape: { borderRadius: 12 },
    typography: {
        fontFamily: '"Inter", system-ui, sans-serif',
        h1: { fontFamily: '"Literata", Georgia, serif', fontWeight: 600 },
        h2: { fontFamily: '"Literata", Georgia, serif', fontWeight: 600 },
        h3: { fontFamily: '"Literata", Georgia, serif', fontWeight: 600 },
        h4: { fontFamily: '"Literata", Georgia, serif', fontWeight: 600 },
        h5: { fontFamily: '"Literata", Georgia, serif', fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
        MuiAppBar: {
            defaultProps: { elevation: 0, color: 'inherit' },
            styleOverrides: {
                root: { borderBottom: `1px solid ${border}`, backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' },
            },
        },
        MuiCard: {
            defaultProps: { elevation: 0 },
            styleOverrides: { root: { border: `1px solid ${border}` } },
        },
        MuiPaper: { defaultProps: { elevation: 0 } },
        MuiButton: { defaultProps: { disableElevation: true } },
        MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
        MuiTableCell: { styleOverrides: { head: { fontWeight: 600, color: '#5d6a70' } } },
    },
});
