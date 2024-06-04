import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const dbConn = mysql.createConnection({
    host     : process.env.DBHOST,
    user     : process.env.DBUSER,
    password : process.env.DBPASSWORD ,
    database : process.env.DATABASE
});

export default dbConn;