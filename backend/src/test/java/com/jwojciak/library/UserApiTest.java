package com.jwojciak.library;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.Test;

class UserApiTest extends ApiTest {

    private static Map<String, Object> newReader(String username, String email) {
        return Map.of("username", username, "password", "s3cret-pass", "role", "READER",
                "name", "New Reader", "email", email);
    }

    @Test
    void readersCannotManageUsers() throws Exception {
        String reader = reader();
        mvc.perform(as(reader, get("/api/users"))).andExpect(status().isForbidden());
        mvc.perform(as(reader, post("/api/users"), newReader("eve", "eve@example.com")))
                .andExpect(status().isForbidden());
        mvc.perform(as(reader, delete("/api/users/1"))).andExpect(status().isForbidden());
    }

    @Test
    void adminCreatesAUserWhoCanLogIn() throws Exception {
        String admin = admin();
        mvc.perform(as(admin, post("/api/users"), newReader("bob", "bob@example.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("bob"))
                .andExpect(jsonPath("$.password").doesNotExist());
        login("bob", "s3cret-pass");

        mvc.perform(as(admin, post("/api/users"), newReader("bob", "other@example.com")))
                .andExpect(status().isConflict());
    }

    @Test
    void adminCannotDeleteThemselves() throws Exception {
        String admin = admin();
        long adminId = read(as(admin, get("/api/users/me"))).get("id").asLong();
        mvc.perform(as(admin, delete("/api/users/" + adminId))).andExpect(status().isConflict());
    }
}
