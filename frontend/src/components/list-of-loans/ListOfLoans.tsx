import React, { useState, useEffect, useCallback, MouseEvent, ChangeEvent } from "react";
import { LoanDTO } from "../../api/dto/loan.dto";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import {
    Box,
    Button,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import MenuAppBar from "../menu-app-bar/MenuAppBar";
import { useApi } from "../../api/ApiProvider";
import { useTranslation } from "react-i18next";
import { isAdmin } from "../../auth";
import "./ListOfLoans.css";

function ListOfLoans() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loans, setLoans] = useState<LoanDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const apiClient = useApi();
    const { t } = useTranslation();
    const admin = isAdmin();

    const loadLoans = useCallback(() => {
        apiClient.getLoans().then(response => {
            if (response.success && response.data) {
                setLoans(response.data);
            } else {
                console.error('Failed to fetch loans');
            }
        });
    }, [apiClient]);

    useEffect(loadLoans, [loadLoans]);

    const handleReturn = (loan: LoanDTO) => {
        apiClient.returnLoan(loan.id).then(loadLoans);
    };

    const handlePageChange = (event: MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const term = searchTerm.toLowerCase();
    const filteredLoans = loans.filter(loan =>
        loan.username.toLowerCase().includes(term) || loan.bookTitle.toLowerCase().includes(term)
    );

    const status = (loan: LoanDTO) => {
        if (loan.returnedOn) {
            return <Chip size="small" label={`${t("Returned")} ${loan.returnedOn}`} />;
        }
        return <Chip size="small" color={loan.overdue ? "error" : "primary"}
                     label={loan.overdue ? t("Overdue") : t("Active")} />;
    };

    return (
        <Box>
            <MenuAppBar/>
            <Box sx={{marginTop: 4, padding: 2}}>
                <Typography variant="h4" gutterBottom>
                    {t("List Of Loans")}
                </Typography>
                <Box display="flex" alignItems="center" mb={2}>
                    <SearchIcon sx={{marginRight: 1}} />
                    <TextField
                        variant="outlined"
                        fullWidth
                        placeholder={t("Search loans by user or book")}
                        value={searchTerm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    />
                </Box>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t("Loan ID")}</TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center">
                                        <PersonIcon sx={{marginRight: 1}}/> {t("User")}
                                    </Box>
                                </TableCell>
                                <TableCell>{t("Book")}</TableCell>
                                <TableCell>{t("Borrowed on")}</TableCell>
                                <TableCell>{t("Due on")}</TableCell>
                                <TableCell>{t("Status")}</TableCell>
                                {admin && <TableCell />}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredLoans.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((loan) => (
                                <TableRow key={loan.id}>
                                    <TableCell>{loan.id}</TableCell>
                                    <TableCell>{loan.username}</TableCell>
                                    <TableCell>{loan.bookTitle}</TableCell>
                                    <TableCell>{loan.borrowedOn}</TableCell>
                                    <TableCell>{loan.dueOn}</TableCell>
                                    <TableCell>{status(loan)}</TableCell>
                                    {admin && (
                                        <TableCell>
                                            {!loan.returnedOn && (
                                                <Button size="small" variant="outlined" onClick={() => handleReturn(loan)}>
                                                    {t("Mark returned")}
                                                </Button>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filteredLoans.length}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Box>
        </Box>
    );
}

export default ListOfLoans;
