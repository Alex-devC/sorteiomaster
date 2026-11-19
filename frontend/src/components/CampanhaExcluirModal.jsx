import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

export function CampanhaExcluirModal({ isOpen, onClose, onConfirm, campanha }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !campanha) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    const result = await onConfirm(campanha.id);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
          <h2 className="modal-title" style={{ color: '#991B1B' }}>
            <AlertTriangle size={22} style={{ marginRight: '8px', color: '#DC2626' }} />
            Excluir Campanha
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            marginBottom: '1rem'
          }}>
            <p style={{ fontWeight: 600, color: '#991B1B', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              ⚠️ Atenção: Esta operação é irreversível!
            </p>
            <p style={{ color: '#7F1D1D', fontSize: '0.875rem' }}>
              Ao excluir a campanha <strong>"{campanha.nome}"</strong>, todos os dados associados serão permanentemente removidos:
            </p>
            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', color: '#991B1B', fontSize: '0.85rem' }}>
              <li>Todos os participantes vinculados</li>
              <li>Todos os números gerados</li>
              <li>Todo o histórico de sorteios</li>
              <li>O registro da campanha</li>
            </ul>
          </div>

          <div style={{
            background: '#F8FAFC',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #E2E8F0',
            marginBottom: '0.5rem'
          }}>
            <p style={{ fontSize: '0.85rem', color: '#475569' }}>
              <strong>Campanha:</strong> {campanha.nome}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#475569' }}>
              <strong>Status:</strong>{' '}
              <span className="status-badge status-finalizada" style={{ fontSize: '0.7rem' }}>
                {campanha.status}
              </span>
            </p>
            <p style={{ fontSize: '0.85rem', color: '#475569' }}>
              <strong>Intervalo:</strong> {campanha.numero_inicial} até {campanha.numero_final}
            </p>
          </div>

          {error && (
            <div className="alert-error" style={{ marginTop: '1rem' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-danger-action"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#DC2626', color: '#FFF', padding: '0.625rem 1.25rem',
              border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600
            }}
          >
            <Trash2 size={16} />
            <span>{loading ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
