import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const hashPassword= async function(password) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

const genToken = async function(user){
    return jwt.sign(user, process.env.SECRET, {expiresIn: '1d'});
}

const verifyToken = async function(token){
    return jwt.verify(token, process.env.SECRET);
}

const isAdmin = async (req, res, next) => {
    if(!req.cookies.AccToken) return res.status(401).send("Unauthorized : No token provided");
    const jwt = await verifyToken(req.cookies.AccToken);
    if(jwt.role == 'admin')
    next();
    else
    res.status(401).send("Unauthorized");
};

const isClient = async (req, res, next) => {
    if(!req.cookies.AccToken) return res.status(401).send("Unauthorized : No token provided");
    const jwt = await verifyToken(req.cookies.AccToken);
    if(jwt.role == 'client')
    next();
    else
    res.status(401).send("Unauthorized");
};


export { hashPassword, genToken, verifyToken, isAdmin , isClient};