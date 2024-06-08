import express, { json } from 'express';
import dbConn from '../database.js';
import { hashPassword, genToken, verifyToken, isAdmin, isClient } from '../middleware/auth.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.get('/', (req, res) => {
    try{
        if(req.cookies.AccToken){
            const jwt=verifyToken(req.cookies.AccToken);
            if(jwt.role==='admin') return res.redirect('/admindashb');
            if(jwt.role==='client') return res.redirect('/clientdash');
        }
        res.render("home");
    }
    catch (error) {
        res.status(500).send("Error fetching Homepage.");
    }
})

router.get('/login', (req, res) => {
    try{
    res.clearCookie('AccToken');
    const msg=decodeURIComponent(req.query.msg);
    if(!(req.query.msg)) return res.render("login", {"msg": ""});
    res.render("login", {"msg": msg});
    }
    catch (error) {
        res.status(500).send("Error fetching Login page.");
    }
})

router.get('/register', (req, res) => {
    try{
        res.render("register");
    }
    catch (error) {
        res.status(500).send("Error fetching Register page.");
    }
})

router.get('/clientdash',isClient, async (req, res) => {
    const jwt = await verifyToken(req.cookies.AccToken);
    try{
        res.render("clientdash", {"username": jwt.username});
    }
    catch (error) {
        res.status(500).send("Error fetching Client Dashboard.");
    }
})

router.get('/admindashb',isAdmin, async (req, res) => {
    const jwt = await verifyToken(req.cookies.AccToken);
    try{
        res.render("admindashb", {"username": jwt.username});
    }
    catch (error) {
        res.status(500).send("Error fetching Admin Dashboard.");
    }
})

router.get('/listbooks',isAdmin, (req, res) => {
    try{
        const sql = "SELECT * FROM books";
        dbConn.query(sql, (err, result) => {
            if(err) res.status(500).send("Server error");
            const rows = result;
            const msg=decodeURIComponent(req.query.msg);
            if(!(req.query.msg)) return res.render("listbooks", {"books": rows, "msg": ""} );;
            res.render("listbooks", {"books": rows, "msg": msg} );
        })
    }
    catch (error) {
        res.status(500).send("Error fetching List of Books.");
    }
})

router.post('/listbooks',isAdmin, (req, res) => {
    try{
        const id=req.body.id;
        if(id < 1) return res.status(401).send("Invalid ID");
        const sql="SELECT * FROM books WHERE id = ?";
        dbConn.query(sql, id, (err, result) => {
            if(err) res.status(500).send("Server error");
            const [row]=result;
            res.render("updatebooks", {"book": row} );
        })
    }
    catch (error) {
        res.status(500).send("Error while updating the books!");
    }
})

router.post('/register', async (req, res) => {
    try{
        const { username, password } = req.body;
        const pass = await hashPassword(password);
        const checkDuplicate="SELECT * FROM Users WHERE username= ?";
        dbConn.query(checkDuplicate, username, (err1, results) => {
            if(err1) return res.status(500).send("Server error");
            if(results.length > 0) return res.status(401).send("Username already exists");
            const sql = "INSERT INTO Users (username, pass) VALUES (?, ?)";
            dbConn.query(sql, [username, pass], (err, result) => {
                if(err) res.status(500).send("Server error");
                var msg=encodeURIComponent('User registered successfully!');
                res.redirect('/login/?msg=' + msg);
            })
        })
    }
    catch (error) {
        res.status(500).send("Error while registering the user!");
    }
})

router.post('/login', async (req, res) => {
    try{
        const { username, password } = req.body;
        const sql = "SELECT * FROM Users WHERE username = ?";
        dbConn.query(sql, [username], async (err, result) => {
            if(err) res.status(500).send("Server error");
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
                    const msg=encodeURIComponent('Username or password incorrect');
                    res.redirect('/login/?msg=' + msg);
                }
            } else {
                const msg=encodeURIComponent('Nos such username found');
                res.redirect('/login/?msg=' + msg);
            }
        })
    }
    catch (error) {
        res.status(500).send("Error while logging in!");
    }
})


