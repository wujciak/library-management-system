package com.jwojciak.library.search;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.jwojciak.library.book.Book;
import com.jwojciak.library.book.BookEvents.BookSaved;
import com.jwojciak.library.book.BookRepository;
import com.jwojciak.library.common.ServiceUnavailableException;
import com.jwojciak.library.search.EmbeddingClient.Embeddings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Keeps a vector for every book. A changed book is embedded right after its transaction commits;
 * a periodic pass catches up with books the recommender could not embed at that moment, such as the
 * whole catalogue on the first start or everything after the model changes.
 */
@Component
class EmbeddingSync {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingSync.class);
    private static final int BATCH = 32;

    private final BookRepository books;
    private final BookEmbeddingRepository embeddings;
    private final EmbeddingClient client;
    private final VectorIndex index;

    /** The model the recommender reported last; null until it has answered once. */
    private volatile String model;
    private volatile boolean unavailable;

    EmbeddingSync(BookRepository books, BookEmbeddingRepository embeddings, EmbeddingClient client,
                  VectorIndex index) {
        this.books = books;
        this.embeddings = embeddings;
        this.client = client;
        this.index = index;
    }

    @EventListener(ApplicationReadyEvent.class)
    void start() {
        embeddings.findAll().forEach(e -> index.put(e.bookId(), e.vector()));
        catchUp();
    }

    @Scheduled(fixedDelayString = "${app.recommender.sync-interval}", initialDelayString = "${app.recommender.sync-interval}")
    void catchUp() {
        try {
            List<Long> ids = embeddings.findBookIdsNeedingEmbedding(model);
            for (int i = 0; i < ids.size(); i += BATCH) {
                embed(ids.subList(i, Math.min(i + BATCH, ids.size())));
            }
            if (!ids.isEmpty()) {
                log.info("Embedded {} books with {}", ids.size(), model);
            }
            unavailable = false;
        } catch (ServiceUnavailableException e) {
            if (!unavailable) {
                log.warn("{}, retrying later", e.getMessage());
            }
            unavailable = true;
        }
    }

    @TransactionalEventListener(fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void onBookSaved(BookSaved event) {
        try {
            embed(List.of(event.bookId()));
        } catch (ServiceUnavailableException e) {
            log.warn("Could not embed book {} now, the next pass will", event.bookId());
        }
    }

    private synchronized void embed(List<Long> ids) {
        List<Book> batch = books.findAllById(ids);
        Embeddings result = client.embed(batch.stream().map(EmbeddingSync::text).toList());
        model = result.model();
        for (int i = 0; i < batch.size(); i++) {
            long id = batch.get(i).getId();
            float[] vector = result.vectors().get(i);
            embeddings.save(new BookEmbedding(id, model, vector));
            index.put(id, vector);
        }
    }

    /** What the model reads about a book. */
    static String text(Book b) {
        return Stream.of(b.getTitle(), "by " + b.getAuthor(), b.getGenre(), b.getSummary())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(". "));
    }
}
