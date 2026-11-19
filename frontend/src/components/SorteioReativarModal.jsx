import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  X,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  User,
  Hash,
  Loader2,
  Info
} from 'lucide-react';

export function SorteioReativarModal({ isOpen, onClose, sorteio, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  // Fechar modal com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, submitting]);

  if (!isOpen || !sorteio) return null;

  const handleConfirmarReativacao = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await api.patch(`/admin/sorteios/${sorteio.id}/reativar`);
      onSuccess(res.data);
      onClose();
    } catch (err) {
      const msgErro =
        err.response?.data?.error ||
        'Não foi possível reativar o sorteio. Verifique se o participante ou número já estão ocupados em outro sorteio.';
      setError(msgErro);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reativar-sorteio-title"
    >
      <div className="modal-container" style={{ maxWidth: '500px' }}>
        {/* Cabeçalho */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669'
              }}
            >
              <RotateCw size={20} />
            </div>
            <div>
              <h2 id="modal-reativar-sorteio-title" className="modal-title">
                Reativar Sorteio
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Registro oficial #{sorteio.id}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
          {error && (
            <div className="alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Card Explicativo de Reativação */}
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #A7F3D0',
              borderRadius: '0.625rem',
              padding: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <Info size={17} />
              <span>Condições para Reativação</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#064E3B', marginBottom: '0.75rem', lineHeight: 1.45 }}>
              A reativação restaurará este resultado como <strong>ativo</strong>. Ela somente terá sucesso se tanto o participante quanto o número correspondente ainda estiverem disponíveis na campanha:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', background: '#FFFFFF', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #6EE7B7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <User size={15} style={{ color: '#091A35' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Participante Original</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sorteio.participante_nome}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Hash size={15} style={{ color: '#D9A72E' }} />
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Número Original</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#047857' }}>
                    {sorteio.numero_sorteado}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do cancelamento prévio para contexto */}
          {sorteio.motivo_cancelamento && (
            <div style={{ background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.625rem 0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              <strong>Motivo do cancelamento anterior:</strong> {sorteio.motivo_cancelamento}
            </div>
          )}
        </div>

        {/* Rodapé / Ações */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmarReativacao}
            disabled={submitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(5, 150, 105, 0.2)'
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Reativando...</span>
              </>
            ) : (
              <>
                <RotateCw size={16} />
                <span>Confirmar Reativação</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
