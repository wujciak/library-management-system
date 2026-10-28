package com.jwojciak.library.search;

import java.util.List;

import com.jwojciak.library.book.BookDtos.BookResponse;

public final class SearchDtos {

    private SearchDtos() {
    }

    /** A book with its cosine similarity to the query; null when the list is not ranked by similarity. */
    public record ScoredBook(BookResponse book, Double score) {
    }

    public enum Basis {
        /** Ranked by similarity to the books the reader borrowed or rated highly. */
        HISTORY,
        /** The reader has no history yet: the most borrowed books. */
        POPULAR
    }

    public record Recommendations(Basis basis, List<ScoredBook> books) {
    }
}
