import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { getToken, logout, Role } from './auth';

export interface Book {
    id: number;
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    publicationYear: number;
    availableCopies: number;
    genre: string | null;
    summary: string | null;
    coverUrl: string | null;
    averageRating: number | null;
    reviewCount: number;
}

export type NewBook = Omit<Book, 'id' | 'averageRating' | 'reviewCount'>;

export interface Page<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

/** A book with its similarity to the query or reader; null when not ranked by similarity. */
export interface ScoredBook {
    book: Book;
    score: number | null;
}

export interface Recommendations {
    basis: 'HISTORY' | 'POPULAR';
    books: ScoredBook[];
}

export interface Loan {
    id: number;
    bookId: number;
    bookTitle: string;
    bookCoverUrl: string | null;
    userId: number;
    username: string;
    borrowedOn: string;
    dueOn: string;
    returnedOn: string | null;
    overdue: boolean;
}

export interface Review {
    id: number;
    bookId: number;
    username: string;
    score: number;
    comment: string | null;
    createdAt: string;
}

export interface User {
    id: number;
    username: string;
    role: Role;
    name: string;
    email: string;
}

export type NewUser = Omit<User, 'id'> & { password: string };

export interface Count {
    label: string;
    count: number;
}

export interface Stats {
    books: number;
    copiesOnShelf: number;
    readers: number;
    activeLoans: number;
    overdueLoans: number;
    mostBorrowed: Count[];
    loansByGenre: Count[];
}

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080' });

http.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// An expired or invalid token: back to the login page
http.interceptors.response.use(undefined, (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && !error.config?.url?.endsWith('/login')) {
        logout();
        window.location.assign('/login');
    }
    return Promise.reject(error);
});

async function get<T>(url: string, params?: object): Promise<T> {
    return (await http.get<T>(url, { params })).data;
}

async function post<T>(url: string, body?: object): Promise<T> {
    return (await http.post<T>(url, body)).data;
}

export const api = {
    login: (username: string, password: string) =>
        post<{ token: string }>('/api/auth/login', { username, password }).then((r) => r.token),
    me: () => get<User>('/api/users/me'),

    books: (params: { q?: string; genre?: string; available?: boolean; page: number; size: number }) =>
        get<Page<Book>>('/api/books', params),
    genres: () => get<string[]>('/api/books/genres'),
    book: (id: number) => get<Book>(`/api/books/${id}`),
    createBook: (book: NewBook) => post<Book>('/api/books', book),

    search: (q: string, limit = 24) => get<ScoredBook[]>('/api/books/search', { q, limit }),
    similar: (id: number, limit = 6) => get<ScoredBook[]>(`/api/books/${id}/similar`, { limit }),
    recommended: (limit = 10) => get<Recommendations>('/api/books/recommended', { limit }),

    reviews: (bookId: number) => get<Review[]>(`/api/books/${bookId}/reviews`),
    addReview: (bookId: number, score: number, comment: string) =>
        post<Review>(`/api/books/${bookId}/reviews`, { score, comment }),
    deleteReview: (id: number) => http.delete(`/api/reviews/${id}`),

    loans: () => get<Loan[]>('/api/loans'),
    borrow: (bookId: number, userId?: number, dueOn?: string) => post<Loan>('/api/loans', { bookId, userId, dueOn }),
    returnLoan: (id: number) => post<Loan>(`/api/loans/${id}/return`),

    users: () => get<User[]>('/api/users'),
    createUser: (user: NewUser) => post<User>('/api/users', user),
    stats: () => get<Stats>('/api/stats'),
};

/** The server's explanation of a failed request (RFC 9457 problem detail), for showing to the user. */
export function errorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.detail ?? error.message;
    }
    return String(error);
}

/** Per-field validation messages of a 400 response, keyed by field name. */
export function fieldErrors(error: unknown): Record<string, string> {
    return (axios.isAxiosError(error) && error.response?.data?.errors) || {};
}

/** Loads data when the dependencies change; `reload` fetches again, e.g. after a change. */
export function useApi<T>(load: () => Promise<T>, deps: unknown[], enabled = true) {
    const [data, setData] = useState<T>();
    const [error, setError] = useState<unknown>();
    const [loading, setLoading] = useState(enabled);
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        let current = true;  // ignore responses that arrive after the inputs changed again
        setLoading(true);
        setError(undefined);
        load()
            .then((d) => current && setData(d))
            .catch((e) => current && setError(e))
            .finally(() => current && setLoading(false));
        return () => {
            current = false;
        };
    }, [...deps, enabled, version]);

    const reload = useCallback(() => setVersion((v) => v + 1), []);
    return { data, error, loading, reload };
}
