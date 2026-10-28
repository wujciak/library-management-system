package com.jwojciak.library;

import java.util.List;

import com.jwojciak.library.common.ServiceUnavailableException;
import com.jwojciak.library.search.EmbeddingClient;

/**
 * Stands in for the recommender in tests: bag-of-words vectors, so texts that share words are
 * similar. That is enough to test ranking, exclusion and fallbacks without running the model.
 */
class FakeEmbeddingClient implements EmbeddingClient {

    private static final int DIMENSION = 256;

    volatile boolean failing;

    @Override
    public Embeddings embed(List<String> texts) {
        if (failing) {
            throw new ServiceUnavailableException("The recommender service is unavailable", null);
        }
        return new Embeddings("fake-bag-of-words", texts.stream().map(FakeEmbeddingClient::vector).toList());
    }

    private static float[] vector(String text) {
        float[] v = new float[DIMENSION];
        for (String word : text.toLowerCase().split("\\W+")) {
            if (word.length() > 2) {
                v[Math.floorMod(word.hashCode(), DIMENSION)] += 1;
            }
        }
        double norm = 0;
        for (float x : v) {
            norm += x * x;
        }
        if (norm == 0) {
            v[0] = 1;
            return v;
        }
        for (int i = 0; i < DIMENSION; i++) {
            v[i] /= (float) Math.sqrt(norm);
        }
        return v;
    }
}
