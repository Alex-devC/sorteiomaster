import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function StatusConfirmModal({ isOpen, onClose, onConfirm, campanha, novoStatus }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !campanha || !novoStatus) return null;

  const getStatusDescricao = (status) => {
    switch (status) {
      case 'ativa':
        return {
          titulo: 'Ativar Campanha',
          msg: 'Ao ativar a campanha, ela ficará disponível para a realização de sorteios. Caso a opção "Todos Premiados" esteja ativa, os participantes não poderão exceder os números disponíveis.',
          btnTexto: 'Confirmar Ativação',
          btnClasse: 'btn-success-action'
        };
      case 'finalizada':
        return {
          titulo: 'Finalizar Campanha',
          msg: 'Ao finalizar a campanha, novos sorteios e cadastros serão permanentemente bloqueados. Essa ação encerra o ciclo de vida da campanha.',
          btnTexto: 'Finalizar Campanha',
          btnClasse: 'btn-warning-action'
        };
      case 'cancelada':
        return {
          titulo: 'Cancelar Campanha',
          msg: 'Tem certeza de que deseja cancelar esta campanha? Ela será suspensa e não poderá receber novos sorteios.',
          btnTexto: 'Confirmar Cancelamento',
          btnClasse: 'btn-danger-action'
        };
      default:
        return {
          titulo: 'Alterar Status',
          msg: `Deseja alterar o status da campanha para ${novoStatus}?`,
          btnTexto: 'Confirmar',
          btnClasse: 'btn-primary-action'
        };
    }
  };

  const info = getStatusDescricao(novoStatus);

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    const result = await onConfirm(campanha.id, novoStatus);
    setLoading(false);

    if (result && result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} style={{ color: novoStatus === 'cancelada' ? '#EF4444' : '#F59E0B' }} />
            <h2 className="modal-title">{info.titulo}</h2>
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
          <p style={{ color: '#334155', marginBottom: '1rem' }}>
            Campanha: <strong>{campanha.nome}</strong> (ID #{campanha.id})
          </p>
          <div className="status-transition-box">
            <span>Status Atual: <strong className={`status-badge status-${campanha.status}`}>{campanha.status}</strong></span>
            <span style={{ margin: '0 0.5rem' }}>→</span>
            <span>Novo Status: <strong className={`status-badge status-${novoStatus}`}>{novoStatus}</strong></span>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '1rem' }}>
            {info.msg}
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Voltar
          </button>
          <button
            type="button"
            className={info.btnClasse}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processando...' : info.btnTexto}
          </button>
        </div>
      </div>
    </div>
  );
}
