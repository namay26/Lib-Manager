CREATE DATABASE LibMan;

CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(255) NOT NULL,
    quantity INT
);

CREATE TABLE Users (
    userid INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    pass VARCHAR(255) NOT NULL,
    isAdmin BOOLEAN DEFAULT 0 NOT NULL,
    acctcreate TIMESTAMP DEFAULT NOW() NOT NULL,
    adminStatus ENUM('NotRequested','Pending','isAdmin') DEFAULT 'NotRequested' NOT NULL
);

CREATE TABLE BookRequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    BookID INT,
    RequestDate TIMESTAMP NOT NULL DEFAULT NOW(),
    AcceptDate TIMESTAMP DEFAULT NULL,
    ReturnDate TIMESTAMP DEFAULT NULL,
    Status ENUM('Pending','Approved','Returned') DEFAULT 'Returned' NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(userid),
    FOREIGN KEY (BookID) REFERENCES books(id)
);




