import { Alert, Box, Button, Chip, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
         Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api, errorMessage, Loan, useApi } from '../api';
import { isAdmin } from '../auth';
import BookCover from '../components/BookCover';

function Status({ loan }: { loan: Loan }) {
    const { t } = useTranslation();
    if (loan.returnedOn) {
        return <Chip size="small" label={t('loan.returned')} />;
    }
    return loan.overdue
        ? <Chip size="small" color="error" label={t('loan.overdue')} />
        : <Chip size="small" color="success" variant="outlined" label={t('loan.active')} />;
}

export default function LoansPage() {
    const { t, i18n } = useTranslation();
    const admin = isAdmin();
    const loans = useApi(api.loans, []);
    const [tab, setTab] = useState<'active' | 'all'>('active');
    const [error, setError] = useState<string>();
    const date = (d: string | null) => (d ? new Date(d).toLocaleDateString(i18n.language) : '—');
    const shown = loans.data?.filter((l) => tab === 'all' || !l.returnedOn) ?? [];

    async function markReturned(id: number) {
        try {
            await api.returnLoan(id);
            loans.reload();
        } catch (e) {
            setError(errorMessage(e));
        }
    }

    return (
        <>
            <Typography variant="h4" sx={{ mb: 0.5 }}>{admin ? t('nav.loans') : t('nav.myLoans')}</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{admin ? t('loan.adminLead') : t('loan.readerLead')}</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(undefined)}>{error}</Alert>}
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab value="active" label={t('loan.tabActive')} />
                <Tab value="all" label={t('loan.tabAll')} />
            </Tabs>
            <TableContainer component={Paper} sx={{ border: 1, borderColor: 'divider' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('field.book')}</TableCell>
                            {admin && <TableCell>{t('field.reader')}</TableCell>}
                            <TableCell>{t('loan.borrowedOn')}</TableCell>
                            <TableCell>{t('loan.dueOn')}</TableCell>
                            <TableCell>{t('loan.status')}</TableCell>
                            {admin && <TableCell />}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {shown.map((l) => (
                            <TableRow key={l.id} hover>
                                <TableCell>
                                    <Stack direction="row" spacing={2} alignItems="center" component={Link} to={`/books/${l.bookId}`}
                                           sx={{ color: 'inherit', textDecoration: 'none' }}>
                                        <BookCover book={{ title: l.bookTitle, author: '', coverUrl: l.bookCoverUrl }} width={36} />
                                        <Typography fontWeight={500}>{l.bookTitle}</Typography>
                                    </Stack>
                                </TableCell>
                                {admin && <TableCell>{l.username}</TableCell>}
                                <TableCell>{date(l.borrowedOn)}</TableCell>
                                <TableCell>{date(l.dueOn)}</TableCell>
                                <TableCell><Status loan={l} /></TableCell>
                                {admin && (
                                    <TableCell align="right">
                                        {!l.returnedOn && <Button size="small" variant="outlined" onClick={() => markReturned(l.id)}>{t('loan.markReturned')}</Button>}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!loans.loading && shown.length === 0 && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">{t('loan.none')}</Typography>
                        <Button component={Link} to="/" sx={{ mt: 1 }}>{t('loan.browse')}</Button>
                    </Box>
                )}
            </TableContainer>
        </>
    );
}
