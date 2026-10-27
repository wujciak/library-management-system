export interface BookDTO {
    id: number;
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    publicationYear: number;
    availableCopies: number;
    genre?: string;
    summary?: string;
}

export type BookRequest = Omit<BookDTO, 'id'>;
