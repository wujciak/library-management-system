package com.jwojciak.library.search;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface BookEmbeddingRepository extends JpaRepository<BookEmbedding, Long> {

    /** Books with no vector yet, or, once the model is known, with a vector from another model. */
    @Query("""
            select b.id from Book b where not exists (
                select e from BookEmbedding e where e.bookId = b.id and (:model is null or e.model = :model))
            order by b.id
            """)
    List<Long> findBookIdsNeedingEmbedding(String model);
}
