package com.jwojciak.library.search;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** The vector of one book, stored as little-endian float32 bytes. */
@Entity
@Table(name = "book_embeddings")
class BookEmbedding {

    @Id
    @Column(name = "book_id")
    private Long bookId;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private byte[] vector;

    protected BookEmbedding() {
    }

    BookEmbedding(long bookId, String model, float[] vector) {
        this.bookId = bookId;
        this.model = model;
        ByteBuffer bytes = ByteBuffer.allocate(vector.length * Float.BYTES).order(ByteOrder.LITTLE_ENDIAN);
        bytes.asFloatBuffer().put(vector);
        this.vector = bytes.array();
    }

    long bookId() {
        return bookId;
    }

    float[] vector() {
        float[] v = new float[vector.length / Float.BYTES];
        ByteBuffer.wrap(vector).order(ByteOrder.LITTLE_ENDIAN).asFloatBuffer().get(v);
        return v;
    }
}
