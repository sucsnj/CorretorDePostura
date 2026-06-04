"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required.' });
    }
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';
    jsonwebtoken_1.default.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
}
// Login route
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';
    if (username === 'admin' && password === adminPassword) {
        const token = jsonwebtoken_1.default.sign({ username: 'admin' }, jwtSecret, { expiresIn: '7d' });
        return res.json({ username: 'admin', token });
    }
    return res.status(401).json({ error: 'Credenciais inválidas.' });
});
exports.default = router;
