--liquibase formatted sql

--changeset wujciak:001-schema
CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE books (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    isbn             VARCHAR(17)  NOT NULL UNIQUE,
    title            VARCHAR(255) NOT NULL,
    author           VARCHAR(255) NOT NULL,
    publisher        VARCHAR(255) NOT NULL,
    publication_year INT          NOT NULL,
    available_copies INT          NOT NULL,
    genre            VARCHAR(100),
    summary          VARCHAR(2000),
    CONSTRAINT chk_books_copies CHECK (available_copies >= 0)
);

CREATE TABLE loans (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id     BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    borrowed_on DATE   NOT NULL,
    due_on      DATE   NOT NULL,
    returned_on DATE,
    CONSTRAINT fk_loans_book FOREIGN KEY (book_id) REFERENCES books (id),
    CONSTRAINT fk_loans_user FOREIGN KEY (user_id) REFERENCES users (id)
);
CREATE INDEX idx_loans_user ON loans (user_id);

CREATE TABLE reviews (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id     BIGINT   NOT NULL,
    user_id     BIGINT   NOT NULL,
    score       INT      NOT NULL,
    comment     VARCHAR(2000),
    created_at  DATETIME NOT NULL,
    CONSTRAINT fk_reviews_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_reviews_book_user UNIQUE (book_id, user_id),
    CONSTRAINT chk_reviews_score CHECK (score BETWEEN 1 AND 5)
);
