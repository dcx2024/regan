const { createUser, getUserByEmail} = require('../model/userModel');
const bcrypt = require('bcrypt');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const signUp = async (req, res) => {
  const { name, email, password, role } = req.body;

  

  try {
    const existingUser= await getUserByEmail(email)
  if(existingUser){
    return res.status(400).json({message: "Email is already in Use"})
  }
  const hashedPassword = await bcrypt.hash(password, 10)
    const user = await createUser(name, email, hashedPassword, role);

    // Optional: generate token on signup too
    const token = jwt.sign({ id: user.id, role: user.role,email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'User created successfully',
      role: user.role,
      user: user,
      token: token
    });

    console.log(user);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
    console.error(err);
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await getUserByEmail(email);

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    console.log('User:', user);
console.log('Plain password:', password);
console.log('Stored hash:', user?.password);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(404).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role,email:user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
      
    );

    const { password: _, ...safeUser } = user; // exclude password

    res.json({
      message: "Login successful",
      user: safeUser,
      token,
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports ={signUp,login}