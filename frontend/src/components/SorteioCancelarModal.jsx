import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  X,
  AlertTriangle,
  RotateCcw,
  User,
  Hash,
  Loader2
} from 'lucide-react';

export function SorteioCancelarModal({ isOpen, onClose, sorteio, onSuccess }) {
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMotivo('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motivo.trim() || motivo.trim().length < 3) {
      setError('Por favor, informe um motivo válido com pelo menos 3 caracteres.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.patch(`/admin/sorteios/${sorteio.id}/cancelar`, {
        motivo_cancelamento: motivo.trim()
      });
      onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cancelar o sorteio. Tente novamente.');
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
      aria-labelledby="modal-cancelar-sorteio-title"
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
                background: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626'
              }}
            >
              <RotateCcw size={20} />
            </div>
            <div>
              <h2 id="modal-cancelar-sorteio-title" className="modal-title">
                Cancelar Sorteio
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

        {/* Formulário / Corpo */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
            {error && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Caixa Informativa de Liberação */}
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '0.625rem',
                padding: '1rem',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.625rem' }}>
                <AlertTriangle size={17} />
                <span>Atenção: Ação de Liberação</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#7F1D1D', marginBottom: '0.75rem', lineHeight: 1.45 }}>
                Ao confirmar o cancelamento, este sorteio será marcado como <strong>cancelado</strong> no histórico oficial. O participante e o número voltarão a ficar imediatamente disponíveis para novos sorteios:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', background: '#FFFFFF', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #FCA5A5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <User size={15} style={{ color: '#091A35' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Participante</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sorteio.participante_nome}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Hash size={15} style={{ color: '#D9A72E' }} />
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Número Liberado</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#B45309' }}>
                      {sorteio.numero_sorteado}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campo: Motivo do Cancelamento */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="motivo-cancelamento-input" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-navy)', marginBottom: '0.375rem' }}>
                Motivo do Cancelamento <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                id="motivo-cancelamento-input"
                rows={3}
                placeholder="Descreva detalhadamente o motivo do cancelamento deste sorteio (ex: participante ausente, erro de operação)..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={submitting}
                maxLength={500}
                style={{
                  width: '100%',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                <span>Mínimo 3 caracteres para auditoria.</span>
                <span>{motivo.length}/500</span>
              </div>
            </div>
          </div>

          {/* Rodapé / Ações */}
          <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Manter Sorteio
            </button>
            <button
              type="submit"
              disabled={submitting || !motivo.trim() || motivo.trim().length < 3}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: submitting || !motivo.trim() || motivo.trim().length < 3 ? 'not-allowed' : 'pointer',
                opacity: submitting || !motivo.trim() || motivo.trim().length < 3 ? 0.7 : 1,
                boxShadow: '0 1px 2px rgba(220, 38, 38, 0.2)'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Cancelando...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  <span>Confirmar Cancelamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
