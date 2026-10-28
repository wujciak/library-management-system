import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { Book } from '../api';

const PALETTE = ['#1f5462', '#7a3e2b', '#3f5a36', '#4b3b6b', '#8a6a1f', '#2f4858'];

/** The cover image, or a generated cover with the title when there is no image or it fails to load. */
export default function BookCover({ book, width = '100%' }: { book: Pick<Book, 'title' | 'author' | 'coverUrl'>; width?: number | string }) {
    const [failed, setFailed] = useState(false);
    const colour = PALETTE[[...book.title].reduce((h, c) => h + c.charCodeAt(0), 0) % PALETTE.length];

    return (
        <Box sx={{ width, aspectRatio: '2 / 3', borderRadius: 1.5, overflow: 'hidden', flexShrink: 0,
                   boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.08)', bgcolor: colour }}>
            {book.coverUrl && !failed ? (
                <Box component="img" src={book.coverUrl} alt={book.title} loading="lazy" onError={() => setFailed(true)}
                     sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
                <Box sx={{ height: '100%', p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                           color: 'rgba(255,255,255,0.92)', borderLeft: '6px solid rgba(0,0,0,0.18)' }}>
                    <Typography sx={{ fontFamily: '"Literata", serif', fontWeight: 600, lineHeight: 1.2, fontSize: '0.95em' }}>
                        {book.title}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>{book.author}</Typography>
                </Box>
            )}
        </Box>
    );
}
