import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, RotateCcw, FastForward } from 'lucide-react';

export function CampanhaReativarModal({ isOpen, onClose, onConfirm, campanha }) {
  const [opcao, setOpcao] = useState('continuar'); // 'zerar' | 'continuar'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !campanha) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    const result = await onConfirm(campanha.id, opcao);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <RefreshCw size={20} style={{ marginRight: '8px', color: '#D9A72E' }} />
            Reativar Campanha Finalizada
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            background: '#F8FAFC',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #E2E8F0',
            marginBottom: '1.25rem'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#1E293B', marginBottom: '0.25rem' }}>
              Campanha selecionada: <strong>{campanha.nome}</strong>
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Esta campanha está atualmente <strong>finalizada</strong> e voltará ao status <strong>ativa</strong>.
              Escolha obrigatoriamente uma das formas de reativação abaixo:
            </p>
          </div>

          {error && (
            <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Opção A: Zerar */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: opcao === 'zerar' ? '2px solid #D9A72E' : '1px solid #E2E8F0',
              background: opcao === 'zerar' ? 'rgba(217, 167, 46, 0.05)' : '#FFFFFF',
              cursor: 'pointer',
              marginBottom: '1rem',
              transition: 'all 0.2s'
            }}
          >
            <input
              type="radio"
              name="opcaoReativacao"
              value="zerar"
              checked={opcao === 'zerar'}
              onChange={() => setOpcao('zerar')}
              style={{ marginTop: '0.25rem' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#091A35', marginBottom: '0.25rem' }}>
                <RotateCcw size={16} style={{ color: '#D9A72E' }} />
                <span>OPÇÃO A — Zerar sorteios e reiniciar tudo</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: '1.4' }}>
                A campanha será reiniciada do começo. Sorteios ativos serão cancelados com registro no histórico indicando novo ciclo, todos os participantes e números serão liberados e o status passará a <strong>ativa</strong>. Nenhum dado do histórico é apagado.
              </p>
            </div>
          </label>

          {/* Opção B: Continuar */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: opcao === 'continuar' ? '2px solid #D9A72E' : '1px solid #E2E8F0',
              background: opcao === 'continuar' ? 'rgba(217, 167, 46, 0.05)' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <input
              type="radio"
              name="opcaoReativacao"
              value="continuar"
              checked={opcao === 'continuar'}
              onChange={() => setOpcao('continuar')}
              style={{ marginTop: '0.25rem' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#091A35', marginBottom: '0.25rem' }}>
                <FastForward size={16} style={{ color: '#091A35' }} />
                <span>OPÇÃO B — Continuar de onde parou</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: '1.4' }}>
                A campanha será reativada mantendo seu estado anterior. Todos os sorteios realizados permanecem inalterados, participantes e números contemplados permanecem bloqueados e a campanha volta para o status <strong>ativa</strong>.
              </p>
            </div>
          </label>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleConfirm}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>{loading ? 'Reativando...' : 'Confirmar Reativação'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
