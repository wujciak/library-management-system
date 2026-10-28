package com.jwojciak.library.book;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface BookRepository extends JpaRepository<Book, Long> {

    /** Catalogue search: text in the title or author, optional genre, optionally only books on the shelf. */
    @Query("""
            select b from Book b
            where (:text is null or lower(b.title) like lower(concat('%', :text, '%'))
                                 or lower(b.author) like lower(concat('%', :text, '%')))
              and (:genre is null or b.genre = :genre)
              and (:available = false or b.availableCopies > 0)
            """)
    Page<Book> search(String text, String genre, boolean available, Pageable pageable);

    @Query("select distinct b.genre from Book b where b.genre is not null order by b.genre")
    List<String> genres();

    boolean existsByIsbn(String isbn);

    boolean existsByIsbnAndIdNot(String isbn, long id);

    /** Row lock for changing the copy count, so two loans cannot take the last copy at once. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Book b where b.id = :id")
    Optional<Book> findForUpdate(long id);

    interface Rating {
        Long getBookId();

        Double getAverage();

        long getCount();
    }

    /** Review statistics for a page of books in one query, instead of one query per book. */
    @Query("""
            select r.book.id as bookId, avg(r.score) as average, count(r) as count
            from Review r where r.book.id in :ids group by r.book.id
            """)
    List<Rating> ratings(Collection<Long> ids);
}
