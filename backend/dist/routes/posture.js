"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Posture_1 = require("../models/Posture");
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
// GET /api/posture/history - Get the latest 500 records
router.get('/history', auth_1.authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 200;
        const history = await Posture_1.Posture.find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .exec();
        return res.json(history);
    }
    catch (error) {
        console.error('Error fetching posture history:', error);
        return res.status(500).json({ error: 'Erro ao buscar histórico de dados.' });
    }
});
// DELETE /api/posture/clear - Delete all records from MongoDB
router.delete('/clear', auth_1.authenticateToken, async (req, res) => {
    try {
        await Posture_1.Posture.deleteMany({});
        console.log('Database history cleared by user request.');
        return res.json({ message: 'Histórico local limpo com sucesso.' });
    }
    catch (error) {
        console.error('Error clearing posture history:', error);
        return res.status(500).json({ error: 'Erro ao limpar histórico de dados.' });
    }
});
exports.default = router;
