package com.jwojciak.library.search;

import java.util.List;

import com.jwojciak.library.common.ServiceUnavailableException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** HTTP client for the Python recommender service (recommender/app.py). */
@Component
class RecommenderClient implements EmbeddingClient {

    private final RestClient http;

    RecommenderClient(RestClient.Builder builder, RecommenderProperties properties) {
        var requests = new SimpleClientHttpRequestFactory();
        requests.setConnectTimeout(properties.timeout());
        requests.setReadTimeout(properties.timeout());
        this.http = builder.baseUrl(properties.url().toString()).requestFactory(requests).build();
    }

    @Override
    public Embeddings embed(List<String> texts) {
        try {
            EmbedResponse response = http.post().uri("/embed").body(new EmbedRequest(texts))
                    .retrieve().body(EmbedResponse.class);
            return new Embeddings(response.model(), response.vectors());
        } catch (RestClientException e) {
            throw new ServiceUnavailableException("The recommender service is unavailable", e);
        }
    }

    record EmbedRequest(List<String> texts) {
    }

    record EmbedResponse(String model, int dimension, List<float[]> vectors) {
    }
}
