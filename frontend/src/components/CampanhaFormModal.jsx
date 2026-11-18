import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export function CampanhaFormModal({ isOpen, onClose, onSave, campanha = null }) {
  const isEditing = !!campanha;
  const [nome, setNome] = useState(campanha ? campanha.nome : '');
  const [numeroInicial, setNumeroInicial] = useState(campanha ? String(campanha.numero_inicial) : '1');
  const [numeroFinal, setNumeroFinal] = useState(campanha ? String(campanha.numero_final) : '100');
  const [todosPremiados, setTodosPremiados] = useState(campanha ? !!campanha.todos_premiados : false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      setError('O nome da campanha é obrigatório.');
      return;
    }

    const nIni = parseInt(numeroInicial, 10);
    const nFim = parseInt(numeroFinal, 10);

    if (isNaN(nIni) || nIni < 0) {
      setError('O número inicial deve ser um inteiro maior ou igual a 0.');
      return;
    }

    if (isNaN(nFim) || nFim < 0) {
      setError('O número final deve ser um inteiro maior ou igual a 0.');
      return;
    }

    if (nIni > nFim) {
      setError('O número final deve ser maior ou igual ao número inicial.');
      return;
    }

    setLoading(true);
    const payload = {
      nome: nomeTrim,
      numero_inicial: nIni,
      numero_final: nFim,
      todos_premiados: todosPremiados
    };

    const result = await onSave(payload, campanha ? campanha.id : null);
    setLoading(false);

    if (result && result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  const totalCalculado = Math.max(0, (parseInt(numeroFinal, 10) || 0) - (parseInt(numeroInicial, 10) || 0) + 1);

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? 'Editar Campanha' : 'Nova Campanha'}
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
            <label className="form-label" htmlFor="camp-nome">
              Nome da Campanha <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              id="camp-nome"
              type="text"
              className="form-input-text"
              placeholder="Ex: Sorteio de Fim de Ano 2024"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="camp-ini">
                Número Inicial <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="camp-ini"
                type="number"
                min="0"
                className="form-input-text"
                value={numeroInicial}
                onChange={(e) => setNumeroInicial(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="camp-fim">
                Número Final <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="camp-fim"
                type="number"
                min="0"
                className="form-input-text"
                value={numeroFinal}
                onChange={(e) => setNumeroFinal(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="info-badge" style={{ marginBottom: '1.25rem' }}>
            Total de números a serem gerados automaticamente:{' '}
            <strong>{isNaN(totalCalculado) ? 0 : totalCalculado}</strong>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={todosPremiados}
                onChange={(e) => setTodosPremiados(e.target.checked)}
                disabled={loading}
              />
              <span style={{ fontWeight: 600 }}>Todos Premiados (todos_premiados)</span>
            </label>
            <p className="checkbox-hint">
              Quando habilitado, a quantidade de participantes nunca poderá ultrapassar a quantidade de números disponíveis no momento da ativação do sorteio.
            </p>
          </div>

          <div className="modal-footer">
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
              {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
