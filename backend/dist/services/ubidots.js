"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUbidotsHealthy = isUbidotsHealthy;
exports.testUbidotsConnection = testUbidotsConnection;
exports.syncUbidotsData = syncUbidotsData;
exports.startUbidotsPolling = startUbidotsPolling;
exports.stopUbidotsPolling = stopUbidotsPolling;
const axios_1 = __importDefault(require("axios"));
const Posture_1 = require("../models/Posture");
const UBIDOTS_API_URL = 'https://industrial.api.ubidots.com/api/v1.6';
const DEVICE_LABEL = 'posturaesp32';
const POLLING_INTERVAL_MS = 1500;
let ubidotsHealthy = false;
let pollingTimeout = null;
function isUbidotsHealthy() {
    return ubidotsHealthy;
}
// Function to test the token and device connectivity
async function testUbidotsConnection() {
    const token = process.env.UBIDOTS_TOKEN;
    if (!token || token === 'BBUS-eDoQW7vcUZsih99Pp4W0i1Tzr9eqRo') {
        ubidotsHealthy = false;
        return false;
    }
    try {
        // Attempt to fetch the device list or details to test the credentials
        await axios_1.default.get(`${UBIDOTS_API_URL}/devices/${DEVICE_LABEL}`, {
            headers: { 'X-Auth-Token': token }
        });
        ubidotsHealthy = true;
        return true;
    }
    catch (error) {
        ubidotsHealthy = false;
        console.error('Ubidots connection test failed:', error.message);
        return false;
    }
}
// Fetch values from a specific variable
async function fetchVariableValues(token, variableLabel) {
    try {
        const response = await axios_1.default.get(`${UBIDOTS_API_URL}/devices/${DEVICE_LABEL}/${variableLabel}/values`, {
            params: { page_size: 50 }, // Fetch last 50 readings
            headers: { 'X-Auth-Token': token }
        });
        return response.data.results || [];
    }
    catch (error) {
        console.error(`Error fetching Ubidots variable '${variableLabel}':`, error.message);
        throw error;
    }
}
// Main synchronization process
async function syncUbidotsData(io) {
    const token = process.env.UBIDOTS_TOKEN;
    if (!token || token === 'SEU_TOKEN_AQUI') {
        ubidotsHealthy = false;
        console.warn('Ubidots synchronization skipped: UBIDOTS_TOKEN is not configured.');
        return;
    }
    try {
        // 1. Get the latest timestamp saved in our MongoDB database
        const latestRecord = await Posture_1.Posture.findOne().sort({ timestamp: -1 }).exec();
        const minTimestamp = latestRecord ? latestRecord.timestamp : 0;
        // 2. Fetch the values for the 3 variables in parallel
        const [angulos, desvios, statuses] = await Promise.all([
            fetchVariableValues(token, 'angulo'),
            fetchVariableValues(token, 'desvio'),
            fetchVariableValues(token, 'status')
        ]);
        ubidotsHealthy = true;
        // 3. Align values by timestamp
        const dataByTime = {};
        angulos.forEach((item) => {
            dataByTime[item.timestamp] = {
                ...dataByTime[item.timestamp],
                angulo: item.value
            };
        });
        desvios.forEach((item) => {
            dataByTime[item.timestamp] = {
                ...dataByTime[item.timestamp],
                desvio: item.value
            };
        });
        statuses.forEach((item) => {
            dataByTime[item.timestamp] = {
                ...dataByTime[item.timestamp],
                status: item.value
            };
        });
        // 4. Filter for new and complete readings (having all 3 fields)
        const newReadings = [];
        Object.keys(dataByTime).forEach((tsStr) => {
            const ts = Number(tsStr);
            if (ts > minTimestamp) {
                const item = dataByTime[ts];
                if (item.angulo !== undefined &&
                    item.desvio !== undefined &&
                    item.status !== undefined) {
                    newReadings.push({
                        timestamp: ts,
                        angulo: item.angulo,
                        desvio: item.desvio,
                        status: item.status
                    });
                }
            }
        });
        // 5. Sort them chronologically (ascending)
        newReadings.sort((a, b) => a.timestamp - b.timestamp);
        // 6. Save new readings to Database and Broadcast via Socket.IO
        if (newReadings.length > 0) {
            // Use insertMany with ordered: false to skip duplicates if any MongoDB unique index violation occurs
            await Posture_1.Posture.insertMany(newReadings, { ordered: false });
            console.log(`Synchronized and saved ${newReadings.length} new posture records.`);
            // Broadcast to all connected clients
            io.emit('new-data', newReadings);
        }
    }
    catch (error) {
        ubidotsHealthy = false;
        console.error('Failed to sync Ubidots data:', error.message);
    }
}
// Start polling loop
function startUbidotsPolling(io) {
    const runPoll = async () => {
        await syncUbidotsData(io);
        pollingTimeout = setTimeout(runPoll, POLLING_INTERVAL_MS);
    };
    runPoll();
}
// Stop polling loop if needed
function stopUbidotsPolling() {
    if (pollingTimeout) {
        clearTimeout(pollingTimeout);
        pollingTimeout = null;
    }
}
