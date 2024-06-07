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

const isAdmin = async function(token){
    const jwt = await verifyToken(token);
    return jwt.role == 'admin';
}

export { hashPassword, genToken, verifyToken};