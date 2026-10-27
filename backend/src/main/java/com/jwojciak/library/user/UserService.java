package com.jwojciak.library.user;

import java.util.List;

import com.jwojciak.library.common.ConflictException;
import com.jwojciak.library.common.NotFoundException;
import com.jwojciak.library.loan.LoanRepository;
import com.jwojciak.library.user.UserDtos.CreateUserRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository users;
    private final LoanRepository loans;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository users, LoanRepository loans, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.loans = loans;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAll() {
        return users.findAll();
    }

    public User get(long id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("User", id));
    }

    /** The authenticated user; the JWT subject is the username. */
    public User byUsername(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Token for unknown user " + username));
    }

    @Transactional
    public User create(CreateUserRequest request) {
        if (users.existsByUsername(request.username())) {
            throw new ConflictException("Username %s is taken".formatted(request.username()));
        }
        if (users.existsByEmail(request.email())) {
            throw new ConflictException("Email %s is already registered".formatted(request.email()));
        }
        return users.save(new User(request.username(), passwordEncoder.encode(request.password()),
                request.role(), request.name(), request.email()));
    }

    @Transactional
    public void delete(long id, String currentUsername) {
        User user = get(id);
        if (user.getUsername().equals(currentUsername)) {
            throw new ConflictException("You cannot delete your own account");
        }
        if (loans.existsByUserId(id)) {
            throw new ConflictException("User %d has loans on record".formatted(id));
        }
        users.delete(user);
    }
}
