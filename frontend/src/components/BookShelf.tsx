import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { ScoredBook } from '../api';
import BookCard from './BookCard';

/** A titled, horizontally scrolling row of books. */
export default function BookShelf({ title, subtitle, books, loading }: {
    title: ReactNode;
    subtitle?: ReactNode;
    books?: ScoredBook[];
    loading?: boolean;
}) {
    if (!loading && !books?.length) {
        return null;
    }
    return (
        <Box sx={{ mb: 5 }}>
            <Typography variant="h5">{title}</Typography>
            {subtitle && <Typography color="text.secondary" sx={{ mb: 1 }}>{subtitle}</Typography>}
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, mx: -1 }}>
                {loading
                    ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="rounded" width={160} height={300} sx={{ flexShrink: 0 }} />)
                    : books!.map(({ book, score }) => (
                        <Box key={book.id} sx={{ width: 170, flexShrink: 0 }}>
                            <BookCard book={book} score={score} />
                        </Box>
                    ))}
            </Stack>
        </Box>
    );
}
