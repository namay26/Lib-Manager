import express, { json } from 'express';
import dbConn from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.render("home");
})

router.get('/login', (req, res) => {
    res.render("login");
})

router.get('/register', (req, res) => {
    res.render("register");
})

router.get('/clientdash', (req, res) => {
    res.render("clientdash");
})

router.get('/admindashb', (req, res) => {
    res.render("admindashb");
})

router.get('/listbooks', (req, res) => {
    const sql = "SELECT * FROM books";
    dbConn.query(sql, (err, result) => {
        if(err) throw err;
        const rows = result;
        res.render("listbooks", {"books": rows} );
    })
})

router.post('/listbooks', (req, res) => {
    const id=req.body.id;
    const sql="SELECT * FROM books WHERE id = ?";
    dbConn.query(sql, id, (err, result) => {
        if(err) throw err;
        const [row]=result;
        res.render("updatebooks", {"book": row} );
    })
})

router.post('/register', (req, res) => {
    const { username, password } = req.body;
    const sql = "INSERT INTO Users (username, pass) VALUES (?, ?)";
    dbConn.query(sql, [username, password], (err, result) => {
        if(err) throw err;
        res.redirect('/');
    })
})

router.post('/login', (req, res)=> {
    const { username, password }=req.body;
    const sql = "SELECT * FROM Users WHERE username = ? AND pass = ?";
    dbConn.query(sql, [username, password], (err, result) => {
        if(err) throw err;
        if(result.length > 0) {
            const {isAdmin} = result[0] ;
            if(isAdmin==1)
                {
                    res.redirect('/admindashb');
                }
            else
                res.redirect('/clientdash');
        } else {
            res.redirect('/');      
        }
    })

})

router.post('/updatebooks', (req, res) => {
    const { id, title, author } = req.body;
    const sql = "UPDATE books SET title = ?, author = ? WHERE id = ?";
    dbConn.query(sql, [title, author, id], (err, result) => {
        if(err) throw err;
        res.redirect('/listbooks');
    })
})

router.get('/addbook', (req, res) => {
    res.render("addbook");
})

router.post('/addbook', (req, res) => {
    const { title, author } = req.body;
    const sql = "INSERT INTO books (title, author) VALUES (?, ?)";
    dbConn.query(sql, [title, author], (err, result) => {
        if(err) throw err;
        res.redirect('/listbooks');
    })
})

router.get('/deletebook', (req,res) => {
    const sql = "SELECT * FROM books";
    dbConn.query(sql, (err, result) => {
        if(err) throw err;
        const rows = result;
        res.render("deletebook", {"books": rows} );
    })
})

router.post('/deletebook', (req, res) => {
    const id=req.body.id;
    const sql="DELETE FROM books WHERE id = ?";
    dbConn.query(sql, id, (err, result) => {
        if(err) throw err;
        res.redirect('/listbooks');
    })
})

router.get('/listclient', (req, res) => {
    const sql = "SELECT * FROM books";
    dbConn.query(sql, (err, result) => {
        if(err) throw err;
        const rows = result;
        res.render("listclient", {"books": rows} );
    })
})

export default router;

router.get('/viewrequest', (req, res)=>{
    const sql="SELECT BookRequests.RequestID, Users.username, books.title ,books.author, BookRequests.RequestDate FROM BookRequests JOIN books ON books.id=BookRequests.BookID JOIN Users ON BookRequests.UserID=Users.userid WHERE BookRequests.Status='Pending'" 
    dbConn.query(sql, (err, result)=>{
        const row=result;
        res.render("viewrequest", {"request": row});
    })
})

router.post('/viewrequest', (req, res)=>{
    const reqid= req.body;
    const sql="UPDATE BookRequests SET Status = 'Approved' WHERE RequestID = ?";
    dbConn.query(sql, reqid.id, (err, result) => {
        if(err) throw err;
        res.redirect('/viewrequest');
    })
})