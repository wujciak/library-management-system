package com.jwojciak.library.book;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.jwojciak.library.book.BookDtos.BookRequest;
import com.jwojciak.library.book.BookDtos.BookResponse;
import com.jwojciak.library.book.BookEvents.BookSaved;
import com.jwojciak.library.common.ConflictException;
import com.jwojciak.library.common.NotFoundException;
import com.jwojciak.library.loan.LoanRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookService {

    private final BookRepository books;
    private final LoanRepository loans;
    private final ApplicationEventPublisher events;

    public BookService(BookRepository books, LoanRepository loans, ApplicationEventPublisher events) {
        this.books = books;
        this.loans = loans;
        this.events = events;
    }

    public Page<Book> search(String text, String genre, boolean available, Pageable pageable) {
        return books.search(blankToNull(text), blankToNull(genre), available, pageable);
    }

    public List<String> genres() {
        return books.genres();
    }

    public Book get(long id) {
        return books.findById(id).orElseThrow(() -> new NotFoundException("Book", id));
    }

    /** Responses with review statistics, in the order of the given books. */
    public List<BookResponse> responses(Collection<Book> page) {
        Map<Long, BookRepository.Rating> ratings = page.isEmpty() ? Map.of()
                : books.ratings(page.stream().map(Book::getId).toList()).stream()
                        .collect(Collectors.toMap(BookRepository.Rating::getBookId, Function.identity()));
        return page.stream().map(b -> BookResponse.of(b, ratings.get(b.getId()))).toList();
    }

    public BookResponse response(Book book) {
        return responses(List.of(book)).getFirst();
    }

    @Transactional
    public Book create(BookRequest request) {
        if (books.existsByIsbn(request.isbn())) {
            throw new ConflictException("A book with ISBN %s already exists".formatted(request.isbn()));
        }
        Book book = new Book(request.isbn());
        apply(book, request);
        books.save(book);
        events.publishEvent(new BookSaved(book.getId()));
        return book;
    }

    @Transactional
    public Book update(long id, BookRequest request) {
        Book book = get(id);
        if (books.existsByIsbnAndIdNot(request.isbn(), id)) {
            throw new ConflictException("A book with ISBN %s already exists".formatted(request.isbn()));
        }
        book.setIsbn(request.isbn());
        apply(book, request);
        events.publishEvent(new BookSaved(id));
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
        book.setCoverUrl(r.coverUrl());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.strip();
    }
}
