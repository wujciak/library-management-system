import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, MenuItem, TextField, Box } from '@mui/material';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useApi } from '../../api/ApiProvider';
import { BookDTO } from '../../api/dto/book.dto';
import { UserDTO } from '../../api/dto/user.dto';
import { useTranslation } from 'react-i18next';

type Values = { bookId: string; userId: string; dueOn: string };

/** Lends a book to any user; the due date is optional (30 days by default). */
function AddLoanForm() {
    const apiClient = useApi();
    const { t } = useTranslation();
    const [books, setBooks] = useState<BookDTO[]>([]);
    const [users, setUsers] = useState<UserDTO[]>([]);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const loadBooks = useCallback(() => {
        apiClient.getBooks().then((r) => r.data && setBooks(r.data));
    }, [apiClient]);

    useEffect(() => {
        loadBooks();
        apiClient.getUsers().then((r) => r.data && setUsers(r.data));
    }, [apiClient, loadBooks]);

    const onSubmit = useCallback(
        async (values: Values, formik: any) => {
            const response = await apiClient.borrow({
                bookId: Number(values.bookId),
                userId: Number(values.userId),
                dueOn: values.dueOn || undefined,
            });
            if (response.success && response.data) {
                formik.resetForm();
                setMessage({ ok: true, text: `${response.data.bookTitle} → ${response.data.username}` });
                loadBooks();
            } else {
                setMessage({ ok: false, text: response.error ?? t('Could not create the loan') });
            }
        },
        [apiClient, loadBooks, t]
    );

    const validationSchema = yup.object().shape({
        bookId: yup.string().required('Book is required'),
        userId: yup.string().required('User is required'),
        dueOn: yup.date().nullable(),
    });

    return (
        <Formik<Values> initialValues={{ bookId: '', userId: '', dueOn: '' }} onSubmit={onSubmit}
                        validationSchema={validationSchema}>
            {(formik) => (
                <form onSubmit={formik.handleSubmit}>
                    <Box display="flex" flexDirection="column" gap={2} minWidth={260}>
                        {message && <Alert severity={message.ok ? 'success' : 'error'}>{message.text}</Alert>}
                        <TextField
                            select
                            id="bookId"
                            name="bookId"
                            label={t("Book")}
                            value={formik.values.bookId}
                            onChange={formik.handleChange}
                            error={formik.touched.bookId && !!formik.errors.bookId}
                            helperText={formik.touched.bookId && formik.errors.bookId}
                        >
                            {books.map((b) => (
                                <MenuItem key={b.id} value={String(b.id)} disabled={b.availableCopies === 0}>
                                    {b.title} ({b.availableCopies})
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            id="userId"
                            name="userId"
                            label={t("User")}
                            value={formik.values.userId}
                            onChange={formik.handleChange}
                            error={formik.touched.userId && !!formik.errors.userId}
                            helperText={formik.touched.userId && formik.errors.userId}
                        >
                            {users.map((u) => (
                                <MenuItem key={u.id} value={String(u.id)}>{u.username} ({u.name})</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            id="dueOn"
                            name="dueOn"
                            type="date"
                            label={t("Due on")}
                            value={formik.values.dueOn}
                            onChange={formik.handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                        <Button type="submit" variant="contained" color="primary">
                            {t("Add Loan")}
                        </Button>
                    </Box>
                </form>
            )}
        </Formik>
    );
}

export default AddLoanForm;
