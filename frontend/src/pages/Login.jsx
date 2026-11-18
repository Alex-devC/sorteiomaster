import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!usuario.trim() || !senha) {
      setError('Informe o usuário e a senha para acessar.');
      return;
    }

    setLoading(true);
    const result = await login(usuario.trim(), senha);
    setLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Logo e Cabeçalho */}
        <div className="login-logo-container">
          <img src="/logo.png" alt="Sorteio Master Logo" className="login-logo-img" />
          <h1 className="login-title">Sorteio Master</h1>
          <p className="login-subtitle">Gestão Corporativa e Roletas Eletrônicas</p>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div className="alert-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="usuario">
              Usuário de Acesso
            </label>
            <div className="form-input-container">
              <User className="form-input-icon" size={18} />
              <input
                id="usuario"
                type="text"
                className="form-input"
                placeholder="Ex: admin"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={loading}
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="senha">
              Senha de Acesso
            </label>
            <div className="form-input-container">
              <Lock className="form-input-icon" size={18} />
              <input
                id="senha"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Acessar Painel</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
