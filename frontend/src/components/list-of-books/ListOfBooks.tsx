import React, { useState, useEffect, useCallback, ChangeEvent, MouseEvent } from 'react';
import './ListOfBooks.css';
import { BookDTO } from "../../api/dto/book.dto";
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    TextField,
    TablePagination,
    Button,
    Alert
} from '@mui/material';
import MenuAppBar from "../menu-app-bar/MenuAppBar";
import { useApi } from "../../api/ApiProvider";
import {useTranslation} from "react-i18next";

function ListOfBooks() {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [books, setBooks] = useState<BookDTO[]>([]);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
    const apiClient = useApi();
    const { t } = useTranslation();

    const loadBooks = useCallback(() => {
        apiClient.getBooks().then(response => {
            if (response.success && response.data) {
                setBooks(response.data);
            } else {
                console.error('Failed to fetch books');
            }
        });
    }, [apiClient]);

    useEffect(loadBooks, [loadBooks]);

    const handleBorrow = (book: BookDTO) => {
        apiClient.borrow({ bookId: book.id }).then(response => {
            setMessage(response.success && response.data
                ? { ok: true, text: `${t('Borrowed')}: ${book.title}, ${t('due')} ${response.data.dueOn}` }
                : { ok: false, text: response.error ?? t('Could not borrow the book') });
            loadBooks();
        });
    };

    const handlePageChange = (event: MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const filteredBooks = books.filter(book =>
        book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <MenuAppBar/>
            <Box sx={{marginTop: 4, padding: 2}}>
                <Typography variant="h4" gutterBottom>
                    {t('List Of Books')}
                </Typography>
                {message && (
                    <Alert severity={message.ok ? 'success' : 'error'} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
                        {message.text}
                    </Alert>
                )}
                <Box display="flex" alignItems="center" mb={2}>
                    <SearchIcon sx={{marginRight: 1}} />
                    <TextField
                        variant="outlined"
                        fullWidth
                        placeholder={t("Search books by title or ISBN")}
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </Box>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t("Title")}</TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center">
                                        <PersonIcon sx={{marginRight: 1}}/> {t("Author")}
                                    </Box>
                                </TableCell>
                                <TableCell>ISBN</TableCell>
                                <TableCell>{t("Publisher")}</TableCell>
                                <TableCell>{t("Year of Publish")}</TableCell>
                                <TableCell>{t("Available Copies")}</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(rowsPerPage > 0
                                    ? filteredBooks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : filteredBooks
                            ).map(book => (
                                <TableRow key={book.id} className={book.availableCopies === 0 ? "unavailable" : ""}>
                                    <TableCell>{book.title}</TableCell>
                                    <TableCell>{book.author}</TableCell>
                                    <TableCell>{book.isbn}</TableCell>
                                    <TableCell>{book.publisher}</TableCell>
                                    <TableCell>{book.publicationYear}</TableCell>
                                    <TableCell>{book.availableCopies}</TableCell>
                                    <TableCell>
                                        <Button size="small" variant="outlined" disabled={book.availableCopies === 0}
                                                onClick={() => handleBorrow(book)}>
                                            {t("Borrow")}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filteredBooks.length}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>
        </Box>
    );
}

export default ListOfBooks;
