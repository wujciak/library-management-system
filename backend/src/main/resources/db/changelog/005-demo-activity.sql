--liquibase formatted sql

-- Demo readers (password reader123), loan history and reviews, so the dashboard and the
-- recommendations have something to show. Dates are relative to the day the migration runs.
-- Books are matched by title; a title missing from the catalogue simply inserts nothing.
--changeset wujciak:005-demo-activity
INSERT INTO users (username, password_hash, role, name, email) VALUES
    ('anna',  '$2a$10$lMS7N/itWgPgCejmXbcaR.PV7mbfqNCF88DT2n63EtXzMnp5nLR0O', 'READER', 'Anna Kowalska',   'anna@library.local'),
    ('tom',   '$2a$10$lMS7N/itWgPgCejmXbcaR.PV7mbfqNCF88DT2n63EtXzMnp5nLR0O', 'READER', 'Tom Baker',       'tom@library.local'),
    ('maria', '$2a$10$lMS7N/itWgPgCejmXbcaR.PV7mbfqNCF88DT2n63EtXzMnp5nLR0O', 'READER', 'Maria Nowak',     'maria@library.local'),
    ('piotr', '$2a$10$lMS7N/itWgPgCejmXbcaR.PV7mbfqNCF88DT2n63EtXzMnp5nLR0O', 'READER', 'Piotr Wiśniewski', 'piotr@library.local'),
    ('kate',  '$2a$10$lMS7N/itWgPgCejmXbcaR.PV7mbfqNCF88DT2n63EtXzMnp5nLR0O', 'READER', 'Kate Morgan',     'kate@library.local');

-- (username, title, borrowed days ago, loan length in days, returned days ago or NULL while on loan)
CREATE TEMPORARY TABLE demo_loans (username VARCHAR(50), title VARCHAR(255), ago INT, length INT, returned INT);
INSERT INTO demo_loans VALUES
    ('reader', 'Dune', 120, 30, 95),
    ('reader', 'Foundation', 90, 30, 70),
    ('reader', 'The Martian', 60, 30, 41),
    ('reader', 'Neuromancer', 12, 30, NULL),
    ('anna', 'Pride and Prejudice', 200, 30, 180),
    ('anna', 'Jane Eyre', 170, 30, 150),
    ('anna', 'Wuthering Heights', 140, 30, 118),
    ('anna', 'Rebecca', 100, 30, 77),
    ('anna', 'The Time Traveler''s Wife', 45, 30, NULL),
    ('anna', 'Normal People', 20, 30, NULL),
    ('tom', 'Clean Architecture', 150, 30, 130),
    ('tom', 'Domain-Driven Design', 130, 30, 100),
    ('tom', 'Effective Java', 95, 30, 66),
    ('tom', 'Fluent Python', 70, 30, 52),
    ('tom', 'Designing Data-Intensive Applications', 50, 30, NULL),
    ('tom', 'The Mythical Man-Month', 40, 14, NULL),
    ('maria', 'Sapiens', 180, 30, 160),
    ('maria', 'Guns, Germs, and Steel', 150, 30, 121),
    ('maria', 'Bloodlands', 110, 30, 85),
    ('maria', 'The Silk Roads', 80, 30, 55),
    ('maria', 'A Brief History of Time', 60, 30, 31),
    ('maria', 'Cosmos', 25, 30, NULL),
    ('piotr', 'The Last Wish', 160, 30, 140),
    ('piotr', 'The Fellowship of the Ring', 130, 30, 104),
    ('piotr', 'A Game of Thrones', 100, 30, 72),
    ('piotr', 'The Way of Kings', 70, 30, 44),
    ('piotr', 'The Cyberiad', 35, 30, NULL),
    ('piotr', 'Dune', 15, 30, NULL),
    ('kate', 'Superintelligence', 140, 30, 118),
    ('kate', 'Deep Learning', 120, 30, 90),
    ('kate', 'Pattern Recognition and Machine Learning', 90, 30, 66),
    ('kate', 'Human Compatible', 60, 30, 40),
    ('kate', 'The Alignment Problem', 42, 30, NULL),
    ('kate', 'Thinking, Fast and Slow', 20, 30, NULL),
    ('anna', 'Dune', 75, 30, 50),
    ('tom', 'Dune', 210, 30, 185),
    ('maria', 'Nineteen Eighty-Four', 220, 30, 195),
    ('kate', 'Nineteen Eighty-Four', 190, 30, 170),
    ('piotr', 'Nineteen Eighty-Four', 240, 30, 214),
    ('tom', 'The Hitchhiker''s Guide to the Galaxy', 230, 30, 205);

