package com.jwojciak.library.book;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByTitleContainingIgnoreCaseOrderByTitle(String title);

    List<Book> findAllByOrderByTitle();

    boolean existsByIsbn(String isbn);

    boolean existsByIsbnAndIdNot(String isbn, long id);

    /** Row lock for changing the copy count, so two loans cannot take the last copy at once. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Book b where b.id = :id")
    Optional<Book> findForUpdate(long id);
}
