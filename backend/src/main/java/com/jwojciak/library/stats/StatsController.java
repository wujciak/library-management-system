package com.jwojciak.library.stats;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import com.jwojciak.library.user.Role;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityManager;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Numbers for the admin dashboard; read-only aggregate queries over the other features' tables. */
@RestController
@RequestMapping("/api/stats")
@Tag(name = "Statistics")
@PreAuthorize("hasRole('ADMIN')")
public class StatsController {

    private static final int TOP = 5;

    private final EntityManager em;
    private final Clock clock;

    public StatsController(EntityManager em, Clock clock) {
        this.em = em;
        this.clock = clock;
    }

    public record Stats(long books, long copiesOnShelf, long readers, long activeLoans, long overdueLoans,
                        List<Count> mostBorrowed, List<Count> loansByGenre) {
    }

    public record Count(String label, long count) {
    }

    @GetMapping
    @Transactional(readOnly = true)
    public Stats stats() {
        Object[] catalogue = em.createQuery("select count(b), coalesce(sum(b.availableCopies), 0) from Book b",
                Object[].class).getSingleResult();
        long readers = em.createQuery("select count(u) from User u where u.role = :role", Long.class)
                .setParameter("role", Role.READER).getSingleResult();
        long active = em.createQuery("select count(l) from Loan l where l.returnedOn is null", Long.class)
                .getSingleResult();
        long overdue = em.createQuery("select count(l) from Loan l where l.returnedOn is null and l.dueOn < :today",
                Long.class).setParameter("today", LocalDate.now(clock)).getSingleResult();
        return new Stats((long) catalogue[0], ((Number) catalogue[1]).longValue(), readers, active, overdue,
                counts("select l.book.title, count(l) from Loan l group by l.book.id, l.book.title order by count(l) desc"),
                counts("select coalesce(l.book.genre, 'Other'), count(l) from Loan l group by l.book.genre order by count(l) desc"));
    }

    private List<Count> counts(String jpql) {
        return em.createQuery(jpql, Object[].class).setMaxResults(TOP).getResultList().stream()
                .map(row -> new Count((String) row[0], (long) row[1]))
                .toList();
    }
}