router.post('/updatebooks',isAdmin, (req, res) => {
    try{
        const { id, title, author } = req.body;
        if(title.length < 1 || author.length < 1) return res.status(401).send("Please fill all fields");
        const sql = "UPDATE books SET title = ?, author = ? WHERE id = ?";
        dbConn.query(sql, [title, author, id], (err, result) => {
            if(err) res.status(500).send("Server error");
            var msg=encodeURIComponent('Book Updated successfully!');
            res.redirect('/listbooks/?msg=' + msg);
        })
    }
    catch (error) {
        res.status(500).send("Error while updating the books!");
    }
})

router.get('/addbook',isAdmin, (req, res) => {
    try{
        res.render("addbook");
    }
    catch (error) {
        res.status(500).send("Error fetching Add Book page.");
    }
})

router.post('/addbook',isAdmin, (req, res) => {
    try{
        const { title, author, genre, quantity } = req.body;
        if(title.length < 1 || author.length < 1 || genre.length < 1) return res.status(401).send("Please fill all fields");
        if(quantity < 1) return res.status(401).send("Quantity must be greater than 0");
        const checkDuplicate="SELECT * FROM books WHERE title= ? AND author= ?";
        dbConn.query(checkDuplicate, [title, author], (err1, results) => {
            if(err1) return res.status(500).send("Server error");
            if(results.length > 0)
            {
                const sql = "UPDATE books SET quantity = quantity + ? WHERE title = ? AND author = ?";
                dbConn.query(sql, [quantity, title, author], (err, result) => {
                    if(err) res.status(500).send("Server error");
                    const msg=encodeURIComponent('Book added successfully!');
                    res.redirect('/listbooks/?msg=' + msg);
                })
            }
            else
            {
                const sql2 = "INSERT INTO books (title, author, genre, quantity) VALUES (?, ?, ?, ?)";
                dbConn.query(sql2, [title, author, genre, quantity], (err2, result2) => {
                    if(err2) res.status(500).send("Server error");
                    const msg=encodeURIComponent('Book added successfully!');
                    res.redirect('/listbooks/?msg=' + msg);
                })
            }
        })
    }
    catch (error) {
        res.status(500).send("Error while adding the book!");
    }
})

router.get('/deletebook', isAdmin, (req,res) => {
    try{
        const sql = "SELECT * FROM books";
        dbConn.query(sql, (err, result) => {
            if(err) res.status(500).send("Server error");
            const rows = result;
            res.render("deletebook", {"books": rows} );
        })
    }
    catch (error) {
        res.status(500).send("Error fetching Delete Book page.");
    }
})

router.post('/deletebook', isAdmin, (req, res) => {
    try{
        const id=req.body.id;                                                                                                                                                                                                                       
        if(id < 1) return res.status(401).send("Invalid ID");                                                                                                                                                                                                                                                                          
        const sql2="SELECT * FROM BookRequests WHERE BookID = ?";
        dbConn.query(sql2, id, (err2, result2) => {
            if(err2) res.status(500).send("Server error");
            if(result2.length > 0) return res.status(401).send("Book is currently borrowed");
            const sql="DELETE FROM books WHERE id = ?";
            dbConn.query(sql, id, (err, result) => {
            if(err) res.status(500).send("Server error");
            const msg=encodeURIComponent('Book deleted successfully!');
            res.redirect('/listbooks/?msg=' + msg);
            })
        })
    }
    catch (error) {  
        res.status(500).send("Error while deleting the book!");
    }
})

router.get('/listclient',isClient, (req, res) => {
    try{
        const sql = "SELECT * FROM books";
        dbConn.query(sql, (err, result) => {
            if(err) res.status(500).send("Server error");
            const rows = result;
            res.render("listclient", {"books": rows} );
        })
    }
    catch (error) {
        res.status(500).send("Error fetching List of Books.");
    }
})

