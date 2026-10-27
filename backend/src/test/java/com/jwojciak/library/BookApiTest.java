package com.jwojciak.library;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.Test;

class BookApiTest extends ApiTest {

    private static Map<String, Object> book(String isbn) {
        return Map.of("isbn", isbn, "title", "Refactoring", "author", "Martin Fowler",
                "publisher", "Addison-Wesley", "publicationYear", 2018, "availableCopies", 2);
    }

    @Test
    void readersCanListAndSearch() throws Exception {
        String reader = reader();
        mvc.perform(as(reader, get("/api/books")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(10));
        mvc.perform(as(reader, get("/api/books").param("title", "clean")))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Clean Code"));
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
