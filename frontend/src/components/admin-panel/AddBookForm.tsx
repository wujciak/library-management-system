import React, { useCallback, useState } from 'react';
import { Alert, Button, TextField, Box } from '@mui/material';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useApi } from '../../api/ApiProvider';
import { BookRequest } from '../../api/dto/book.dto';
import {useTranslation} from "react-i18next";

function AddBookForm() {
    const apiClient = useApi();
    const { t } = useTranslation();
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const onSubmit = useCallback(
        (values: BookRequest, formik: any) => {
            apiClient.createBook(values).then((response) => {
                if (response.success) {
                    formik.resetForm();
                    setMessage({ ok: true, text: `${t('Added')}: ${values.title}` });
                } else {
                    setMessage({ ok: false, text: response.error ?? t('Could not add the book') });
                }
            });
        },
        [apiClient, t]
    );

    const validationSchema = yup.object().shape({
        title: yup.string().required('Title is required'),
        author: yup.string().required('Author is required'),
        isbn: yup.string().required('ISBN is required'),
        publisher: yup.string().required('Publisher is required'),
        publicationYear: yup.number().required('Year of publish is required').integer().min(1450),
        availableCopies: yup.number().required('Available copies is required').integer().min(0)
    });

    return (
        <Formik
            initialValues={{
                title: '',
                author: '',
                isbn: '',
                publisher: '',
                publicationYear: 2020,
                availableCopies: 1
            }}
            onSubmit={onSubmit}
            validationSchema={validationSchema}
        >
            {(formik) => (
                <form onSubmit={formik.handleSubmit}>
                    <Box display="flex" flexDirection="column" gap={2}>
                        {message && <Alert severity={message.ok ? 'success' : 'error'}>{message.text}</Alert>}
                        <TextField
                            id="title"
                            label={t("Title")}
                            variant="outlined"
                            name="title"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.title}
                            error={formik.touched.title && !!formik.errors.title}
                            helperText={formik.touched.title && formik.errors.title}
                        />
                        <TextField
                            id="author"
                            label={t("Author")}
                            variant="outlined"
                            name="author"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.author}
                            error={formik.touched.author && !!formik.errors.author}
                            helperText={formik.touched.author && formik.errors.author}
                        />
                        <TextField
                            id="isbn"
                            label="ISBN"
                            variant="outlined"
                            name="isbn"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.isbn}
                            error={formik.touched.isbn && !!formik.errors.isbn}
                            helperText={formik.touched.isbn && formik.errors.isbn}
                        />
                        <TextField
                            id="publisher"
                            label={t("Publisher")}
                            variant="outlined"
                            name="publisher"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.publisher}
                            error={formik.touched.publisher && !!formik.errors.publisher}
                            helperText={formik.touched.publisher && formik.errors.publisher}
                        />
                        <TextField
                            id="publicationYear"
                            label={t("Year of Publish")}
                            variant="outlined"
                            name="publicationYear"
                            type="number"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.publicationYear}
                            error={formik.touched.publicationYear && !!formik.errors.publicationYear}
                            helperText={formik.touched.publicationYear && formik.errors.publicationYear}
                        />
                        <TextField
                            id="availableCopies"
                            label={t("Available Copies")}
                            variant="outlined"
                            name="availableCopies"
                            type="number"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.availableCopies}
                            error={formik.touched.availableCopies && !!formik.errors.availableCopies}
                            helperText={formik.touched.availableCopies && formik.errors.availableCopies}
                        />
                        <Button type="submit" variant="contained" color="primary">
                            {t("Add Book")}
                        </Button>
                    </Box>
                </form>
            )}
        </Formik>
    );
}

export default AddBookForm;
