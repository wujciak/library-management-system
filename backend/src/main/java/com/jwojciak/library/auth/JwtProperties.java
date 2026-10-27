package com.jwojciak.library.auth;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** {@code app.jwt.*}: Base64 HMAC secret and token lifetime. */
@ConfigurationProperties("app.jwt")
public record JwtProperties(String secret, Duration expiration) {
}
