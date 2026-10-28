package com.jwojciak.library.search;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Book vectors held in memory and ranked by cosine similarity. The vectors are unit length, so
 * cosine similarity is a dot product. A brute-force scan over a few thousand 384-d vectors takes well
 * under a millisecond; a vector database would only pay off for a much larger catalogue.
 */
@Component
class VectorIndex {

    private final Map<Long, float[]> vectors = new ConcurrentHashMap<>();

    void put(long bookId, float[] vector) {
        vectors.put(bookId, vector);
    }

    void remove(long bookId) {
        vectors.remove(bookId);
    }

    Optional<float[]> get(long bookId) {
        return Optional.ofNullable(vectors.get(bookId));
    }

    int size() {
        return vectors.size();
    }

    List<Match> nearest(float[] query, int limit, Set<Long> exclude) {
        return vectors.entrySet().stream()
                .filter(e -> !exclude.contains(e.getKey()))
                .map(e -> new Match(e.getKey(), dot(query, e.getValue())))
                .sorted(Comparator.comparingDouble(Match::score).reversed())
                .limit(limit)
                .toList();
    }

    /** Normalised mean of the given vectors: the centre of a reader's taste. */
    static float[] mean(Collection<float[]> vs) {
        float[] m = new float[vs.iterator().next().length];
        for (float[] v : vs) {
            for (int i = 0; i < m.length; i++) {
                m[i] += v[i];
            }
        }
        double norm = Math.sqrt(dot(m, m));
        for (int i = 0; i < m.length; i++) {
            m[i] /= (float) norm;
        }
        return m;
    }

    private static double dot(float[] a, float[] b) {
        double s = 0;
        for (int i = 0; i < a.length; i++) {
            s += a[i] * b[i];
        }
        return s;
    }

    record Match(long bookId, double score) {
    }
}
