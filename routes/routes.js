import express, { json } from 'express';
import dbConn from '../database.js';
import { hashPassword, genToken, verifyToken, isAdmin, isClient } from '../middleware/auth.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();


router.get('/', (req, res) => {
    res.render("home");
})

router.get('/login', (req, res) => {
    res.clearCookie('AccToken');
    res.render("login");
})

router.get('/register', (req, res) => {
    res.render("register");
})

router.get('/clientdash',isClient, async (req, res) => {
    const jwt = await verifyToken(req.cookies.AccToken);
    res.render("clientdash", {"username": jwt.username});
})

router.get('/admindashb',isAdmin, async (req, res) => {
    const jwt = await verifyToken(req.cookies.AccToken);
    res.render("admindashb", {"username": jwt.username});
})

router.get('/listbooks',isAdmin, (req, res) => {
    const sql = "SELECT * FROM books";
    dbConn.query(sql, (err, result) => {
        if(err) throw err;
        const rows = result;
        res.render("listbooks", {"books": rows} );
    })
})

router.post('/listbooks',isAdmin, (req, res) => {
    const id=req.body.id;
    const sql="SELECT * FROM books WHERE id = ?";
    dbConn.query(sql, id, (err, result) => {
        if(err) throw err;
        const [row]=result;
        res.render("updatebooks", {"book": row} );
    })
})

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const pass = await hashPassword(password);
    const checkDuplicate="SELECT * FROM Users WHERE username= ?";
    dbConn.query(checkDuplicate, username, (err1, results) => {
        if(err1) return res.status(500).send("Server error");
        if(results.length > 0) return res.status(401).send("Username already exists");
        const sql = "INSERT INTO Users (username, pass) VALUES (?, ?)";
        dbConn.query(sql, [username, pass], (err, result) => {
            if(err) throw err;
            res.redirect('/login');
        })
    })
})

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM Users WHERE username = ?";
    dbConn.query(sql, [username], async (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            const hash = result[0].pass;
            const validPassword = await bcrypt.compare(password, hash);
            if (validPassword) {
                if (result[0].isAdmin === 1) {
                    var payload = {
                        id: result[0].userid,
                        username: username,
                        role: 'admin'
                    }
                    var accToken = await genToken(payload);
                    res.clearCookie('Access-token');
                    res.clearCookie('AccToken');
                    res.cookie('AccToken', accToken, 
                    { 
                      httpOnly: true,
                      maxAge: 1000 * 60 * 60 * 24
                    });
                    res.redirect('/adminDashb');
                } else {
                    var payload = {
                        id: result[0].userid,
                        username: username,
                        role: 'client'
                    }
                    var accToken = await genToken(payload);
                    res.clearCookie('Access-token');
                    res.clearCookie('AccToken');
                    res.cookie('AccToken', accToken,
                    { 
                      httpOnly: true, 
                      maxAge: 1000 * 60 * 60 * 24 
                    });
                    res.redirect('/clientdash');
                }
            } else {
                return res.status(401).send("Username or password incorrect");
            }
        } else {
            return res.status(401).send("No record found for the given Username. Please register first.");
        }
    });
});


router.post('/updatebooks',isAdmin, (req, res) => {
    const { id, title, author } = req.body;
    const sql = "UPDATE books SET title = ?, author = ? WHERE id = ?";
    dbConn.query(sql, [title, author, id], (err, result) => {
        if(err) throw err;
        res.redirect('/listbooks');
    })
})

router.get('/addbook',isAdmin, (req, res) => {
    res.render("addbook");
})

router.post('/addbook',isAdmin, (req, res) => {
    const { title, author, genre, quantity } = req.body;
    const sql = "INSERT INTO books (title, author, genre, quantity) VALUES (?, ?, ?, ?)";
    dbConn.query(sql, [title, author, genre, quantity], (err, result) => {
        if(err) throw err;
        res.redirect('/listbooks');
    })
})

router.get('/deletebook', isAdmin, (req,res) => {
    const sql = "SELECT * FROM books";
    dbConn.query(sql, (err, result) => {
        if(err) throw err;
        const rows = result;
        res.render("deletebook", {"books": rows} );
    })
})

router.post('/deletebook', isAdmin, (req, res) => {
    const id=req.body.id;
    const sql2="SELECT * FROM BookRequests WHERE BookID = ?";
    dbConn.query(sql2, id, (err2, result2) => {
        if(err2) throw err2;
        if(result2.length > 0) return res.status(401).send("Book is currently borrowed");
        const sql="DELETE FROM books WHERE id = ?";
        dbConn.query(sql, id, (err, result) => {
        if(err) throw err;
        res.redirect('/listbooks');
        })
    })
})

