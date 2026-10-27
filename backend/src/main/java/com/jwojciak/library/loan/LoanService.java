package com.jwojciak.library.loan;

import java.time.Clock;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;

import com.jwojciak.library.book.Book;
import com.jwojciak.library.book.BookRepository;
import com.jwojciak.library.common.ConflictException;
import com.jwojciak.library.common.NotFoundException;
import com.jwojciak.library.loan.LoanDtos.LoanRequest;
import com.jwojciak.library.user.Role;
import com.jwojciak.library.user.User;
import com.jwojciak.library.user.UserService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoanService {

    static final Period DEFAULT_LOAN_PERIOD = Period.ofDays(30);

    private final LoanRepository loans;
    private final BookRepository books;
    private final UserService users;
    private final Clock clock;

    public LoanService(LoanRepository loans, BookRepository books, UserService users, Clock clock) {
        this.loans = loans;
        this.books = books;
        this.users = users;
        this.clock = clock;
    }

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    /** Admins see every loan, readers only their own. */
    @Transactional(readOnly = true)
    public List<Loan> visibleTo(User current) {
        return current.getRole() == Role.ADMIN
                ? loans.findAllByOrderByBorrowedOnDescIdDesc()
                : loans.findByUserUsernameOrderByBorrowedOnDescIdDesc(current.getUsername());
    }

    @Transactional(readOnly = true)
    public Loan get(long id, User current) {
        Loan loan = loans.findWithDetailsById(id).orElseThrow(() -> new NotFoundException("Loan", id));
        if (current.getRole() != Role.ADMIN && !loan.getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("Not your loan");
        }
        return loan;
    }

    @Transactional
    public Loan borrow(LoanRequest request, User current) {
        User borrower = current;
        if (request.userId() != null && !request.userId().equals(current.getId())) {
            if (current.getRole() != Role.ADMIN) {
                throw new AccessDeniedException("Readers can only borrow for themselves");
            }
            borrower = users.get(request.userId());
        }
        Book book = books.findForUpdate(request.bookId())
                .orElseThrow(() -> new NotFoundException("Book", request.bookId()));
        if (loans.existsByBookIdAndUserIdAndReturnedOnIsNull(book.getId(), borrower.getId())) {
            throw new ConflictException("%s already has book %d".formatted(borrower.getUsername(), book.getId()));
        }
        book.takeCopy();
        LocalDate today = today();
        LocalDate due = request.dueOn() != null ? request.dueOn() : today.plus(DEFAULT_LOAN_PERIOD);
        return loans.save(new Loan(book, borrower, today, due));
    }

    @Transactional
    public Loan giveBack(long id) {
        Loan loan = loans.findWithDetailsById(id).orElseThrow(() -> new NotFoundException("Loan", id));
        if (!loan.isActive()) {
            throw new ConflictException("Loan %d was already returned".formatted(id));
        }
        loan.markReturned(today());
        books.findForUpdate(loan.getBook().getId()).orElseThrow().returnCopy();
        return loan;
    }
}
