package com.jwojciak.library.search;

import java.util.List;

/** Turns texts into unit-length vectors; implemented by the recommender service client. */
public interface EmbeddingClient {

    /**
     * @throws com.jwojciak.library.common.ServiceUnavailableException if the vectors cannot be computed
     */
    Embeddings embed(List<String> texts);

    record Embeddings(String model, List<float[]> vectors) {
    }
}
