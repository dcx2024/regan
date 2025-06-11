const db = require('../config/db')

const createUser = async(name,email,password)=>{
  
    const result = await db.query('INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *',[ name,email,password])
   return result.rows[0]
}

const getUserByEmail = async (email) => {
    const result = await db.query('SELECT id, name, email, password FROM users WHERE email = $1', [email]);
    return result.rows[0];
  };

  module.exports ={createUser, getUserByEmail}