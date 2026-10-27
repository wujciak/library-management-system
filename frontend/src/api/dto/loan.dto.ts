export interface LoanDTO {
    id: number;
    bookId: number;
    bookTitle: string;
    userId: number;
    username: string;
    borrowedOn: string;
    dueOn: string;
    returnedOn: string | null;
    overdue: boolean;
}

/** Readers borrow for themselves; admins may set userId. dueOn defaults to 30 days. */
export interface LoanRequest {
    bookId: number;
    userId?: number;
    dueOn?: string;
}
