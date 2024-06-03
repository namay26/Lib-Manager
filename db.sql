CREATE DATABASE LibMan;

CREATE TABLE 'books'{
    'id' INT AUTO_INCREMENT,
    'title' VARCHAR(255),
    'author' VARCHAR(255),
    'isinlib' BOOLEAN
    PRIMARY KEY ('id')
};