INSERT INTO loans (book_id, user_id, borrowed_on, due_on, returned_on)
SELECT b.id, u.id, CURRENT_DATE - INTERVAL d.ago DAY, CURRENT_DATE - INTERVAL (d.ago - d.length) DAY,
       CASE WHEN d.returned IS NULL THEN NULL ELSE CURRENT_DATE - INTERVAL d.returned DAY END
FROM demo_loans d
JOIN users u ON u.username = d.username
JOIN books b ON b.title = d.title;

DROP TEMPORARY TABLE demo_loans;

-- (username, title, score, comment, days ago)
CREATE TEMPORARY TABLE demo_reviews (username VARCHAR(50), title VARCHAR(255), score INT, comment VARCHAR(2000), ago INT);
INSERT INTO demo_reviews VALUES
    ('reader', 'Dune', 5, 'The world-building is incredible. Arrakis feels like a real place.', 94),
    ('reader', 'Foundation', 4, 'Big ideas, thin characters. Still hard to put down.', 69),
    ('reader', 'The Martian', 5, 'Funny and tense at the same time. Loved the science.', 40),
    ('anna', 'Pride and Prejudice', 5, 'Still the sharpest dialogue I have read.', 179),
    ('anna', 'Jane Eyre', 4, NULL, 149),
    ('anna', 'Wuthering Heights', 3, 'Beautifully written, but I disliked almost everyone in it.', 117),
    ('anna', 'Rebecca', 5, 'Atmospheric from the first line to the last.', 76),
    ('anna', 'Dune', 3, 'Not really my genre, but I see why people love it.', 49),
    ('tom', 'Clean Architecture', 4, 'Good principles; the examples could be more concrete.', 129),
    ('tom', 'Domain-Driven Design', 5, 'Dense, but it changed how I model software.', 99),
    ('tom', 'Effective Java', 5, 'Every Java developer should read this.', 65),
    ('tom', 'Fluent Python', 5, 'Finally understood descriptors and generators.', 51),
    ('tom', 'Dune', 4, NULL, 184),
    ('tom', 'The Hitchhiker''s Guide to the Galaxy', 5, 'Don''t panic. Read it.', 204),
    ('maria', 'Sapiens', 4, 'Thought-provoking, even when it simplifies.', 159),
    ('maria', 'Guns, Germs, and Steel', 4, NULL, 120),
    ('maria', 'Bloodlands', 5, 'Hard to read, and important.', 84),
    ('maria', 'The Silk Roads', 4, 'History seen from the centre of the map.', 54),
    ('maria', 'A Brief History of Time', 3, 'I understood about half of it.', 30),
    ('maria', 'Nineteen Eighty-Four', 5, NULL, 194),
    ('piotr', 'The Last Wish', 5, 'Better than the games. Geralt at his best.', 139),
    ('piotr', 'The Fellowship of the Ring', 5, NULL, 103),
    ('piotr', 'A Game of Thrones', 4, 'Too many characters to keep track of, but gripping.', 71),
    ('piotr', 'The Way of Kings', 5, 'Long, and worth every page.', 43),
    ('piotr', 'Nineteen Eighty-Four', 4, NULL, 213),
    ('kate', 'Superintelligence', 4, 'Rigorous and a little terrifying.', 117),
    ('kate', 'Deep Learning', 4, 'The reference book, though not light reading.', 89),
    ('kate', 'Pattern Recognition and Machine Learning', 5, 'The Bayesian view of everything. Brilliant.', 65),
    ('kate', 'Human Compatible', 5, 'The clearest argument for AI safety I know.', 39),
    ('kate', 'Nineteen Eighty-Four', 4, NULL, 169);

INSERT INTO reviews (book_id, user_id, score, comment, created_at)
SELECT b.id, u.id, d.score, d.comment, NOW() - INTERVAL d.ago DAY
FROM demo_reviews d
JOIN users u ON u.username = d.username
JOIN books b ON b.title = d.title;

DROP TEMPORARY TABLE demo_reviews;
