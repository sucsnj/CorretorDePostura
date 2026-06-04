import React, { useState } from 'react';
import { PostureData } from '../../../shared/types';
import { History } from './History';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Activity,
  LogOut,
  Trash2,
  Compass,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface DashboardProps {
  historyData: PostureData[];
  onClearHistory: () => Promise<void>;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  historyData,
  onClearHistory,
  onLogout,
}) => {
  const [clearing, setClearing] = useState(false);

  // Get current state from the latest item in history
  const currentData: PostureData | null = historyData[0] || null;

  // For the chart, we want chronological order (oldest first), and we limit to last 40 readings for visibility
  const chartData = [...historyData]
    .slice(0, 40)
    .reverse();

  const handleClear = async () => {
    if (window.confirm('Deseja realmente limpar todo o histórico de postura do banco de dados?')) {
      setClearing(true);
      try {
        await onClearHistory();
      } catch (err) {
        alert('Erro ao limpar histórico.');
      } finally {
        setClearing(false);
      }
    }
  };

  const formatChartTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatLastUpdatedTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('pt-BR') + ' ' + date.toLocaleDateString('pt-BR');
    } catch {
      return 'N/A';
    }
  };

  // Custom tooltips for recharts matching our premium aesthetic
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="glass-card"
          style={{
            padding: '10px 14px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            margin: 0
          }}
        >
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            {new Date(label).toLocaleString('pt-BR')}
          </p>
          {payload.map((entry: any) => (
            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {entry.name}: {entry.value.toFixed(1)}°
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container">
      {/* Navigation header */}
      <nav className="navbar">
        <div className="nav-logo">
          <Activity size={24} style={{ color: 'var(--color-primary)' }} />
          <span>PosturaFit</span>
        </div>
        <div className="nav-user">
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Olá, <strong style={{ color: 'var(--text-primary)' }}>admin</strong>
          </span>
          <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={onLogout}>
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </nav>

      {/* Main Indicators Grid */}
      <div className="dashboard-grid">
        {/* Card 1: Ângulo Atual */}
        <div className="glass-card indicator-card card-primary">
          <div className="indicator-header">
            <span>ÂNGULO ATUAL</span>
            <Compass size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="indicator-val">
            {currentData ? `${currentData.angulo.toFixed(1)}°` : '--'}
          </div>
          <div className="indicator-sub">
            Medição de inclinação da coluna
          </div>
        </div>

        {/* Card 2: Desvio Atual */}
        <div className="glass-card indicator-card card-warning">
          <div className="indicator-header">
            <span>DESVIO ATUAL</span>
            <Activity size={18} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div className="indicator-val">
            {currentData ? `${currentData.desvio.toFixed(1)}°` : '--'}
          </div>
          <div className="indicator-sub">
            Desvio lateral do sensor MPU6050
          </div>
        </div>

        {/* Card 3: Status da Postura */}
        <div className={`glass-card indicator-card ${currentData ? (currentData.status === 1 ? 'card-success' : 'card-danger') : 'card-primary'}`}>
          <div className="indicator-header">
            <span>STATUS DA POSTURA</span>
            {currentData ? (
              currentData.status === 1 ? (
                <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
              ) : (
                <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
              )
            ) : (
              <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
            )}
          </div>
          <div style={{ marginTop: '4px' }}>
            {currentData ? (
              currentData.status === 1 ? (
                <span className="status-pill success">
                  <span className="pulse-dot success"></span>
                  🟢 Postura correta
                </span>
              ) : (
                <span className="status-pill danger">
                  <span className="pulse-dot danger"></span>
                  🔴 Corrija a postura
                </span>
              )
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '20px', fontWeight: 600 }}>
                Aguardando dados...
              </span>
            )}
          </div>
          <div className="indicator-sub" style={{ marginTop: '12px' }}>
            Regra validada no ESP32
          </div>
        </div>

        {/* Card 4: Última Atualização */}
        <div className="glass-card indicator-card card-primary">
          <div className="indicator-header">
            <span>ÚLTIMA ATUALIZAÇÃO</span>
            <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="indicator-val" style={{ fontSize: '22px', paddingTop: '6px', paddingBottom: '6px' }}>
            {currentData ? new Date(currentData.timestamp).toLocaleTimeString('pt-BR') : '--'}
          </div>
          <div className="indicator-sub" style={{ marginTop: '12px' }}>
            {currentData ? formatLastUpdatedTime(currentData.timestamp) : 'Sem conexões recentes'}
          </div>
        </div>
      </div>

      {/* Charts & History Layout Grid */}
      <div className="charts-grid">
        {/* Real-time Evolution Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header">
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Gráfico em Tempo Real</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Comparativo de ângulo e desvio das últimas 40 leituras
              </p>
            </div>
            <button
              className="btn btn-danger"
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={handleClear}
              disabled={clearing || historyData.length === 0}
            >
              <Trash2 size={14} />
              {clearing ? 'Limpando...' : 'Limpar Histórico'}
            </button>
          </div>

          <div style={{ width: '100%', height: '340px', flexGrow: 1, minHeight: '300px' }}>
            {chartData.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Aguardando dados do Ubidots para renderizar o gráfico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAngulo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatChartTime}
                    stroke="var(--text-muted)"
                    style={{ fontSize: '10px' }}
                  />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: '10px' }} unit="°" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="angulo"
                    name="Ângulo"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="desvio"
                    name="Desvio"
                    stroke="var(--color-warning)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* History Table */}
        <div style={{ height: '100%' }}>
          <History data={historyData} />
        </div>
      </div>
    </div>
  );
};
