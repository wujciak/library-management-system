import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import { Alert, Box, Chip, FormControlLabel, Grid2 as Grid, InputAdornment, Pagination, Paper, Skeleton, Stack, Switch,
         TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { api, Book, errorMessage, ScoredBook, useApi } from '../api';
import BookCard from '../components/BookCard';
import BookShelf from '../components/BookShelf';

const PAGE_SIZE = 24;
const EXAMPLES = ['examples.space', 'examples.detective', 'examples.markets', 'examples.lonely'];

function BookGrid({ books, loading }: { books?: ScoredBook[]; loading: boolean }) {
    return (
        <Grid container spacing={1}>
            {loading
                ? Array.from({ length: 12 }, (_, i) => (
                    <Grid key={i} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}><Skeleton variant="rounded" height={300} /></Grid>
                ))
                : books?.map(({ book, score }) => (
                    <Grid key={book.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}><BookCard book={book} score={score} /></Grid>
                ))}
        </Grid>
    );
}

const unscored = (books: Book[]): ScoredBook[] => books.map((book) => ({ book, score: null }));

export default function CataloguePage() {
    const { t } = useTranslation();
    const [params, setParams] = useSearchParams();
    const semantic = params.get('mode') === 'ai';
    const q = params.get('q') ?? '';
    const genre = params.get('genre') ?? undefined;
    const available = params.get('available') === 'true';
    const page = Number(params.get('page') ?? 1);
    const [input, setInput] = useState(q);
    useEffect(() => setInput(q), [q]);

    const browsing = !semantic || !q;
    const catalogue = useApi(() => api.books({ q, genre, available, page: page - 1, size: PAGE_SIZE }),
        [q, genre, available, page], !semantic);
    const results = useApi(() => api.search(q, 24), [q], semantic && !!q);
    const genres = useApi(api.genres, []);
    const showRecommended = !q && !genre && page === 1;
    const recommended = useApi(() => api.recommended(12), [], showRecommended);

    function update(changes: Record<string, string | undefined>) {
        const next = new URLSearchParams(params);
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        if (!('page' in changes)) {
            next.delete('page');
        }
        setParams(next);
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        update({ q: input.trim() || undefined });
    }

    return (
        <>
            <Paper sx={{ p: { xs: 2.5, md: 4 }, mb: 4, border: 1, borderColor: 'divider',
                         background: 'linear-gradient(120deg, #ffffff 0%, #f1ece3 100%)' }}>
                <Typography variant="h4" sx={{ mb: 0.5 }}>{t('catalogue.title')}</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    {semantic ? t('catalogue.semanticLead') : t('catalogue.lead')}
                </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} component="form" onSubmit={submit}>
                    <TextField fullWidth value={input} onChange={(e) => setInput(e.target.value)}
                               placeholder={semantic ? t('catalogue.semanticPlaceholder') : t('catalogue.placeholder')}
                               slotProps={{ input: { sx: { bgcolor: 'white' }, startAdornment: (
                                   <InputAdornment position="start">{semantic ? <AutoAwesomeIcon color="secondary" /> : <SearchIcon />}</InputAdornment>
                               ) } }} />
                    <ToggleButtonGroup exclusive value={semantic ? 'ai' : 'text'} sx={{ bgcolor: 'white', flexShrink: 0 }}
                                       onChange={(_, mode) => mode && update({ mode: mode === 'ai' ? 'ai' : undefined, genre: undefined })}>
                        <ToggleButton value="text" sx={{ px: 2 }}>{t('catalogue.modeText')}</ToggleButton>
                        <ToggleButton value="ai" sx={{ px: 2, gap: 0.75 }}><AutoAwesomeIcon fontSize="small" />{t('catalogue.modeSemantic')}</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
                {semantic ? (
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>{t('catalogue.try')}</Typography>
                        {EXAMPLES.map((key) => (
                            <Chip key={key} label={t(key)} variant="outlined" onClick={() => update({ q: t(key) })} />
                        ))}
                    </Stack>
                ) : (
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mt: 2 }}>
                        <Chip label={t('catalogue.allGenres')} color={genre ? 'default' : 'primary'} onClick={() => update({ genre: undefined })} />
                        {genres.data?.map((g) => (
                            <Chip key={g} label={t(`genre.${g}`, { defaultValue: g })} color={g === genre ? 'primary' : 'default'} variant={g === genre ? 'filled' : 'outlined'}
                                  onClick={() => update({ genre: g === genre ? undefined : g })} />
                        ))}
                        <FormControlLabel sx={{ ml: 1 }} label={t('catalogue.onlyAvailable')}
                                          control={<Switch checked={available} onChange={(e) => update({ available: e.target.checked ? 'true' : undefined })} />} />
                    </Stack>
                )}
            </Paper>

            {browsing && showRecommended && (
                <BookShelf loading={recommended.loading} books={recommended.data?.books}
                           title={recommended.data?.basis === 'POPULAR' ? t('catalogue.popular') : t('catalogue.forYou')}
                           subtitle={recommended.data?.basis === 'POPULAR' ? t('catalogue.popularLead') : t('catalogue.forYouLead')} />
            )}

            {semantic ? (
                q && (
                    <Box>
                        <Typography variant="h5" sx={{ mb: 2 }}>{t('catalogue.resultsFor', { q })}</Typography>
                        {results.error ? <Alert severity="warning">{errorMessage(results.error)}</Alert>
                            : <BookGrid books={results.data} loading={results.loading} />}
                    </Box>
                )
            ) : (
                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
                        <Typography variant="h5">{q ? t('catalogue.resultsFor', { q }) : genre ? t(`genre.${genre}`, { defaultValue: genre }) : t('catalogue.all')}</Typography>
                        {catalogue.data && <Typography color="text.secondary">{t('catalogue.count', { count: catalogue.data.totalElements })}</Typography>}
                    </Stack>
                    {!!catalogue.error && <Alert severity="error">{errorMessage(catalogue.error)}</Alert>}
                    <BookGrid books={catalogue.data && unscored(catalogue.data.content)} loading={catalogue.loading} />
                    {catalogue.data && catalogue.data.totalPages > 1 && (
                        <Pagination sx={{ mt: 4, display: 'flex', justifyContent: 'center' }} color="primary"
                                    count={catalogue.data.totalPages} page={page}
                                    onChange={(_, p) => { update({ page: String(p) }); window.scrollTo({ top: 0 }); }} />
                    )}
                </Box>
            )}
        </>
    );
}
