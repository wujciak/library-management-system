package com.jwojciak.library;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.Test;

class ReviewApiTest extends ApiTest {

    @Test
    void oneReviewPerUserAndBook() throws Exception {
        String reader = reader();
        long book = bookId(reader, "Solaris");
        String url = "/api/books/" + book + "/reviews";

        mvc.perform(as(reader, post(url), Map.of("score", 5, "comment", "A classic")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("reader"));
        mvc.perform(as(reader, post(url), Map.of("score", 4))).andExpect(status().isConflict());
        mvc.perform(as(reader, get(url))).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void scoreMustBeOneToFive() throws Exception {
        String reader = reader();
        mvc.perform(as(reader, post("/api/books/" + bookId(reader, "Solaris") + "/reviews"), Map.of("score", 6)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void onlyTheAuthorOrAnAdminDeletesAReview() throws Exception {
        String admin = admin();
        String reader = reader();
        long book = bookId(admin, "Solaris");
        long review = read(as(admin, post("/api/books/" + book + "/reviews"), Map.of("score", 3)))
                .get("id").asLong();

        mvc.perform(as(reader, delete("/api/reviews/" + review))).andExpect(status().isForbidden());
        mvc.perform(as(admin, delete("/api/reviews/" + review))).andExpect(status().isNoContent());
    }
}
