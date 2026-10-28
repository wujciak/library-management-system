import { Alert, Autocomplete, Box, Button, Grid2 as Grid, LinearProgress, MenuItem, Paper, Stack, Tab, Tabs, TextField,
         Typography } from '@mui/material';
import { FormEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api, Book, Count, errorMessage, fieldErrors, NewBook, NewUser, useApi } from '../api';

function StatCard({ label, value, alert }: { label: string; value?: number; alert?: boolean }) {
    return (
        <Paper sx={{ p: 2.5, border: 1, borderColor: alert && value ? 'error.light' : 'divider' }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="h4" color={alert && value ? 'error.main' : 'text.primary'}>{value ?? '–'}</Typography>
        </Paper>
    );
}

function Bars({ title, rows }: { title: string; rows?: Count[] }) {
    const max = Math.max(1, ...(rows ?? []).map((r) => r.count));
    return (
        <Paper sx={{ p: 2.5, border: 1, borderColor: 'divider', height: '100%' }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>{title}</Typography>
            <Stack spacing={1.5}>
                {rows?.map((r) => (
                    <Box key={r.label}>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" noWrap sx={{ mr: 2 }}>{r.label}</Typography>
                            <Typography variant="body2" color="text.secondary">{r.count}</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={(100 * r.count) / max} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} />
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}

/** Form wrapper with a submit button and the server's error message. */
function Form({ onSubmit, error, children, label }: { onSubmit: () => Promise<void>; error?: string; children: ReactNode; label: string }) {
    const [busy, setBusy] = useState(false);
    async function submit(e: FormEvent) {
        e.preventDefault();
        setBusy(true);
        await onSubmit().finally(() => setBusy(false));
    }
    return (
        <Box component="form" onSubmit={submit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2}>{children}</Grid>
            <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={busy}>{label}</Button>
        </Box>
    );
}

const EMPTY_BOOK: NewBook = { isbn: '', title: '', author: '', publisher: '', publicationYear: new Date().getFullYear(),
                              availableCopies: 1, genre: '', summary: '', coverUrl: '' };

function AddBook() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const genres = useApi(api.genres, []);
    const [book, setBook] = useState(EMPTY_BOOK);
    const [error, setError] = useState<unknown>();
    const errors = fieldErrors(error);
    const field = (name: keyof NewBook, label: string, props: object = {}) => (
        <TextField fullWidth label={label} value={book[name] ?? ''} error={!!errors[name]} helperText={errors[name]}
                   onChange={(e) => setBook({ ...book, [name]: e.target.value })} {...props} />
    );

    async function submit() {
        try {
            const created = await api.createBook({ ...book, genre: book.genre || null, summary: book.summary || null,
                                                   coverUrl: book.coverUrl || null });
            navigate(`/books/${created.id}`);
        } catch (e) {
            setError(e);
        }
    }

    return (
        <Form onSubmit={submit} error={error ? errorMessage(error) : undefined} label={t('admin.addBook')}>
            <Grid size={{ xs: 12, md: 8 }}>{field('title', t('field.title'), { required: true })}</Grid>
            <Grid size={{ xs: 12, md: 4 }}>{field('isbn', 'ISBN', { required: true })}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{field('author', t('field.author'), { required: true })}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{field('publisher', t('field.publisher'), { required: true })}</Grid>
            <Grid size={{ xs: 6, md: 3 }}>{field('publicationYear', t('field.year'), { type: 'number' })}</Grid>
            <Grid size={{ xs: 6, md: 3 }}>{field('availableCopies', t('field.copies'), { type: 'number' })}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete freeSolo options={genres.data ?? []} inputValue={book.genre ?? ''}
                              onInputChange={(_, v) => setBook({ ...book, genre: v })}
                              renderInput={(params) => <TextField {...params} label={t('field.genre')} />} />
            </Grid>
            <Grid size={12}>{field('summary', t('field.summary'), { multiline: true, minRows: 3 })}</Grid>
            <Grid size={12}>{field('coverUrl', t('field.coverUrl'), { placeholder: 'https://covers.openlibrary.org/b/isbn/…-M.jpg' })}</Grid>
        </Form>
    );
}

function AddUser({ onAdded }: { onAdded: () => void }) {
    const { t } = useTranslation();
    const empty: NewUser = { username: '', password: '', name: '', email: '', role: 'READER' };
    const [user, setUser] = useState(empty);
    const [error, setError] = useState<unknown>();
    const [done, setDone] = useState<string>();
    const errors = fieldErrors(error);
    const field = (name: keyof NewUser, label: string, props: object = {}) => (
        <TextField fullWidth required label={label} value={user[name]} error={!!errors[name]} helperText={errors[name]}
                   onChange={(e) => setUser({ ...user, [name]: e.target.value })} {...props} />
    );

    async function submit() {
        try {
            await api.createUser(user);
            setDone(user.username);
            setUser(empty);
            setError(undefined);
            onAdded();
        } catch (e) {
            setError(e);
        }
    }

    return (
        <Form onSubmit={submit} error={error ? errorMessage(error) : undefined} label={t('admin.addUser')}>
            {done && <Grid size={12}><Alert severity="success">{t('admin.userAdded', { username: done })}</Alert></Grid>}
            <Grid size={{ xs: 12, md: 6 }}>{field('username', t('field.username'))}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{field('password', t('field.password'), { type: 'password' })}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{field('name', t('field.name'))}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{field('email', t('field.email'), { type: 'email' })}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                {field('role', t('field.role'), { select: true, children: ['READER', 'ADMIN'].map((r) => <MenuItem key={r} value={r}>{t(`role.${r}`)}</MenuItem>) })}
            </Grid>
        </Form>
    );
}

function LendBook({ onLent }: { onLent: () => void }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const books = useApi(() => api.books({ q: query, available: true, page: 0, size: 20 }), [query]);
    const users = useApi(api.users, []);
    const [book, setBook] = useState<Book | null>(null);
    const [userId, setUserId] = useState('');
    const [dueOn, setDueOn] = useState('');
    const [error, setError] = useState<string>();
    const [done, setDone] = useState<string>();

    async function submit() {
        if (!book) {
            return;
        }
        try {
            await api.borrow(book.id, Number(userId), dueOn || undefined);
            setDone(book.title);
            setBook(null);
            setError(undefined);
            onLent();
        } catch (e) {
            setError(errorMessage(e));
        }
    }

    return (
        <Form onSubmit={submit} error={error} label={t('admin.lend')}>
            {done && <Grid size={12}><Alert severity="success">{t('admin.lent', { title: done })}</Alert></Grid>}
            <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete options={books.data?.content ?? []} value={book} onChange={(_, b) => setBook(b)}
                              getOptionLabel={(b) => `${b.title} — ${b.author}`} filterOptions={(x) => x}
                              onInputChange={(_, v) => setQuery(v)} isOptionEqualToValue={(a, b) => a.id === b.id}
                              renderInput={(params) => <TextField {...params} required label={t('field.book')} />} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
                <TextField select fullWidth required label={t('field.reader')} value={userId} onChange={(e) => setUserId(e.target.value)}>
                    {users.data?.map((u) => <MenuItem key={u.id} value={String(u.id)}>{u.name} ({u.username})</MenuItem>)}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
                <TextField fullWidth type="date" label={t('loan.dueOn')} value={dueOn} onChange={(e) => setDueOn(e.target.value)}
                           helperText={t('admin.dueDefault')} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
        </Form>
    );
}

export default function AdminPage() {
    const { t } = useTranslation();
    const stats = useApi(api.stats, []);
    const [tab, setTab] = useState(0);
    const s = stats.data;

    return (
        <>
            <Typography variant="h4" sx={{ mb: 3 }}>{t('nav.dashboard')}</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6, md: 2.4 }}><StatCard label={t('admin.books')} value={s?.books} /></Grid>
                <Grid size={{ xs: 6, md: 2.4 }}><StatCard label={t('admin.copiesOnShelf')} value={s?.copiesOnShelf} /></Grid>
                <Grid size={{ xs: 6, md: 2.4 }}><StatCard label={t('admin.readers')} value={s?.readers} /></Grid>
                <Grid size={{ xs: 6, md: 2.4 }}><StatCard label={t('admin.activeLoans')} value={s?.activeLoans} /></Grid>
                <Grid size={{ xs: 12, md: 2.4 }}><StatCard label={t('admin.overdue')} value={s?.overdueLoans} alert /></Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mb: 5 }}>
                <Grid size={{ xs: 12, md: 6 }}><Bars title={t('admin.mostBorrowed')} rows={s?.mostBorrowed} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><Bars title={t('admin.byGenre')} rows={s?.loansByGenre} /></Grid>
            </Grid>

            <Paper sx={{ border: 1, borderColor: 'divider' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label={t('admin.lend')} />
                    <Tab label={t('admin.addBook')} />
                    <Tab label={t('admin.addUser')} />
                </Tabs>
                <Box sx={{ p: 3 }}>
                    {tab === 0 && <LendBook onLent={stats.reload} />}
                    {tab === 1 && <AddBook />}
                    {tab === 2 && <AddUser onAdded={stats.reload} />}
                </Box>
            </Paper>
        </>
    );
}
