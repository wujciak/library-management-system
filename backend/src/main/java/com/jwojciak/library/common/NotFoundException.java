package com.jwojciak.library.common;

public class NotFoundException extends RuntimeException {

    public NotFoundException(String entity, long id) {
        super("%s %d not found".formatted(entity, id));
    }
}
