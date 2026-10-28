package com.jwojciak.library.search;

import java.net.URI;
import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.recommender")
public record RecommenderProperties(URI url, Duration timeout) {
}
