package com.jwojciak.library.loan;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    // Loans are always returned with their book and user, so both are fetched in the same query
    @EntityGraph(attributePaths = {"book", "user"})
    Optional<Loan> findWithDetailsById(long id);

    @EntityGraph(attributePaths = {"book", "user"})
    List<Loan> findAllByOrderByBorrowedOnDescIdDesc();

    @EntityGraph(attributePaths = {"book", "user"})
    List<Loan> findByUserUsernameOrderByBorrowedOnDescIdDesc(String username);

    boolean existsByBookIdAndUserIdAndReturnedOnIsNull(long bookId, long userId);

    boolean existsByBookId(long bookId);

    boolean existsByUserId(long userId);

    @Query("select distinct l.book.id from Loan l where l.user.username = :username")
    Set<Long> bookIdsBorrowedBy(String username);

    @Query("select l.book.id from Loan l group by l.book.id order by count(l) desc")
    List<Long> mostBorrowedBookIds(Pageable pageable);
}
