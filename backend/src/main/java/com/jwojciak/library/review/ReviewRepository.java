package com.jwojciak.library.review;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = "user")
    List<Review> findByBookIdOrderByCreatedAtDesc(long bookId);

    @EntityGraph(attributePaths = "user")
    Optional<Review> findWithUserById(long id);

    boolean existsByBookIdAndUserId(long bookId, long userId);

    @Query("select r.book.id from Review r where r.user.username = :username and r.score >= :minScore")
    Set<Long> bookIdsReviewedBy(String username, int minScore);
}
