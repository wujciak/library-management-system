import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LogoutIcon from '@mui/icons-material/Logout';
import { AppBar, Avatar, Box, Button, Container, IconButton, ListItemIcon, Menu, MenuItem, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { currentUser, isAdmin, logout } from '../auth';

function NavButton({ to, label }: { to: string; label: string }) {
    return (
        <Button component={NavLink} to={to} end color="inherit"
                sx={{ color: 'text.secondary', '&.active': { color: 'primary.main', bgcolor: 'rgba(31,84,98,0.08)' } }}>
            {label}
        </Button>
    );
}

export default function Layout() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const user = currentUser();
    const [menu, setMenu] = useState<HTMLElement | null>(null);
    const otherLanguage = i18n.resolvedLanguage === 'pl' ? 'en' : 'pl';

    return (
        <>
            <AppBar position="sticky">
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ gap: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1} component={Link} to="/"
                               sx={{ color: 'primary.main', textDecoration: 'none', mr: 3 }}>
                            <AutoStoriesIcon />
                            <Typography variant="h6" sx={{ fontFamily: '"Literata", serif' }}>{t('app.name')}</Typography>
                        </Stack>
                        <NavButton to="/" label={t('nav.catalogue')} />
                        <NavButton to="/loans" label={isAdmin() ? t('nav.loans') : t('nav.myLoans')} />
                        {isAdmin() && <NavButton to="/admin" label={t('nav.dashboard')} />}
                        <Box sx={{ flexGrow: 1 }} />
                        <Tooltip title={t('nav.language')}>
                            <Button color="inherit" onClick={() => i18n.changeLanguage(otherLanguage)}
                                    sx={{ minWidth: 0, color: 'text.secondary' }}>
                                {otherLanguage.toUpperCase()}
                            </Button>
                        </Tooltip>
                        <IconButton onClick={(e) => setMenu(e.currentTarget)}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', fontSize: 15 }}>
                                {user?.sub.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                        <Menu anchorEl={menu} open={menu !== null} onClose={() => setMenu(null)}>
                            <MenuItem disabled>
                                <Box>
                                    <Typography fontWeight={600}>{user?.sub}</Typography>
                                    <Typography variant="body2">{t(`role.${user?.role}`)}</Typography>
                                </Box>
                            </MenuItem>
                            <MenuItem onClick={() => { logout(); navigate('/login'); }}>
                                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                                {t('nav.logout')}
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </Container>
            </AppBar>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Outlet />
            </Container>
        </>
    );
}
