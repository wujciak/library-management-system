import axios, { AxiosError, AxiosInstance } from 'axios';
import { LoginDTO, LoginResponseDTO } from './dto/login.dto';
import { BookDTO, BookRequest } from './dto/book.dto';
import { LoanDTO, LoanRequest } from './dto/loan.dto';
import { CreateUserDTO, UserDTO } from './dto/user.dto';
import { getToken, logout } from '../auth';

export type ClientResponse<T> = {
    success: boolean;
    data: T | null;
    statusCode: number;
    /** `detail` of the API's problem response, if any. */
    error?: string;
};

export class LibraryClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
        });
        this.client.interceptors.request.use((config) => {
            const token = getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
        this.client.interceptors.response.use(undefined, (error: AxiosError) => {
            if (error.response?.status === 401 && getToken()) {
                logout();  // expired or invalid token: back to the login page
                window.location.assign('/login');
            }
            return Promise.reject(error);
        });
    }

    private async call<T>(request: Promise<{ data: T; status: number }>): Promise<ClientResponse<T>> {
        try {
            const response = await request;
            return { success: true, data: response.data, statusCode: response.status };
        } catch (e) {
            const error = e as AxiosError<{ detail?: string }>;
            return {
                success: false,
                data: null,
                statusCode: error.response?.status ?? 0,
                error: error.response?.data?.detail,
            };
        }
    }

    login(data: LoginDTO) {
        return this.call(this.client.post<LoginResponseDTO>('/api/auth/login', data));
    }

    me() {
        return this.call(this.client.get<UserDTO>('/api/users/me'));
    }

    getBooks(title?: string) {
        return this.call(this.client.get<BookDTO[]>('/api/books', { params: { title } }));
    }

    createBook(data: BookRequest) {
        return this.call(this.client.post<BookDTO>('/api/books', data));
    }

    getLoans() {
        return this.call(this.client.get<LoanDTO[]>('/api/loans'));
    }

    borrow(data: LoanRequest) {
        return this.call(this.client.post<LoanDTO>('/api/loans', data));
    }

    returnLoan(id: number) {
        return this.call(this.client.post<LoanDTO>(`/api/loans/${id}/return`));
    }

    getUsers() {
        return this.call(this.client.get<UserDTO[]>('/api/users'));
    }

    createUser(data: CreateUserDTO) {
        return this.call(this.client.post<UserDTO>('/api/users', data));
    }
}
