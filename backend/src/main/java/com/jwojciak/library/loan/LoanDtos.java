package com.jwojciak.library.loan;

import java.time.LocalDate;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

public final class LoanDtos {

    private LoanDtos() {
    }

    /**
     * @param userId borrower; admins may lend to anyone, readers always borrow for themselves
     * @param dueOn  defaults to {@link LoanService#DEFAULT_LOAN_PERIOD} from today
     */
    public record LoanRequest(@NotNull Long bookId, Long userId, @Future LocalDate dueOn) {
    }

    public record LoanResponse(Long id, Long bookId, String bookTitle, String bookCoverUrl, Long userId,
                               String username, LocalDate borrowedOn, LocalDate dueOn, LocalDate returnedOn,
                               boolean overdue) {

        static LoanResponse of(Loan l, LocalDate today) {
            return new LoanResponse(l.getId(), l.getBook().getId(), l.getBook().getTitle(), l.getBook().getCoverUrl(),
                    l.getUser().getId(), l.getUser().getUsername(), l.getBorrowedOn(), l.getDueOn(), l.getReturnedOn(),
                    l.isActive() && l.getDueOn().isBefore(today));
        }
    }
}
