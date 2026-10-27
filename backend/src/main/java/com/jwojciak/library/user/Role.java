package com.jwojciak.library.user;

public enum Role {
    ADMIN,
    READER;

    public String authority() {
        return "ROLE_" + name();
    }
}
