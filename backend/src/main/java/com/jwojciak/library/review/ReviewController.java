package com.jwojciak.library.review;

import java.util.List;

import com.jwojciak.library.review.ReviewDtos.ReviewRequest;
import com.jwojciak.library.review.ReviewDtos.ReviewResponse;
import com.jwojciak.library.user.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Reviews")
public class ReviewController {

    private final ReviewService service;
    private final UserService users;

    public ReviewController(ReviewService service, UserService users) {
        this.service = service;
        this.users = users;
    }

    @GetMapping("/api/books/{bookId}/reviews")
    public List<ReviewResponse> forBook(@PathVariable long bookId) {
        return service.forBook(bookId).stream().map(ReviewResponse::of).toList();
    }

    @PostMapping("/api/books/{bookId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse add(@PathVariable long bookId, @Valid @RequestBody ReviewRequest request,
                              Authentication auth) {
        return ReviewResponse.of(service.add(bookId, request, users.byUsername(auth.getName())));
    }

    @DeleteMapping("/api/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id, Authentication auth) {
        service.delete(id, users.byUsername(auth.getName()));
    }
}
