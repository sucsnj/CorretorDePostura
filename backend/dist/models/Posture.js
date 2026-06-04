"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Posture = void 0;
const mongoose_1 = require("mongoose");
const PostureSchema = new mongoose_1.Schema({
    timestamp: { type: Number, required: true, unique: true, index: true },
    angulo: { type: Number, required: true },
    desvio: { type: Number, required: true },
    status: { type: Number, required: true },
}, {
    versionKey: false,
});
exports.Posture = (0, mongoose_1.model)('Posture', PostureSchema);
