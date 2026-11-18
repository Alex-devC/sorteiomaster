'use strict';

const express = require('express');
const router = express.Router();
const { loginController } = require('../controllers/authController');
const { loginValidation } = require('../validations/authValidation');
const { validate } = require('../middlewares/validate');

router.post('/login', loginValidation, validate, loginController);

module.exports = router;
