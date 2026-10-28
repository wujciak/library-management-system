package com.jwojciak.library.book;

/** Published by {@link BookService}, so other features can react without the book feature knowing them. */
public final class BookEvents {

    private BookEvents() {
    }

    /** A book was created or its description changed. */
    public record BookSaved(long bookId) {
    }
}
