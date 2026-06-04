import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ServiceErrorProps {
  backendDown: boolean;
  mongodbDown: boolean;
  ubidotsDown: boolean;
  onRetry: () => void;
  retrying: boolean;
}

export const ServiceError: React.FC<ServiceErrorProps> = ({
  backendDown,
  mongodbDown,
  ubidotsDown,
  onRetry,
  retrying,
}) => {
  return (
    <div className="error-screen">
      <div className="glass-card" style={{ width: '100%' }}>
        <div className="error-icon" style={{ margin: '0 auto 24px auto' }}>
          <AlertCircle size={40} />
        </div>
        <h2 className="error-title">Serviço Indisponível</h2>
        <p className="error-desc" style={{ marginBottom: '24px' }}>
          {backendDown
            ? 'Não foi possível conectar ao servidor local ou remoto. Certifique-se de que o backend está rodando no Render e as portas estão corretas.'
            : 'O servidor está ativo, mas uma ou mais dependências de infraestrutura falharam:'}
        </p>

        {!backendDown && (
          <div style={{ textAlign: 'left', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Banco de Dados MongoDB</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Armazenamento persistente Atlas</p>
              </div>
              <span className={`status-pill ${mongodbDown ? 'danger' : 'success'}`}>
                <span className={`pulse-dot ${mongodbDown ? 'danger' : 'success'}`}></span>
                {mongodbDown ? 'Falhou' : 'Conectado'}
              </span>
            </div>

            <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Integração Ubidots STEM</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dispositivo posturaesp32</p>
              </div>
              <span className={`status-pill ${ubidotsDown ? 'danger' : 'success'}`}>
                <span className={`pulse-dot ${ubidotsDown ? 'danger' : 'success'}`}></span>
                {ubidotsDown ? 'Falhou' : 'Conectado'}
              </span>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary btn-block"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? (
            <>
              <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
              Verificando integridade...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Testar Conexão Novamente
            </>
          )}
        </button>
      </div>
    </div>
  );
};
