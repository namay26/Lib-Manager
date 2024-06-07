import bcrypt from 'bcrypt'

const hashPassword= async function(password) {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    
    return {
        hash: hash
    };
}

export default hashPassword;