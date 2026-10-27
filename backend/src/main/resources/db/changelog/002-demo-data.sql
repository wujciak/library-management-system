--liquibase formatted sql

-- Demo accounts: admin / admin123 and reader / reader123 (bcrypt hashes below).
--changeset wujciak:002-demo-data
INSERT INTO users (username, password_hash, role, name, email) VALUES
    ('admin',  '$2a$10$wX.6eVR4uhJh5rAf61ojYepTMk3Q1Vl8pL1uaxkQREgaWOCzQ8e/a', 'ADMIN',  'Library Admin', 'admin@library.local'),
    ('reader', '$2a$10$lMS7N/itWgPgCejmXbcaR.PV7mbfqNCF88DT2n63EtXzMnp5nLR0O', 'READER', 'Jane Reader',   'reader@library.local');

INSERT INTO books (isbn, title, author, publisher, publication_year, available_copies, genre) VALUES
    ('978-0-13-235088-4', 'Clean Code', 'Robert C. Martin', 'Prentice Hall', 2008, 5, 'Software engineering'),
    ('978-0-201-63361-0', 'Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 'Addison-Wesley', 1994, 3, 'Software engineering'),
    ('978-0-13-468599-1', 'The Pragmatic Programmer', 'David Thomas, Andrew Hunt', 'Addison-Wesley', 2019, 4, 'Software engineering'),
    ('978-1-4493-7332-0', 'Designing Data-Intensive Applications', 'Martin Kleppmann', 'O''Reilly Media', 2017, 2, 'Distributed systems'),
    ('978-0-262-03384-8', 'Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', 'MIT Press', 2009, 2, 'Algorithms'),
    ('978-0-262-03561-3', 'Deep Learning', 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', 'MIT Press', 2016, 3, 'Machine learning'),
    ('978-1-0981-2597-4', 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow', 'Aurélien Géron', 'O''Reilly Media', 2022, 4, 'Machine learning'),
    ('978-83-240-8432-7', 'Solaris', 'Stanisław Lem', 'Wydawnictwo Literackie', 2012, 2, 'Science fiction'),
    ('978-0-547-92822-7', 'The Hobbit', 'J. R. R. Tolkien', 'Mariner Books', 2012, 1, 'Fantasy'),
    ('978-0-14-303943-3', 'The Road', 'Cormac McCarthy', 'Vintage', 2006, 0, 'Fiction');
