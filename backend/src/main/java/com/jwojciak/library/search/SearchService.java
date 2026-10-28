package com.jwojciak.library.search;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.jwojciak.library.book.Book;
import com.jwojciak.library.book.BookDtos.BookResponse;
import com.jwojciak.library.book.BookRepository;
import com.jwojciak.library.book.BookService;
import com.jwojciak.library.loan.LoanRepository;
import com.jwojciak.library.review.ReviewRepository;
import com.jwojciak.library.search.SearchDtos.Basis;
import com.jwojciak.library.search.SearchDtos.Recommendations;
import com.jwojciak.library.search.SearchDtos.ScoredBook;
import com.jwojciak.library.search.VectorIndex.Match;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class SearchService {

    /** Reviews from this score up count as "liked" for recommendations. */
    private static final int LIKED_SCORE = 4;

    private final EmbeddingClient client;
    private final VectorIndex index;
    private final BookRepository books;
    private final BookService bookService;
    private final LoanRepository loans;
    private final ReviewRepository reviews;

    SearchService(EmbeddingClient client, VectorIndex index, BookRepository books, BookService bookService,
                  LoanRepository loans, ReviewRepository reviews) {
        this.client = client;
        this.index = index;
        this.books = books;
        this.bookService = bookService;
        this.loans = loans;
        this.reviews = reviews;
    }

    /** Books whose description is closest in meaning to the query, in any language the model knows. */
    public List<ScoredBook> semantic(String query, int limit) {
        float[] q = client.embed(List.of(query.strip())).vectors().getFirst();
        return hydrate(index.nearest(q, limit, Set.of()));
    }

    public List<ScoredBook> similar(long bookId, int limit) {
        bookService.get(bookId);  // 404 for an unknown book
        return index.get(bookId)
                .map(v -> hydrate(index.nearest(v, limit, Set.of(bookId))))
                .orElse(List.of());
    }

    /**
     * Content-based recommendations: the books closest to the mean vector of what the reader has
     * borrowed or rated well, excluding books they already know.
     */
    public Recommendations recommended(String username, int limit) {
        Set<Long> known = new HashSet<>(loans.bookIdsBorrowedBy(username));
        known.addAll(reviews.bookIdsReviewedBy(username, 1));
        Set<Long> liked = new HashSet<>(loans.bookIdsBorrowedBy(username));
        liked.removeAll(reviews.bookIdsReviewedBy(username, 1));  // a review overrides the loan signal
        liked.addAll(reviews.bookIdsReviewedBy(username, LIKED_SCORE));
        List<float[]> taste = liked.stream().map(index::get).flatMap(Optional::stream).toList();
        if (taste.isEmpty()) {
            return new Recommendations(Basis.POPULAR, popular(limit, known));
        }
        return new Recommendations(Basis.HISTORY, hydrate(index.nearest(VectorIndex.mean(taste), limit, known)));
    }

    private List<ScoredBook> popular(int limit, Set<Long> exclude) {
        List<Long> ids = new ArrayList<>(loans.mostBorrowedBookIds(PageRequest.of(0, limit + exclude.size())));
        ids.removeAll(exclude);
        return hydrate(ids.stream().limit(limit).map(id -> new Match(id, Double.NaN)).toList());
    }

    /** Loads the matched books in rank order; books deleted since they were indexed are dropped. */
    private List<ScoredBook> hydrate(List<Match> matches) {
        Map<Long, Book> found = books.findAllById(matches.stream().map(Match::bookId).toList()).stream()
                .collect(Collectors.toMap(Book::getId, Function.identity()));
        List<Match> kept = matches.stream().filter(m -> found.containsKey(m.bookId())).toList();
        matches.stream().filter(m -> !found.containsKey(m.bookId())).forEach(m -> index.remove(m.bookId()));
        List<BookResponse> responses = bookService.responses(kept.stream().map(m -> found.get(m.bookId())).toList());
        List<ScoredBook> result = new ArrayList<>();
        for (int i = 0; i < kept.size(); i++) {
            double score = kept.get(i).score();
            result.add(new ScoredBook(responses.get(i), Double.isNaN(score) ? null : score));
        }
        return result;
    }
}
