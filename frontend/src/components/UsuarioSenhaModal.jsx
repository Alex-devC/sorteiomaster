import React, { useState } from 'react';
import { X, Eye, EyeOff, KeyRound, AlertCircle, Save } from 'lucide-react';

export function UsuarioSenhaModal({ isOpen, onClose, onSave, usuario }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !usuario) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!novaSenha || novaSenha.length < 6) {
      setError('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      setError('A confirmação da senha não confere.');
      return;
    }

    setLoading(true);
    const result = await onSave(usuario.id, novaSenha);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setNovaSenha('');
      setConfirmar('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <KeyRound size={20} style={{ marginRight: '8px', color: '#D9A72E' }} />
            Alterar Senha
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ marginBottom: '1rem', color: '#64748B', fontSize: '0.875rem' }}>
              Redefinindo a senha de <strong>{usuario.nome}</strong> ({usuario.usuario})
            </p>

            {error && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nova Senha *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showSenha ? 'text' : 'password'}
                  className="form-input"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  maxLength={100}
                  autoFocus
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748B'
                  }}
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar Nova Senha *</label>
              <input
                type={showSenha ? 'text' : 'password'}
                className="form-input"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repita a nova senha"
                maxLength={100}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary-action" disabled={loading}>
              <Save size={16} />
              <span>{loading ? 'Salvando...' : 'Alterar Senha'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
