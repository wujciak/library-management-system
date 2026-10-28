package com.jwojciak.library;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** Ranking logic against the bag-of-words {@link FakeEmbeddingClient}; the real model is tested in Python. */
class SearchApiTest extends ApiTest {

    @Autowired
    private FakeEmbeddingClient embeddings;

    @Test
    void semanticSearchRanksTheClosestDescriptionFirst() throws Exception {
        JsonNode results = read(as(reader(), get("/api/books/search")
                .param("q", "a hobbit, a wizard and dwarves on a quest for treasure guarded by a dragon")
                .param("limit", "5")));
        assertThat(results).hasSize(5);
        assertThat(results.get(0).at("/book/title").asText()).isEqualTo("The Hobbit");
        assertThat(results.get(0).get("score").asDouble()).isGreaterThan(results.get(4).get("score").asDouble());
    }

    @Test
    void similarBooksExcludeTheBookItself() throws Exception {
        String reader = reader();
        long hobbit = bookId(reader, "The Hobbit");
        JsonNode similar = read(as(reader, get("/api/books/" + hobbit + "/similar").param("limit", "4")));
        assertThat(similar).hasSize(4);
        assertThat(similar.findValues("id")).noneMatch(id -> id.asLong() == hobbit);
        mvc.perform(as(reader, get("/api/books/999999/similar"))).andExpect(status().isNotFound());
    }

    @Test
    void recommendationsFollowTheReadersHistoryAndSkipKnownBooks() throws Exception {
        String reader = reader();
        long hobbit = bookId(reader, "The Hobbit");
        mvc.perform(as(reader, post("/api/loans"), Map.of("bookId", hobbit))).andExpect(status().isCreated());

        JsonNode recommended = read(as(reader, get("/api/books/recommended")));
        assertThat(recommended.get("basis").asText()).isEqualTo("HISTORY");
        assertThat(recommended.get("books")).isNotEmpty();
        assertThat(recommended.get("books").findValues("id")).noneMatch(id -> id.asLong() == hobbit);
    }

    @Test
    void newReadersGetPopularBooks() throws Exception {
        mvc.perform(as(admin(), post("/api/users"), Map.of("username", "newbie", "password", "s3cret-pass",
                        "role", "READER", "name", "New Reader", "email", "newbie@example.com")))
                .andExpect(status().isCreated());
        mvc.perform(as(login("newbie", "s3cret-pass"), get("/api/books/recommended")))
                .andExpect(jsonPath("$.basis").value("POPULAR"))
                .andExpect(jsonPath("$.books[0].score").isEmpty());
    }

    @Test
    void searchReportsAnUnavailableRecommender() throws Exception {
        String reader = reader();
        embeddings.failing = true;
        try {
            mvc.perform(as(reader, get("/api/books/search").param("q", "dragons")))
                    .andExpect(status().isServiceUnavailable())
                    .andExpect(jsonPath("$.detail").value("The recommender service is unavailable"));
        } finally {
            embeddings.failing = false;
        }
        // stored vectors still work without the service
        mvc.perform(as(reader, get("/api/books/" + bookId(reader, "Solaris") + "/similar")))
                .andExpect(status().isOk());
    }

    @Test
    void statisticsAreForAdminsOnly() throws Exception {
        mvc.perform(as(reader(), get("/api/stats"))).andExpect(status().isForbidden());
        mvc.perform(as(admin(), get("/api/stats")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.books").value(org.hamcrest.Matchers.greaterThan(100)))
                .andExpect(jsonPath("$.mostBorrowed").isArray());
    }
}
