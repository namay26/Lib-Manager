# Lib-Manager

This is a Library Management System, which is a web server-application designed to manage the various aspects of a library. Built using ExpressJS and NodeJS for the backend, and MySQL for the database.

Features:

- **Separate Client and Admin User Experience -** Provides a different portal for both Clients and Admins.
- **Secure Authentication and Authorization -** Uses JWT and ExpressJS package like bcrypt.. The user password is salted and hashed before storing and session management is done using JWTs.
- **Admin Features**
    - View all the books present in the library.
    - Update/Add/Delete a book.
    - Handle Check-out request of a book.
    - Grant Admin Privileges to clients.
- **Client Features**
    - View all the books present in the library.
    - Request for Check-out of books.
    - Return a book.
    - Request for Admin Privileges.
    - View their borrowing history.

## To Run:

1) `npm install`

2) clone the repository

3) create a `.env` file with fields as in .sample.env

4) Run all the commands in `db.sql` in you mySQL command prompt.

5) `npm start`

6) An admin with username - `admin`  and password - `admin123`  will be created and can be used to     login.
