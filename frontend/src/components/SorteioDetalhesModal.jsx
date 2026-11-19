import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  X,
  Award,
  Calendar,
  Clock,
  User,
  Hash,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

function formatarDataHora(isoString) {
  if (!isoString) return '-';
  try {
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function SorteioDetalhesModal({ isOpen, onClose, sorteioId }) {
  const [sorteio, setSorteio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !sorteioId) {
      setSorteio(null);
      setError('');
      return;
    }

    let isMounted = true;
    async function carregarDetalhes() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/admin/sorteios/${sorteioId}`);
        if (isMounted) {
          setSorteio(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Erro ao consultar detalhes do sorteio.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    carregarDetalhes();

    return () => {
      isMounted = false;
    };
  }, [isOpen, sorteioId]);

  // Fechar com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCancelado = sorteio?.status === 'cancelado';

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detalhes-sorteio-title"
    >
      <div className="modal-container" style={{ maxWidth: '520px' }}>
        {/* Cabeçalho */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(217, 167, 46, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D9A72E'
              }}
            >
              <Award size={20} />
            </div>
            <div>
              <h2 id="modal-detalhes-sorteio-title" className="modal-title">
                Auditoria do Sorteio
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Registro oficial #{sorteioId}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 0', gap: '0.75rem' }}>
              <Loader2 size={32} className="spin" style={{ color: '#D9A72E' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Consultando dados oficiais na API...
              </span>
            </div>
          )}

          {error && (
            <div className="alert-error" style={{ margin: '1rem 0' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && sorteio && (
            <div>
              {/* Card Destaque: Número Sorteado e Status */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #091A35 0%, #142B4D 100%)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(217, 167, 46, 0.3)',
                  boxShadow: '0 4px 12px rgba(9, 26, 53, 0.15)',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D9A72E', fontWeight: 700, marginBottom: '0.375rem' }}>
                  Número Contemplado
                </div>

                <div
                  style={{
                    fontSize: '3.25rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-display)',
                    color: '#F7C248',
                    lineHeight: 1,
                    textShadow: '0 0 16px rgba(217, 167, 46, 0.4)',
                    marginBottom: '0.75rem'
                  }}
                >
                  {sorteio.numero_sorteado}
                </div>

                <div>
                  <span
                    className={`status-badge ${isCancelado ? 'status-cancelado' : 'status-confirmado'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      padding: '0.35rem 0.85rem'
                    }}
                  >
                    {isCancelado ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                    {isCancelado ? 'Sorteio Cancelado' : 'Sorteio Realizado (Ativo)'}
                  </span>
                </div>
              </div>

              {/* Informações Estruturadas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.875rem' }}>
                {/* Participante */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: '#F8FAFC',
                    border: '1px solid var(--color-border)',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: '#E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-navy)',
                      fontWeight: 700
                    }}
                  >
                    <User size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Participante
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sorteio.participante_nome}
                    </div>
                  </div>
                </div>

                {/* Data e Horário da Realização */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: '#F8FAFC',
                    border: '1px solid var(--color-border)',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(2, 132, 199, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284C7'
                    }}
                  >
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Data e Horário do Sorteio
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.875rem' }}>
                      {formatarDataHora(sorteio.sorteado_em)}
                    </div>
                  </div>
                </div>

                {/* Caso Cancelado: Dados do cancelamento */}
                {isCancelado && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '0.5rem',
                      padding: '0.875rem 1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
                      <AlertTriangle size={16} />
                      <span>Detalhes do Cancelamento</span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: '#7F1D1D', marginBottom: '0.25rem' }}>
                      <strong>Cancelado em:</strong> {formatarDataHora(sorteio.cancelado_em)}
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: '#7F1D1D' }}>
                      <strong>Motivo:</strong> {sorteio.motivo_cancelamento || 'Nenhum motivo informado no registro.'}
                    </div>
                  </div>
                )}

                {/* Metadados Técnicos / Auditoria */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px dashed var(--color-border)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <div>
                    <strong>ID Registro:</strong> #{sorteio.id}
                  </div>
                  <div>
                    <strong>Campanha ID:</strong> #{sorteio.campanha_id}
                  </div>
                  <div>
                    <strong>Participante ID:</strong> #{sorteio.participante_id}
                  </div>
                  <div>
                    <strong>Número ID:</strong> #{sorteio.numero_id}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ minWidth: '90px' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
