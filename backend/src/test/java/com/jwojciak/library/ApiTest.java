package com.jwojciak.library;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base for API tests: full application against MySQL, requests through MockMvc. Every test runs in
 * a transaction that is rolled back, so each one starts from the Liquibase demo data.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfig.class)
@Transactional
abstract class ApiTest {

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    protected String admin() throws Exception {
        return login("admin", "admin123");
    }

    protected String reader() throws Exception {
        return login("reader", "reader123");
    }

    protected String login(String username, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new Credentials(username, password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    /** Adds the bearer token and, for a non-null body, the JSON content. */
    protected MockHttpServletRequestBuilder as(String token, MockHttpServletRequestBuilder request, Object body)
            throws Exception {
        request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
        }
        return request;
    }

    protected MockHttpServletRequestBuilder as(String token, MockHttpServletRequestBuilder request)
            throws Exception {
        return as(token, request, null);
    }

    protected JsonNode read(MockHttpServletRequestBuilder request) throws Exception {
        return json.readTree(mvc.perform(request).andReturn().getResponse().getContentAsString());
    }

    /** Id of a demo book, looked up by exact title. */
    protected long bookId(String token, String title) throws Exception {
        for (JsonNode book : read(as(token, get("/api/books").param("title", title)))) {
            if (book.get("title").asText().equals(title)) {
                return book.get("id").asLong();
            }
        }
        throw new IllegalArgumentException(title);
    }

    record Credentials(String username, String password) {
    }
}
