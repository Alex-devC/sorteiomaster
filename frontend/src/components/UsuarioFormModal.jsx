import React, { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function UsuarioFormModal({ isOpen, onClose, onSave, usuario }) {
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  const isEditing = !!usuario;

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || '');
      setLogin(usuario.usuario || '');
      setSenha('');
      setAtivo(!!usuario.ativo);
    } else {
      setNome('');
      setLogin('');
      setSenha('');
      setAtivo(true);
    }
    setError('');
    setShowSenha(false);
  }, [usuario, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nome.trim() || nome.trim().length < 3) {
      setError('Nome deve possuir pelo menos 3 caracteres.');
      return;
    }
    if (!login.trim() || login.trim().length < 3) {
      setError('Nome de usuário deve possuir pelo menos 3 caracteres.');
      return;
    }
    if (!/^[a-zA-Z0-9_.\-]+$/.test(login.trim())) {
      setError('Nome de usuário deve conter apenas letras, números, ponto, hífen ou sublinhado.');
      return;
    }
    if (!isEditing && (!senha || senha.length < 6)) {
      setError('Senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    const payload = { nome: nome.trim(), usuario: login.trim().toLowerCase(), ativo };
    if (!isEditing) {
      payload.senha = senha;
    }

    const result = await onSave(payload, usuario?.id);
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
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? 'Editar Usuário' : 'Cadastrar Usuário'}</h2>
          <button className="modal-close-btn" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nome Completo *</label>
              <input
                type="text"
                className="form-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
                maxLength={150}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nome de Usuário (Login) *</label>
              <input
                type="text"
                className="form-input"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Ex: joao.silva"
                maxLength={80}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Apenas letras, números, ponto, hífen ou sublinhado.
              </span>
            </div>

            {!isEditing && (
              <div className="form-group">
                <label className="form-label">Senha *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSenha ? 'text' : 'password'}
                    className="form-input"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    maxLength={100}
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
            )}

            <div className="form-group">
              <label className="form-label">Situação</label>
              <select
                className="form-input"
                value={ativo ? 'true' : 'false'}
                onChange={(e) => setAtivo(e.target.value === 'true')}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary-action" disabled={loading}>
              <Save size={16} />
              <span>{loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Cadastrar')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
