import { Box, Card, CardActionArea, Chip, Rating, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Book } from '../api';
import BookCover from './BookCover';

/** A catalogue tile; `score` is the similarity to a search or to the reader, shown as a match badge. */
export default function BookCard({ book, score }: { book: Book; score?: number | null }) {
    const { t } = useTranslation();
    return (
        <Card sx={{ height: '100%', bgcolor: 'transparent', border: 'none' }}>
            <CardActionArea component={Link} to={`/books/${book.id}`} sx={{ p: 1, borderRadius: 2, height: '100%', alignItems: 'start' }}>
                <Box sx={{ position: 'relative' }}>
                    <BookCover book={book} />
                    {score != null && (
                        <Chip size="small" label={t('book.match', { percent: Math.round(score * 100) })}
                              sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(255,255,255,0.92)', fontWeight: 600 }} />
                    )}
                </Box>
                <Typography sx={{ mt: 1.25, fontWeight: 600, lineHeight: 1.3, display: '-webkit-box',
                                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {book.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>{book.author}</Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Rating size="small" readOnly precision={0.5} value={book.averageRating ?? 0} />
                        {book.reviewCount > 0 && <Typography variant="caption" color="text.secondary">({book.reviewCount})</Typography>}
                    </Stack>
                    <Box title={t('book.copies', { count: book.availableCopies })}
                         sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: book.availableCopies > 0 ? 'success.main' : 'error.light' }} />
                </Stack>
            </CardActionArea>
        </Card>
    );
}
