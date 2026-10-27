import { jwtDecode } from 'jwt-decode';
import { Role } from './api/dto/user.dto';

const KEY = 'token';

interface Claims {
    sub: string;
    role: Role;
    exp: number;
}

export function getToken(): string | null {
    return localStorage.getItem(KEY);
}

export function saveToken(token: string): void {
    localStorage.setItem(KEY, token);
}

export function logout(): void {
    localStorage.removeItem(KEY);
}

/** Claims of the stored token, or null when there is none or it has expired. */
export function currentUser(): Claims | null {
    const token = getToken();
    if (!token) {
        return null;
    }
    try {
        const claims = jwtDecode<Claims>(token);
        return claims.exp * 1000 > Date.now() ? claims : null;
    } catch {
        return null;
    }
}

export function isAdmin(): boolean {
    return currentUser()?.role === 'ADMIN';
}
