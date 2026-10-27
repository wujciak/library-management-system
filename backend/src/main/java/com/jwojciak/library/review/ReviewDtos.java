package com.jwojciak.library.review;

import java.time.Instant;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public final class ReviewDtos {

    private ReviewDtos() {
    }

    public record ReviewRequest(@Min(1) @Max(5) int score, @Size(max = 2000) String comment) {
    }

    public record ReviewResponse(Long id, Long bookId, String username, int score, String comment,
                                 Instant createdAt) {

        static ReviewResponse of(Review r) {
            return new ReviewResponse(r.getId(), r.getBook().getId(), r.getUser().getUsername(), r.getScore(),
                    r.getComment(), r.getCreatedAt());
        }
    }
}
