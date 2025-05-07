import express from 'express'
import { confirmPassword, login, refreshToken, register, verifyOtp } from '../../controllers/authController';

const router = express.Router();

router.post('/register' , register);
router.post('/verify-otp' , verifyOtp);
router.post('/confirm' , confirmPassword);
router.post('/login' , login);
router.post('/refresh-token' , refreshToken);

export default router