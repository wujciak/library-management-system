package com.jwojciak.library.loan;

import java.util.List;

import com.jwojciak.library.loan.LoanDtos.LoanRequest;
import com.jwojciak.library.loan.LoanDtos.LoanResponse;
import com.jwojciak.library.user.User;
import com.jwojciak.library.user.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/loans")
@Tag(name = "Loans")
public class LoanController {

    private final LoanService service;
    private final UserService users;

    public LoanController(LoanService service, UserService users) {
        this.service = service;
        this.users = users;
    }

    @GetMapping
    public List<LoanResponse> list(Authentication auth) {
        return service.visibleTo(current(auth)).stream()
                .map(l -> LoanResponse.of(l, service.today())).toList();
    }

    @GetMapping("/{id}")
    public LoanResponse get(@PathVariable long id, Authentication auth) {
        return LoanResponse.of(service.get(id, current(auth)), service.today());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse borrow(@Valid @RequestBody LoanRequest request, Authentication auth) {
        return LoanResponse.of(service.borrow(request, current(auth)), service.today());
    }

    /** Returning a book is recorded by library staff when it is handed back. */
    @PostMapping("/{id}/return")
    @PreAuthorize("hasRole('ADMIN')")
    public LoanResponse giveBack(@PathVariable long id) {
        return LoanResponse.of(service.giveBack(id), service.today());
    }

    private User current(Authentication auth) {
        return users.byUsername(auth.getName());
    }
}
