package com.jwojciak.library.book;

import java.util.List;

import com.jwojciak.library.book.BookDtos.BookRequest;
import com.jwojciak.library.common.ConflictException;
import com.jwojciak.library.common.NotFoundException;
import com.jwojciak.library.loan.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookService {

    private final BookRepository books;
    private final LoanRepository loans;

    public BookService(BookRepository books, LoanRepository loans) {
        this.books = books;
        this.loans = loans;
    }

    public List<Book> search(String title) {
        return title == null || title.isBlank()
                ? books.findAllByOrderByTitle()
                : books.findByTitleContainingIgnoreCaseOrderByTitle(title.strip());
    }

    public Book get(long id) {
        return books.findById(id).orElseThrow(() -> new NotFoundException("Book", id));
    }

    @Transactional
    public Book create(BookRequest request) {
        if (books.existsByIsbn(request.isbn())) {
            throw new ConflictException("A book with ISBN %s already exists".formatted(request.isbn()));
        }
        Book book = new Book(request.isbn());
        apply(book, request);
        return books.save(book);
    }

    @Transactional
    public Book update(long id, BookRequest request) {
        Book book = get(id);
        if (books.existsByIsbnAndIdNot(request.isbn(), id)) {
            throw new ConflictException("A book with ISBN %s already exists".formatted(request.isbn()));
        }
        book.setIsbn(request.isbn());
        apply(book, request);
        return book;
    }

    @Transactional
    public void delete(long id) {
        Book book = get(id);
        if (loans.existsByBookId(id)) {
            throw new ConflictException("Book %d has loans on record".formatted(id));
        }
        books.delete(book);
    }

    private static void apply(Book book, BookRequest r) {
        book.setTitle(r.title());
        book.setAuthor(r.author());
        book.setPublisher(r.publisher());
        book.setPublicationYear(r.publicationYear());
        book.setAvailableCopies(r.availableCopies());
        book.setGenre(r.genre());
        book.setSummary(r.summary());
    }
}
