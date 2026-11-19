import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function ParticipanteDeleteModal({ isOpen, onClose, onConfirm, participante }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !participante) return null;

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    const result = await onConfirm(participante.id);
    setLoading(false);

    if (result && result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} style={{ color: '#DC2626' }} />
            <h2 className="modal-title">Excluir Participante</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" disabled={loading} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert-error" style={{ margin: '1rem 1.5rem 0' }}>
            <span>{error}</span>
          </div>
        )}

        <div className="modal-body">
          <p style={{ color: '#1E293B', marginBottom: '0.75rem' }}>
            Tem certeza de que deseja excluir o participante <strong>"{participante.nome}"</strong>?
          </p>
          <p style={{ color: '#64748B', fontSize: '0.8125rem' }}>
            Esta ação não poderá ser desfeita. Participantes que já foram sorteados não podem ser excluídos pelo sistema.
          </p>
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
          >
            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </div>
  );
}
