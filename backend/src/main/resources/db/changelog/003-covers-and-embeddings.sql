--liquibase formatted sql

--changeset wujciak:003-covers-and-embeddings
ALTER TABLE books ADD COLUMN cover_url VARCHAR(255);

-- The genres of the expanded catalogue (004)
UPDATE books SET genre = 'Programming' WHERE genre IN ('Software engineering', 'Distributed systems', 'Algorithms');
UPDATE books SET genre = 'Artificial intelligence' WHERE genre = 'Machine learning';
UPDATE books SET genre = 'Classics' WHERE genre = 'Fiction';

UPDATE books SET cover_url = CONCAT('https://covers.openlibrary.org/b/isbn/', REPLACE(isbn, '-', ''), '-M.jpg');

UPDATE books SET summary = 'A handbook of agile software craftsmanship: how to write code that is easy to read and change, with naming, functions, comments, error handling and unit tests, and case studies of cleaning up real code.' WHERE isbn = '978-0-13-235088-4';
UPDATE books SET summary = 'The catalogue of 23 object-oriented design patterns, such as Factory, Observer, Strategy and Decorator, that gave software designers a shared vocabulary for recurring solutions.' WHERE isbn = '978-0-201-63361-0';
UPDATE books SET summary = 'Practical advice for working programmers on taking responsibility for their craft: avoiding duplication, building tracer bullets, automating, testing and keeping code flexible.' WHERE isbn = '978-0-13-468599-1';
UPDATE books SET summary = 'How databases and distributed systems store, replicate, partition and process data, and the trade-offs between consistency, availability and performance behind modern data-intensive applications.' WHERE isbn = '978-1-4493-7332-0';
UPDATE books SET summary = 'A comprehensive textbook on algorithms and data structures: sorting, graph algorithms, dynamic programming, greedy methods and complexity, with rigorous analysis and pseudocode.' WHERE isbn = '978-0-262-03384-8';
UPDATE books SET summary = 'The textbook on deep learning: the mathematical background, feedforward, convolutional and recurrent networks, regularisation, optimisation and research topics such as generative models.' WHERE isbn = '978-0-262-03561-3';
UPDATE books SET summary = 'A hands-on introduction to machine learning in Python, from linear models and decision trees with scikit-learn to neural networks, computer vision and NLP with Keras and TensorFlow.' WHERE isbn = '978-1-0981-2597-4';
UPDATE books SET summary = 'Scientists orbiting the ocean planet Solaris are confronted with apparitions from their own past, created by a vast alien intelligence that humanity is unable to understand.' WHERE isbn = '978-83-240-8432-7';
UPDATE books SET summary = 'Bilbo Baggins, a comfort-loving hobbit, joins a wizard and thirteen dwarves on a quest to win back their treasure from the dragon Smaug, and finds a magic ring on the way.' WHERE isbn = '978-0-547-92822-7';
UPDATE books SET summary = 'A father and his young son walk south through a burned, post-apocalyptic America, carrying what little they have and trying to stay alive and keep their humanity.' WHERE isbn = '978-0-14-303943-3';

-- One vector per book from the recommender service; rewritten when the book or the model changes.
CREATE TABLE book_embeddings (
    book_id BIGINT         PRIMARY KEY,
    model   VARCHAR(100)   NOT NULL,
    vector  VARBINARY(6144) NOT NULL,
    CONSTRAINT fk_embeddings_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
);
