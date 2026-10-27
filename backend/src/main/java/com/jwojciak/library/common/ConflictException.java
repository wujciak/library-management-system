package com.jwojciak.library.common;

/** A request that is valid on its own but clashes with the current state, e.g. no copies left. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
