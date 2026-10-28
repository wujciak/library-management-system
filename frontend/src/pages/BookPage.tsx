import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Alert, Avatar, Box, Button, Chip, Divider, IconButton, Paper, Rating, Skeleton, Snackbar, Stack, TextField,
         Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage, useApi } from '../api';
import { currentUser, isAdmin } from '../auth';
import BookCover from '../components/BookCover';
import BookShelf from '../components/BookShelf';

function ReviewForm({ bookId, onAdded }: { bookId: number; onAdded: () => void }) {
    const { t } = useTranslation();
    const [score, setScore] = useState<number | null>(null);
    const [comment, setComment] = useState('');
    const [error, setError] = useState<string>();

    async function submit() {
        try {
            await api.addReview(bookId, score!, comment.trim());
            setScore(null);
            setComment('');
            onAdded();
        } catch (e) {
            setError(errorMessage(e));
        }
    }

    return (
        <Paper sx={{ p: 2.5, border: 1, borderColor: 'divider' }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>{t('review.yours')}</Typography>
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
            <Rating value={score} onChange={(_, v) => setScore(v)} size="large" />
            <TextField fullWidth multiline minRows={2} sx={{ my: 1.5 }} placeholder={t('review.placeholder')}
                       value={comment} onChange={(e) => setComment(e.target.value)} />
            <Button variant="contained" disabled={!score} onClick={submit}>{t('review.submit')}</Button>
        </Paper>
    );
}

export default function BookPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const bookId = Number(useParams().id);
    const user = currentUser();
    const book = useApi(() => api.book(bookId), [bookId]);
    const similar = useApi(() => api.similar(bookId, 8), [bookId]);
    const reviews = useApi(() => api.reviews(bookId), [bookId]);
    const [message, setMessage] = useState<{ text: string; ok: boolean }>();

    async function borrow() {
        try {
            const loan = await api.borrow(bookId);
            setMessage({ ok: true, text: t('book.borrowed', { date: new Date(loan.dueOn).toLocaleDateString(i18n.language) }) });
            book.reload();
        } catch (e) {
            setMessage({ ok: false, text: errorMessage(e) });
        }
    }

    async function removeReview(id: number) {
        await api.deleteReview(id);
        reviews.reload();
        book.reload();
    }

    if (book.error) {
        return <Alert severity="error">{errorMessage(book.error)}</Alert>;
    }
    const b = book.data;
    const reviewed = reviews.data?.some((r) => r.username === user?.sub);

    return (
        <>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>{t('book.back')}</Button>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '220px 1fr', md: '280px 1fr' }, gap: { xs: 3, md: 5 }, mb: 6 }}>
                <Box sx={{ maxWidth: 280 }}>
                    {b ? <BookCover book={b} /> : <Skeleton variant="rounded" sx={{ aspectRatio: '2 / 3', height: 'auto' }} />}
                </Box>
                <Box>
                    {b ? (
                        <>
                            {b.genre && <Chip label={t(`genre.${b.genre}`, { defaultValue: b.genre })} size="small" sx={{ mb: 1.5 }} />}
                            <Typography variant="h3" sx={{ fontSize: { xs: '2rem', md: '2.6rem' } }}>{b.title}</Typography>
                            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, mb: 1.5 }}>{b.author}</Typography>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                                <Rating readOnly precision={0.5} value={b.averageRating ?? 0} />
                                <Typography color="text.secondary">
                                    {b.averageRating ? `${b.averageRating.toFixed(1)} · ` : ''}{t('review.count', { count: b.reviewCount })}
                                </Typography>
                            </Stack>
                            {b.summary && <Typography sx={{ mb: 3, maxWidth: 720, lineHeight: 1.7 }}>{b.summary}</Typography>}
                            <Stack direction="row" spacing={4} sx={{ mb: 3, color: 'text.secondary' }}>
                                <Box><Typography variant="caption">{t('field.publisher')}</Typography><Typography color="text.primary">{b.publisher}</Typography></Box>
                                <Box><Typography variant="caption">{t('field.year')}</Typography><Typography color="text.primary">{b.publicationYear}</Typography></Box>
                                <Box><Typography variant="caption">ISBN</Typography><Typography color="text.primary">{b.isbn}</Typography></Box>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Button variant="contained" size="large" disabled={b.availableCopies === 0} onClick={borrow}>
                                    {t('book.borrow')}
                                </Button>
                                <Typography color={b.availableCopies > 0 ? 'success.main' : 'error.main'} fontWeight={500}>
                                    {b.availableCopies > 0 ? t('book.copies', { count: b.availableCopies }) : t('book.none')}
                                </Typography>
                            </Stack>
                        </>
                    ) : (
                        <Stack spacing={1}><Skeleton width="60%" height={60} /><Skeleton width="30%" /><Skeleton height={120} /></Stack>
                    )}
                </Box>
            </Box>

            <BookShelf title={t('book.similar')} subtitle={t('book.similarLead')} books={similar.data} loading={similar.loading} />

            <Divider sx={{ mb: 4 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>{t('review.title')}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 340px' }, gap: 4, alignItems: 'start' }}>
                <Stack spacing={2.5}>
                    {reviews.data?.length === 0 && <Typography color="text.secondary">{t('review.none')}</Typography>}
                    {reviews.data?.map((r) => (
                        <Stack key={r.id} direction="row" spacing={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>{r.username.charAt(0).toUpperCase()}</Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography fontWeight={600}>{r.username}</Typography>
                                    <Rating readOnly size="small" value={r.score} />
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(r.createdAt).toLocaleDateString(i18n.language)}
                                    </Typography>
                                </Stack>
                                {r.comment && <Typography sx={{ mt: 0.5 }}>{r.comment}</Typography>}
                            </Box>
                            {(r.username === user?.sub || isAdmin()) && (
                                <IconButton size="small" onClick={() => removeReview(r.id)} title={t('review.delete')}>
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Stack>
                    ))}
                </Stack>
                {reviews.data && !reviewed && <ReviewForm bookId={bookId} onAdded={() => { reviews.reload(); book.reload(); }} />}
            </Box>

            <Snackbar open={!!message} autoHideDuration={5000} onClose={() => setMessage(undefined)}>
                <Alert severity={message?.ok ? 'success' : 'error'} variant="filled" onClose={() => setMessage(undefined)}>
                    {message?.text}
                </Alert>
            </Snackbar>
        </>
    );
}
