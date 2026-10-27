package com.jwojciak.library.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class UserDtos {

    private UserDtos() {
    }

    public record CreateUserRequest(
            @NotBlank @Size(max = 50) String username,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotNull Role role,
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email String email) {
    }

    public record UserResponse(Long id, String username, Role role, String name, String email) {

        static UserResponse of(User user) {
            return new UserResponse(user.getId(), user.getUsername(), user.getRole(), user.getName(),
                    user.getEmail());
        }
    }
}
