const express= require('express')
const cors = require('cors')
const path = require('path')
const voteRoutes = require('./route/voteRoute');

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'Frontend')));
app.use(cors())
const authRoutes = require('./route/signUp')
app.use('/api', voteRoutes);
app.use('/api/auth', authRoutes)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
