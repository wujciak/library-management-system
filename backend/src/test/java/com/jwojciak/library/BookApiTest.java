package com.jwojciak.library;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;

class BookApiTest extends ApiTest {

    private static Map<String, Object> book(String isbn) {
        return Map.of("isbn", isbn, "title", "Refactoring", "author", "Martin Fowler",
                "publisher", "Addison-Wesley", "publicationYear", 2018, "availableCopies", 2);
    }

    @Test
    void readersCanPageAndFilterTheCatalogue() throws Exception {
        String reader = reader();
        mvc.perform(as(reader, get("/api/books").param("size", "5")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(5))
                .andExpect(jsonPath("$.totalElements").value(Matchers.greaterThan(100)));
        mvc.perform(as(reader, get("/api/books").param("q", "lem")))
                .andExpect(jsonPath("$.content[?(@.title == 'Solaris')]").exists());
        mvc.perform(as(reader, get("/api/books").param("genre", "Fantasy").param("size", "100")))
                .andExpect(jsonPath("$.content[*].genre").value(Matchers.everyItem(
                        Matchers.is("Fantasy"))));
        mvc.perform(as(reader, get("/api/books").param("q", "The Road").param("available", "true")))
                .andExpect(jsonPath("$.content[?(@.title == 'The Road')]").doesNotExist());
        mvc.perform(as(reader, get("/api/books/genres")))
                .andExpect(jsonPath("$").value(Matchers.hasItems("Fantasy", "Science fiction")));
        mvc.perform(as(reader, get("/api/books").param("size", "1000"))).andExpect(status().isBadRequest());
    }

    @Test
    void booksCarryTheirReviewStatistics() throws Exception {
        String reader = reader();
        long id = bookId(reader, "Solaris");
        mvc.perform(as(reader, get("/api/books/" + id)))
                .andExpect(jsonPath("$.reviewCount").value(0))
                .andExpect(jsonPath("$.averageRating").isEmpty());
        mvc.perform(as(reader, post("/api/books/" + id + "/reviews"), Map.of("score", 4)))
                .andExpect(status().isCreated());
        mvc.perform(as(reader, get("/api/books/" + id)))
                .andExpect(jsonPath("$.reviewCount").value(1))
                .andExpect(jsonPath("$.averageRating").value(4.0));
    }

    @Test
    void onlyAdminsChangeTheCatalogue() throws Exception {
        mvc.perform(as(reader(), post("/api/books"), book("978-0-13-475759-9")))
                .andExpect(status().isForbidden());

        String admin = admin();
        mvc.perform(as(admin, post("/api/books"), book("978-0-13-475759-9")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber());
        mvc.perform(as(admin, post("/api/books"), book("978-0-13-475759-9")))
                .andExpect(status().isConflict());
    }

    @Test
    void invalidBookIsRejectedWithFieldErrors() throws Exception {
        var invalid = Map.of("isbn", "123", "title", "", "author", "A", "publisher", "P",
                "publicationYear", 2018, "availableCopies", -1);
        mvc.perform(as(admin(), post("/api/books"), invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.isbn").exists())
                .andExpect(jsonPath("$.errors.title").exists())
                .andExpect(jsonPath("$.errors.availableCopies").exists());
    }

    @Test
    void updateAndMissingBook() throws Exception {
        String admin = admin();
        long id = bookId(admin, "Clean Code");
        mvc.perform(as(admin, put("/api/books/" + id), book("978-0-13-235088-4")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Refactoring"));
        mvc.perform(as(admin, get("/api/books/999999"))).andExpect(status().isNotFound());
    }

    @Test
    void bookWithLoansCannotBeDeleted() throws Exception {
        String admin = admin();
        long id = bookId(admin, "Clean Code");
        mvc.perform(as(reader(), post("/api/loans"), Map.of("bookId", id))).andExpect(status().isCreated());
        mvc.perform(as(admin, delete("/api/books/" + id))).andExpect(status().isConflict());
        mvc.perform(as(admin, delete("/api/books/" + bookId(admin, "Solaris"))))
                .andExpect(status().isNoContent());
    }
}
