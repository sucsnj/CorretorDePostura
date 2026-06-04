export interface PostureData {
  timestamp: number; // Original Ubidots timestamp in milliseconds
  angulo: number;
  desvio: number;
  status: number; // 1 = Correta, 0 = Incorreta
}

export interface User {
  username: string;
  token: string;
}
