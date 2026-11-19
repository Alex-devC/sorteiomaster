import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UsuarioFormModal } from '../components/UsuarioFormModal';
import { UsuarioSenhaModal } from '../components/UsuarioSenhaModal';
import {
  Users,
  PlusCircle,
  Edit2,
  KeyRound,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX
} from 'lucide-react';

export function Usuarios() {
  const { user: usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);

  const [isSenhaOpen, setIsSenhaOpen] = useState(false);
  const [senhaUsuario, setSenhaUsuario] = useState(null);

  const carregarUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/usuarios');
      setUsuarios(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const exibirFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  // Salvar (criar ou editar)
  const handleSaveUsuario = async (payload, id) => {
    try {
      if (id) {
        await api.put(`/admin/usuarios/${id}`, payload);
        exibirFeedback('Dados do usuário atualizados com sucesso!');
      } else {
        await api.post('/admin/usuarios', payload);
        exibirFeedback('Novo usuário cadastrado com sucesso!');
      }
      await carregarUsuarios();
      return { success: true };
    } catch (err) {
      return {
        error: err.response?.data?.error || 'Falha ao salvar usuário.'
      };
    }
  };

  // Alterar senha
  const handleSaveSenha = async (id, novaSenha) => {
    try {
      await api.patch(`/admin/usuarios/${id}/senha`, { nova_senha: novaSenha });
      exibirFeedback('Senha redefinida com sucesso!');
      return { success: true };
    } catch (err) {
      return {
        error: err.response?.data?.error || 'Falha ao redefinir a senha.'
      };
    }
  };

  // Ativar / Desativar status
  const handleToggleStatus = async (usuario) => {
    const novoStatus = !usuario.ativo;

    if (!novoStatus) {
      if (usuario.is_admin_principal) {
        setError('A conta do administrador principal não pode ser desativada.');
        return;
      }
      if (usuarioLogado && (usuario.id === usuarioLogado.id || usuario.id === usuarioLogado.sub)) {
        setError('Você não pode desativar a sua própria conta de usuário.');
        return;
      }
    }

    try {
      await api.patch(`/admin/usuarios/${usuario.id}/status`, { ativo: novoStatus });
      exibirFeedback(`Usuário ${usuario.nome} foi ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
      await carregarUsuarios();
    } catch (err) {
      setError(err.response?.data?.error || 'Falha ao alterar a situação do usuário.');
    }
  };

  return (
    <div>
      {/* Cabeçalho da Página */}
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">Gestão de Usuários</h1>
          <p className="page-header-subtitle">
            Cadastre credenciais, gerencie acessos e controle permissões administrativas
          </p>
        </div>

        <button
          type="button"
          className="btn-create-header"
          onClick={() => {
            setEditingUsuario(null);
            setIsFormOpen(true);
          }}
        >
          <PlusCircle size={18} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Alerta de Feedback Positivo */}
      {feedbackMsg && (
        <div className="alert-feedback-success" role="status">
          <CheckCircle2 size={18} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Alerta de Erro */}
      {error && (
        <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Estado: Carregando */}
      {loading && (
        <div className="card-section state-box">
          <div className="spinner" />
          <p>Carregando usuários...</p>
        </div>
      )}

      {/* Estado: Listagem */}
      {!loading && usuarios.length > 0 && (
        <div className="card-section">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Usuário (Login)</th>
                  <th>Perfil / Papel</th>
                  <th>Situação</th>
                  <th>Criado Em</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const isAdminPrincipal = !!u.is_admin_principal;
                  const isProprioUsuario = usuarioLogado && (u.id === usuarioLogado.id || u.id === usuarioLogado.sub);

                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>#{u.id}</td>
                      <td>
                        <strong>{u.nome}</strong>
                        {isProprioUsuario && (
                          <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#D9A72E', fontWeight: 600 }}>
                            (Você)
                          </span>
                        )}
                      </td>
                      <td>
                        <code>@{u.usuario}</code>
                      </td>
                      <td>
                        {isAdminPrincipal ? (
                          <span className="metric-tag tag-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                            <Shield size={12} /> Admin Principal
                          </span>
                        ) : (
                          <span className="metric-tag tag-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                            <Users size={12} /> Operador
                          </span>
                        )}
                      </td>
                      <td>
                        {u.ativo ? (
                          <span className="status-badge status-ativa" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Ativo
                          </span>
                        ) : (
                          <span className="status-badge status-cancelada" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={12} /> Inativo
                          </span>
                        )}
                      </td>
                      <td style={{ color: '#64748B', fontSize: '0.8125rem' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.375rem' }}>
                          {/* Editar */}
                          <button
                            className="btn-icon-table"
                            title="Editar Dados do Usuário"
                            onClick={() => {
                              setEditingUsuario(u);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Alterar Senha */}
                          <button
                            className="btn-icon-table"
                            title="Redefinir Senha"
                            style={{ color: '#D9A72E' }}
                            onClick={() => {
                              setSenhaUsuario(u);
                              setIsSenhaOpen(true);
                            }}
                          >
                            <KeyRound size={16} />
                          </button>

                          {/* Ativar/Desativar */}
                          <button
                            className="btn-icon-table"
                            title={
                              isAdminPrincipal
                                ? 'Conta protegida do administrador principal'
                                : isProprioUsuario
                                ? 'Não é permitido desativar o próprio usuário'
                                : u.ativo
                                ? 'Desativar Usuário'
                                : 'Ativar Usuário'
                            }
                            disabled={isAdminPrincipal || (isProprioUsuario && u.ativo)}
                            style={{
                              color: u.ativo ? '#DC2626' : '#16A34A',
                              opacity: (isAdminPrincipal || (isProprioUsuario && u.ativo)) ? 0.35 : 1,
                              cursor: (isAdminPrincipal || (isProprioUsuario && u.ativo)) ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modais Integrados */}
      <UsuarioFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingUsuario(null);
        }}
        onSave={handleSaveUsuario}
        usuario={editingUsuario}
      />

      <UsuarioSenhaModal
        isOpen={isSenhaOpen}
        onClose={() => {
          setIsSenhaOpen(false);
          setSenhaUsuario(null);
        }}
        onSave={handleSaveSenha}
        usuario={senhaUsuario}
      />
    </div>
  );
}
