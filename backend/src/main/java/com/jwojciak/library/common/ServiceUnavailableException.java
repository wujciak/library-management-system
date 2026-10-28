package com.jwojciak.library.common;

/** A dependency the request needs, such as the recommender service, cannot be reached. */
public class ServiceUnavailableException extends RuntimeException {

    public ServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
