import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LanguageIcon from '@mui/icons-material/Language';
import RecommendIcon from '@mui/icons-material/Recommend';
import { Alert, Box, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { currentUser, saveToken } from '../auth';

const DEMO = [
    { username: 'reader', password: 'reader123' },
    { username: 'admin', password: 'admin123' },
];

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState(false);

    if (currentUser()) {
        return <Navigate to="/" replace />;
    }

    async function signIn(name: string, pass: string) {
        setBusy(true);
        setFailed(false);
        try {
            saveToken(await api.login(name, pass));
            navigate('/');
        } catch {
            setFailed(true);
        } finally {
            setBusy(false);
        }
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        signIn(username, password);
    }

    const features = [
        { icon: <AutoAwesomeIcon />, text: t('login.featureSearch') },
        { icon: <LanguageIcon />, text: t('login.featureLanguages') },
        { icon: <RecommendIcon />, text: t('login.featureRecommendations') },
    ];

    return (
        <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' } }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'center', p: 8,
                       color: 'white', background: 'linear-gradient(150deg, #1f5462 0%, #163b45 60%, #2b2a3a 100%)' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
                    <AutoStoriesIcon fontSize="large" />
                    <Typography variant="h4">{t('app.name')}</Typography>
                </Stack>
                <Typography variant="h3" sx={{ mb: 2, maxWidth: 520 }}>{t('login.headline')}</Typography>
                <Typography sx={{ opacity: 0.8, mb: 5, maxWidth: 480 }}>{t('login.lead')}</Typography>
                <Stack spacing={2}>
                    {features.map((f) => (
                        <Stack key={f.text} direction="row" spacing={1.5} alignItems="center" sx={{ opacity: 0.9 }}>
                            {f.icon}
                            <Typography>{f.text}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper component="form" onSubmit={submit} sx={{ p: 4, width: '100%', maxWidth: 400, border: 1, borderColor: 'divider' }}>
                    <Typography variant="h5" sx={{ mb: 3 }}>{t('login.title')}</Typography>
                    <Stack spacing={2}>
                        {failed && <Alert severity="error">{t('login.failed')}</Alert>}
                        <TextField label={t('field.username')} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
                        <TextField label={t('field.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <Button type="submit" variant="contained" size="large" disabled={busy}>{t('login.submit')}</Button>
                    </Stack>
                    <Divider sx={{ my: 3 }}>{t('login.demo')}</Divider>
                    <Stack direction="row" spacing={1}>
                        {DEMO.map((d) => (
                            <Button key={d.username} fullWidth variant="outlined" disabled={busy} onClick={() => signIn(d.username, d.password)}>
                                {t(`login.as.${d.username}`)}
                            </Button>
                        ))}
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}
