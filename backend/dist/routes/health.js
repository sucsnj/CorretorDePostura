"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const ubidots_1 = require("../services/ubidots");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const mongodbConnected = mongoose_1.default.connection.readyState === 1;
    const ubidotsConnected = (0, ubidots_1.isUbidotsHealthy)();
    const isHealthy = mongodbConnected && ubidotsConnected;
    const payload = {
        status: isHealthy ? 'ok' : 'error',
        mongodb: mongodbConnected,
        ubidots: ubidotsConnected
    };
    if (isHealthy) {
        return res.json(payload);
    }
    else {
        // Return 503 Service Unavailable if any core dependency is down
        return res.status(503).json(payload);
    }
});
exports.default = router;
