const { login, signUp } = require('../controller/userController');
const express = require('express');
const router = express.Router();

router.post('/signup', signUp);


router.post('/login', login);

module.exports = router;
