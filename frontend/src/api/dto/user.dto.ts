export type Role = 'ADMIN' | 'READER';

export interface UserDTO {
    id: number;
    username: string;
    role: Role;
    name: string;
    email: string;
}

export interface CreateUserDTO {
    username: string;
    password: string;
    role: Role;
    name: string;
    email: string;
}
