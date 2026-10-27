import React, { useCallback, useState } from 'react';
import { Alert, Button, MenuItem, TextField, Box } from '@mui/material';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useApi } from '../../api/ApiProvider';
import { CreateUserDTO } from '../../api/dto/user.dto';
import { useTranslation } from "react-i18next";

const FIELDS: { name: keyof CreateUserDTO; label: string; type?: string }[] = [
    { name: 'username', label: 'Username' },
    { name: 'password', label: 'Password', type: 'password' },
    { name: 'name', label: 'Name' },
    { name: 'email', label: 'Email' },
];

function AddUserForm() {
    const apiClient = useApi();
    const { t } = useTranslation();
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const onSubmit = useCallback(
        (values: CreateUserDTO, formik: any) => {
            apiClient.createUser(values).then((response) => {
                if (response.success) {
                    formik.resetForm();
                    setMessage({ ok: true, text: `${t('Added')}: ${values.username}` });
                } else {
                    setMessage({ ok: false, text: response.error ?? t('Could not add the user') });
                }
            });
        },
        [apiClient, t]
    );

    const validationSchema = yup.object().shape({
        username: yup.string().required('Username is required'),
        password: yup.string().required('Password is required').min(8, 'At least 8 characters'),
        role: yup.string().oneOf(['ADMIN', 'READER']).required(),
        name: yup.string().required('Name is required'),
        email: yup.string().email('Invalid email format').required('Email is required'),
    });

    const initialValues: CreateUserDTO = { username: '', password: '', role: 'READER', name: '', email: '' };

    return (
        <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
            {(formik) => (
                <form onSubmit={formik.handleSubmit}>
                    <Box display="flex" flexDirection="column" gap={2}>
                        {message && <Alert severity={message.ok ? 'success' : 'error'}>{message.text}</Alert>}
                        {FIELDS.map(({ name, label, type }) => (
                            <TextField
                                key={name}
                                id={name}
                                name={name}
                                type={type}
                                label={t(label)}
                                variant="outlined"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values[name]}
                                error={formik.touched[name] && !!formik.errors[name]}
                                helperText={formik.touched[name] && formik.errors[name]}
                            />
                        ))}
                        <TextField
                            select
                            id="role"
                            name="role"
                            label={t("Role")}
                            value={formik.values.role}
                            onChange={formik.handleChange}
                        >
                            <MenuItem value="READER">{t("Reader")}</MenuItem>
                            <MenuItem value="ADMIN">{t("Admin")}</MenuItem>
                        </TextField>
                        <Button type="submit" variant="contained" color="primary">
                            {t("Add User")}
                        </Button>
                    </Box>
                </form>
            )}
        </Formik>
    );
}

export default AddUserForm;
