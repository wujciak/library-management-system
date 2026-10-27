package com.jwojciak.library.book;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class BookDtos {

    private BookDtos() {
    }

    public record BookRequest(
            @NotBlank @Pattern(regexp = "^(97[89])?[\\d-]{9,13}[\\dX]$", message = "must be an ISBN-10 or ISBN-13")
            String isbn,
            @NotBlank @Size(max = 255) String title,
            @NotBlank @Size(max = 255) String author,
            @NotBlank @Size(max = 255) String publisher,
            @Min(1450) @Max(2100) int publicationYear,
            @Min(0) int availableCopies,
            @Size(max = 100) String genre,
            @Size(max = 2000) String summary) {
    }

    public record BookResponse(Long id, String isbn, String title, String author, String publisher,
                               int publicationYear, int availableCopies, String genre, String summary) {

        static BookResponse of(Book b) {
            return new BookResponse(b.getId(), b.getIsbn(), b.getTitle(), b.getAuthor(), b.getPublisher(),
                    b.getPublicationYear(), b.getAvailableCopies(), b.getGenre(), b.getSummary());
        }
    }
}
