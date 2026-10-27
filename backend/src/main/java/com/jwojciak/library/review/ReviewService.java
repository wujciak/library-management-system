package com.jwojciak.library.review;

import java.time.Clock;
import java.util.List;

import com.jwojciak.library.book.Book;
import com.jwojciak.library.book.BookService;
import com.jwojciak.library.common.ConflictException;
import com.jwojciak.library.common.NotFoundException;
import com.jwojciak.library.review.ReviewDtos.ReviewRequest;
import com.jwojciak.library.user.Role;
import com.jwojciak.library.user.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private final ReviewRepository reviews;
    private final BookService books;
    private final Clock clock;

    public ReviewService(ReviewRepository reviews, BookService books, Clock clock) {
        this.reviews = reviews;
        this.books = books;
        this.clock = clock;
    }

    public List<Review> forBook(long bookId) {
        books.get(bookId);  // 404 for an unknown book rather than an empty list
        return reviews.findByBookIdOrderByCreatedAtDesc(bookId);
    }

    /** One review per user and book. */
    @Transactional
    public Review add(long bookId, ReviewRequest request, User author) {
        Book book = books.get(bookId);
        if (reviews.existsByBookIdAndUserId(bookId, author.getId())) {
            throw new ConflictException("You have already reviewed book %d".formatted(bookId));
        }
        return reviews.save(new Review(book, author, request.score(), request.comment(), clock.instant()));
    }

    /** Admins can remove any review, readers only their own. */
    @Transactional
    public void delete(long id, User current) {
        Review review = reviews.findWithUserById(id).orElseThrow(() -> new NotFoundException("Review", id));
        if (current.getRole() != Role.ADMIN && !review.getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("Not your review");
        }
        reviews.delete(review);
    }
}