router.get('/viewrequest', isAdmin,  (req, res)=>{
    try{
        const sql="SELECT BookRequests.RequestID, Users.username, books.title ,books.author, BookRequests.RequestDate FROM BookRequests JOIN books ON books.id=BookRequests.BookID JOIN Users ON BookRequests.UserID=Users.userid WHERE BookRequests.Status='Pending'" 
        dbConn.query(sql, (err, result)=>{
            if(err) res.status(500).send("Server error");
            const row=result;
            const msg=decodeURIComponent(req.query.msg);
            if(!(req.query.msg)) return res.render("viewrequest", {"request": row, "msg": ""} );
            res.render("viewrequest", {"request": row, "msg": msg});
        })
    }
    catch (error) {
        res.status(500).send("Error fetching View Request page.");
    }
})

router.post('/viewrequest', isAdmin, (req, res)=>{
    try{
        const option=req.body.choice;
        console.log(option)
        if(option=="Approve"){
        const reqid= req.body;
        const sql="UPDATE BookRequests SET Status = 'Approved', AcceptDate=NOW() WHERE RequestID = ?";
        dbConn.query(sql, reqid.id, (err, result) => {
            if(err) res.status(500).send("Server error");
            const sql1="UPDATE books SET quantity = quantity - 1 WHERE id = (SELECT BookID FROM BookRequests WHERE RequestID = ?)";
            dbConn.query(sql1, reqid.id, (err1, result1) => {
                const msg=encodeURIComponent('Request Approved successfully!');
                res.redirect('/viewrequest/?msg=' + msg);
            })
        })
    }
    else{
        const reqid= req.body;
        const sql="DELETE FROM BookRequests WHERE RequestID = ?";
        dbConn.query(sql, reqid.id, (err1, result1) => {
            if(err1) res.status(500).send("Server error");
            const msg=encodeURIComponent('Request Rejected successfully!');
            res.redirect('/viewrequest/?msg=' + msg);
        })
    }
    }
    catch (error) {
        res.status(500).send("Error while approving the request!");
    }   
})

router.get('/reqcheck',isClient, async (req, res)=>{
    try{
        const jwt = await verifyToken(req.cookies.AccToken);
        const userid=jwt.id;
        const sql = "SELECT * FROM books WHERE id NOT IN (SELECT BookID FROM BookRequests WHERE (UserID = ?) AND (Status='Pending' OR Status='Approved')) AND quantity > 0";
        dbConn.query(sql, userid, (err, result) => {
            if(err) res.status(500).send("Server error");
            const rows = result;
            const msg=decodeURIComponent(req.query.msg);
            if(!(req.query.msg)) return res.render("reqcheck", {"books": rows, "msg": ""} );
            res.render("reqcheck", {"books": rows, "msg": msg} );
        })
    }
    catch (error) {
        res.status(500).send("Error fetching Request Check page.");
    }
})

router.post('/reqcheck',isClient, async (req, res)=>{
        const jwt = await verifyToken(req.cookies.AccToken);
        const id=req.body.id;
        const userid=jwt.id;
        const sql="INSERT INTO BookRequests (BookID, UserID, RequestDate, Status) VALUES (?, ?, NOW(), 'Pending')";
        dbConn.query(sql, [id, userid], (err, result) => {
            if(err) throw(err)
            const msg=encodeURIComponent('Request sent successfully!');
            res.redirect('/reqcheck/?msg=' + msg);
        })

})

router.get('/borrowHistory',isClient, async (req, res)=>{
    try{
        const sql="SELECT BookRequests.RequestID,BookRequests.Status, BookRequests.ReturnDate, books.title, books.author, books.genre, BookRequests.RequestDate, BookRequests.AcceptDate FROM BookRequests JOIN books ON books.id=BookRequests.BookID WHERE BookRequests.UserID=?" 
        const jwt = await verifyToken(req.cookies.AccToken);
        const userid=jwt.id;
        dbConn.query(sql,userid, (err, result)=>{
            if(err) res.status(500).send("Server error");
            const row=result;
            res.render("borrowHistory", {"request": row});
        })
    }
    catch (error) {
        res.status(500).send("Error fetching Borrow History page.");
    }
})


