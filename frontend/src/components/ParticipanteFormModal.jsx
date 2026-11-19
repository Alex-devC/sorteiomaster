import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export function ParticipanteFormModal({ isOpen, onClose, onSave, participante = null }) {
  const isEditing = !!participante;
  const [nome, setNome] = useState(participante ? participante.nome : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      setError('O nome do participante é obrigatório.');
      return;
    }

    setLoading(true);
    const result = await onSave(nomeTrim, participante ? participante.id : null);
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
          <h2 className="modal-title">
            {isEditing ? 'Editar Participante' : 'Novo Participante'}
          </h2>
          <button onClick={onClose} className="modal-close-btn" disabled={loading} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert-error" style={{ margin: '1rem 1.5rem 0' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="part-nome">
              Nome Completo do Participante <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              id="part-nome"
              type="text"
              className="form-input-text"
              placeholder="Ex: Ana Clara Martins"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
              O nome será normalizado automaticamente para verificação de duplicidade na campanha.
            </span>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0', background: 'transparent' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary-action"
              disabled={loading}
            >
              {loading ? 'Salvando...' : isEditing ? 'Salvar Nome' : 'Cadastrar Participante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
