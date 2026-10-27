package com.jwojciak.library;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.Test;

class LoanApiTest extends ApiTest {

    private int copies(String token, long bookId) throws Exception {
        return read(as(token, get("/api/books/" + bookId))).get("availableCopies").asInt();
    }

    @Test
    void borrowingAndReturningMovesACopy() throws Exception {
        String reader = reader();
        String admin = admin();
        long book = bookId(reader, "Clean Code");
        int before = copies(reader, book);

        long loan = read(as(reader, post("/api/loans"), Map.of("bookId", book))).get("id").asLong();
        assertThat(copies(reader, book)).isEqualTo(before - 1);

        mvc.perform(as(admin, post("/api/loans/" + loan + "/return")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.returnedOn").isNotEmpty());
        assertThat(copies(reader, book)).isEqualTo(before);
        mvc.perform(as(admin, post("/api/loans/" + loan + "/return"))).andExpect(status().isConflict());
    }

    @Test
    void cannotBorrowWithoutCopiesOrTwice() throws Exception {
        String reader = reader();
        mvc.perform(as(reader, post("/api/loans"), Map.of("bookId", bookId(reader, "The Road"))))
                .andExpect(status().isConflict());

        long book = bookId(reader, "Clean Code");
        mvc.perform(as(reader, post("/api/loans"), Map.of("bookId", book))).andExpect(status().isCreated());
        mvc.perform(as(reader, post("/api/loans"), Map.of("bookId", book))).andExpect(status().isConflict());
    }

    @Test
    void readersOnlyBorrowForThemselvesAndSeeTheirOwnLoans() throws Exception {
        String reader = reader();
        String admin = admin();
        long adminId = read(as(admin, get("/api/users/me"))).get("id").asLong();
        long book = bookId(reader, "Clean Code");

        mvc.perform(as(reader, post("/api/loans"), Map.of("bookId", book, "userId", adminId)))
                .andExpect(status().isForbidden());
        long adminLoan = read(as(admin, post("/api/loans"), Map.of("bookId", book))).get("id").asLong();
        mvc.perform(as(reader, post("/api/loans"), Map.of("bookId", book))).andExpect(status().isCreated());

        mvc.perform(as(reader, get("/api/loans")))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].username").value("reader"));
        mvc.perform(as(admin, get("/api/loans"))).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(as(reader, get("/api/loans/" + adminLoan))).andExpect(status().isForbidden());
        mvc.perform(as(reader, post("/api/loans/" + adminLoan + "/return"))).andExpect(status().isForbidden());
    }

    @Test
    void adminCanLendToAReader() throws Exception {
        String admin = admin();
        long readerId = read(as(reader(), get("/api/users/me"))).get("id").asLong();
        mvc.perform(as(admin, post("/api/loans"),
                        Map.of("bookId", bookId(admin, "Solaris"), "userId", readerId, "dueOn", "2999-01-01")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("reader"))
                .andExpect(jsonPath("$.dueOn").value("2999-01-01"))
                .andExpect(jsonPath("$.overdue").value(false));
    }
}
