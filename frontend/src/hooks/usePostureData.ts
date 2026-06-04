import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { PostureData } from '../../../shared/types';

export const usePostureData = (apiUrl: string, token: string | null) => {
  const [historyData, setHistoryData] = useState<PostureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);
  const [mongodbDown, setMongodbDown] = useState(false);
  const [ubidotsDown, setUbidotsDown] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Checks the /health endpoint to ensure all external dependencies are running
  const checkHealth = useCallback(async () => {
    setRetrying(true);
    try {
      await axios.get(`${apiUrl}/health`);
      setBackendDown(false);
      setMongodbDown(false);
      setUbidotsDown(false);
      return true;
    } catch (err: any) {
      if (err.response && err.response.data) {
        // Server is running but database/ubidots credentials failed
        setBackendDown(false);
        setMongodbDown(!err.response.data.mongodb);
        setUbidotsDown(!err.response.data.ubidots);
      } else {
        // Backend server is down completely
        setBackendDown(true);
        setMongodbDown(true);
        setUbidotsDown(true);
      }
      return false;
    } finally {
      setRetrying(false);
    }
  }, [apiUrl]);

  // Fetches initial historical records
  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${apiUrl}/api/posture/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistoryData(response.data);
    } catch (err) {
      console.error('Failed to fetch posture history:', err);
    }
  }, [apiUrl, token]);

  // Clears the history in MongoDB
  const clearHistory = useCallback(async () => {
    if (!token) return;
    await axios.delete(`${apiUrl}/api/posture/clear`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setHistoryData([]);
  }, [apiUrl, token]);

  useEffect(() => {
    let socket: Socket | null = null;

    const initConnection = async () => {
      setLoading(true);
      const isHealthy = await checkHealth();
      
      if (isHealthy && token) {
        await fetchHistory();

        // Initialize Socket.io Connection
        socket = io(apiUrl);

        socket.on('connect', () => {
          console.log('Connected to real-time WebSocket stream.');
          setBackendDown(false);
        });

        socket.on('disconnect', () => {
          console.log('WebSocket stream disconnected.');
        });

        // Listen for new aligned readings
        socket.on('new-data', (newReadings: PostureData[]) => {
          setHistoryData((prev) => {
            // Append incoming readings to the front (history is sorted descending)
            const combined = [...[...newReadings].reverse(), ...prev];
            
            // Remove any duplicates by timestamp
            const seen = new Set();
            return combined.filter((item) => {
              if (seen.has(item.timestamp)) return false;
              seen.add(item.timestamp);
              return true;
            }).slice(0, 500); // Limit to last 500 in UI memory
          });
        });
      }
      setLoading(false);
    };

    if (token) {
      initConnection();
    } else {
      setLoading(false);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [apiUrl, token, checkHealth, fetchHistory]);

  return {
    historyData,
    loading,
    backendDown,
    mongodbDown,
    ubidotsDown,
    retrying,
    clearHistory,
    checkHealth,
  };
};
