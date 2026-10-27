package com.jwojciak.library.review;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = "user")
    List<Review> findByBookIdOrderByCreatedAtDesc(long bookId);

    @EntityGraph(attributePaths = "user")
    Optional<Review> findWithUserById(long id);

    boolean existsByBookIdAndUserId(long bookId, long userId);
}
