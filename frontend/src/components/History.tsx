import React from 'react';
import { PostureData } from '../../../shared/types';
import { Clock, ShieldCheck, ShieldAlert } from 'lucide-react';

interface HistoryProps {
  data: PostureData[];
}

export const History: React.FC<HistoryProps> = ({ data }) => {
  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'Data Inválida';
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: 0 }}>
      <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={18} style={{ color: 'var(--color-primary)' }} />
        Histórico de Leituras
      </h3>

      <div className="table-wrapper" style={{ flexGrow: 1 }}>
        {data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Nenhuma medição encontrada no banco de dados.
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Ângulo</th>
                <th>Desvio</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={`${item.timestamp}-${index}`}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(item.timestamp)}</td>
                  <td>{item.angulo.toFixed(1)}°</td>
                  <td>{item.desvio.toFixed(1)}°</td>
                  <td>
                    {item.status === 1 ? (
                      <span
                        style={{
                          color: 'var(--color-success)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600,
                        }}
                      >
                        <ShieldCheck size={14} /> Correta
                      </span>
                    ) : (
                      <span
                        style={{
                          color: 'var(--color-danger)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600,
                        }}
                      >
                        <ShieldAlert size={14} /> Incorreta
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
        Total de {data.length} registros exibidos
      </div>
    </div>
  );
};