router.get('/returnBook',isClient, async (req, res)=>{
    try{
        const sql="SELECT BookRequests.RequestID, books.title, books.author, books.genre, BookRequests.RequestDate, BookRequests.AcceptDate FROM BookRequests JOIN books ON books.id=BookRequests.BookID WHERE BookRequests.UserID=? AND BookRequests.Status='Approved'" 
        const jwt = await verifyToken(req.cookies.AccToken);
        const userid=jwt.id;
        dbConn.query(sql,userid, (err, result)=>{
            if(err) res.status(500).send("Server error");
            const row=result;
            const msg=decodeURIComponent(req.query.msg);
            if(!(req.query.msg)) return res.render("returnBook", {"request": row, "msg": ""} );
            res.render("returnBook", {"request": row, "msg": msg});
        })
    }
    catch (error) {
        res.status(500).send("Error fetching Return Book page.");
    }
})

router.post('/returnBook',isClient, (req, res)=>{
    try{
        const reqid= req.body.id;
        const sql='UPDATE BookRequests SET Status = "Returned", ReturnDate=NOW() WHERE RequestID = ?';
        dbConn.query(sql, reqid, (err, result) => {
            if(err) res.status(500).send("Server error");
            const msg=encodeURIComponent('Book returned successfully!');
            res.redirect('/returnBook/?msg=' + msg);
        })
    }
    catch (error) {
        res.status(500).send("Error while returning the book!");
    }
})

router.get('/requestForAdmin',isClient, (req, res) => {
    try{
        const msg=decodeURIComponent(req.query.msg);
        if(!(req.query.msg)) return res.render("requestForAdmin", {"msg": ""} );
        res.render('requestForAdmin', {"msg": msg});
    }
    catch (error) {
        res.status(500).send("Error fetching Request for Admin page.");
    }
})

router.post('/requestForAdmin',isClient, async (req, res) => {
    try{
        const sql="UPDATE Users SET adminStatus='Pending' WHERE username=? AND userid=?";
        const jwt = await verifyToken(req.cookies.AccToken);
        const userid=jwt.id;
        const username=jwt.username;
        dbConn.query(sql, [username, userid], (err, result) => {
            if(err) res.status(500).send("Server error");
            const msg=encodeURIComponent('Request sent successfully!');
            res.redirect('/requestForAdmin/?msg=' + msg);
        })
    }
    catch (error) {
        res.status(500).send("Error while requesting for Admin!");
    }
})

router.get('/addAdmin',isAdmin,  (req, res) => {
    try{
        const sql="Select userid,username, acctcreate from Users where isAdmin=0 AND adminStatus='Pending'";
        dbConn.query(sql, (err, result) => {
            if(err) res.status(500).send("Server error");
            const rows = result;
            const msg=decodeURIComponent(req.query.msg);
            if(!(req.query.msg)) return res.render("addAdmin", {"users": rows, "msg": ""} );
            res.render("addAdmin", {"users": rows, "msg": msg} );
        })
    }
    catch (error) {
        res.status(500).send("Error fetching Add Admin page.");
    }
})

router.post('/addAdmin', isAdmin, (req, res) => {
    try{
        const option=req.body.choice;
        if(option=="Approve"){
        const userid=req.body.id;
        const sql="UPDATE Users SET isAdmin=1, adminStatus='isAdmin' WHERE userid=?";
        dbConn.query(sql, userid, (err, result) => {
            if(err) res.status(500).send("Server error");
            const msg=encodeURIComponent('Admin added successfully!');
            res.redirect('/addAdmin/?msg=' + msg);
        })
        }
        else{
            const userid=req.body.id;
            const sql="UPDATE Users SET adminStatus='NotRequested' WHERE userid=?";
            dbConn.query(sql, userid, (err, result) => {
                if(err) res.status(500).send("Server error");
                const msg=encodeURIComponent('Request rejected successfully!');
                res.redirect('/addAdmin/?msg=' + msg);
            })
        }

    }
    catch (error) {
        res.status(500).send("Error while adding Admin!");
    }
})

router.get('/logout', (req, res) => {
    try{
        res.clearCookie('AccToken');
        res.redirect('/');
    }
    catch (error) {
        res.status(500).send("Error while logging out!");
    }
})

export default router;