router.get('/listclient',isClient, (req, res) => {
    const sql = "SELECT * FROM books";
    dbConn.query(sql, (err, result) => {
        if(err) throw err;
        const rows = result;
        res.render("listclient", {"books": rows} );
    })
})

router.get('/viewrequest', isAdmin,  (req, res)=>{
    const sql="SELECT BookRequests.RequestID, Users.username, books.title ,books.author, BookRequests.RequestDate FROM BookRequests JOIN books ON books.id=BookRequests.BookID JOIN Users ON BookRequests.UserID=Users.userid WHERE BookRequests.Status='Pending'" 
    dbConn.query(sql, (err, result)=>{
        const row=result;
        res.render("viewrequest", {"request": row});
    })
})

router.post('/viewrequest', isAdmin, (req, res)=>{
    const reqid= req.body;
    const sql="UPDATE BookRequests SET Status = 'Approved', AcceptDate=NOW() WHERE RequestID = ?";
    dbConn.query(sql, reqid.id, (err, result) => {
        if(err) throw err;
        const sql1="UPDATE books SET quantity = quantity - 1 WHERE id = (SELECT BookID FROM BookRequests WHERE RequestID = ?)";
        dbConn.query(sql1, reqid.id, (err1, result1) => {
        res.redirect('/viewrequest');
        })
    })
})

router.get('/reqcheck',isClient, async (req, res)=>{
    const jwt = await verifyToken(req.cookies.AccToken);
    const userid=jwt.id;
    const sql = "SELECT * FROM books WHERE id NOT IN (SELECT BookID FROM BookRequests WHERE (UserID = ?) AND (Status='Pending' OR Status='Approved')) AND quantity > 0";
    dbConn.query(sql, userid, (err, result) => {
        if(err) throw err;
        const rows = result;
        res.render("reqcheck", {"books": rows} );
    })
})

router.post('/reqcheck',isClient, async (req, res)=>{
    const id=req.body.id;
    const jwt = await verifyToken(req.cookies.AccToken);
    const userid=jwt.id;
    const sql="INSERT INTO BookRequests (BookID, UserID, RequestDate, Status) VALUES (?, ?, NOW(), 'Pending')";
    dbConn.query(sql, [id, userid], (err, result) => {
        if(err) throw err;
        res.redirect('/reqcheck');
    })
})

router.get('/borrowHistory',isClient, async (req, res)=>{
    const sql="SELECT BookRequests.RequestID, books.title, books.author, books.genre, BookRequests.RequestDate, BookRequests.AcceptDate FROM BookRequests JOIN books ON books.id=BookRequests.BookID WHERE BookRequests.UserID=? AND BookRequests.Status='Approved'" 
    const jwt = await verifyToken(req.cookies.AccToken);
    const userid=jwt.id;
    dbConn.query(sql,userid, (err, result)=>{
        const row=result;
        res.render("borrowHistory", {"request": row});
    })
})

router.post('/borrowHistory',isClient, (req, res)=>{
    const reqid= req.body.id;
    console.log(reqid);
    const sql='UPDATE BookRequests SET Status = "Returned", ReturnDate=NOW() WHERE RequestID = ?';
    dbConn.query(sql, reqid, (err, result) => {
        if(err) throw err;
        res.redirect('/borrowHistory');
    })
})

router.get('/requestForAdmin',isClient, (req, res) => {
   res.render('requestForAdmin');
})

router.post('/requestForAdmin',isClient, async (req, res) => {
    const sql="UPDATE Users SET adminStatus='Pending' WHERE username=? AND userid=?";
    const jwt = await verifyToken(req.cookies.AccToken);
    const userid=jwt.id;
    const username=jwt.username;
    dbConn.query(sql, [username, userid], (err, result) => {
        if(err) throw err;
        res.redirect('/clientdash');
    })
})

router.get('/addAdmin',isAdmin,  (req, res) => {
    const sql="Select userid,username, acctcreate from Users where isAdmin=0 AND adminStatus='Pending'";
    dbConn.query(sql, (err, result) => {
        if(err) throw err;
        const rows = result;
        res.render("addAdmin", {"users": rows} );
    })
})

router.post('/addAdmin', isAdmin, (req, res) => {
    const userid=req.body.id;
    const sql="UPDATE Users SET isAdmin=1, adminStatus='isAdmin' WHERE userid=?";
    dbConn.query(sql, userid, (err, result) => {
        if(err) throw err;
        res.redirect('/addAdmin');
    })
})

export default router;