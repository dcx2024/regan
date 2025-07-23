const {Client} = require('pg')
require ('dotenv').config()

const db = new Client({
     connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

db.connect().then(()=>console.log('connected to postgresql')).catch((err)=>console.error('Database Connection error'))

module.exports = db;
