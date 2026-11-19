import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ParticipanteFormModal } from '../components/ParticipanteFormModal';
import { ParticipanteDeleteModal } from '../components/ParticipanteDeleteModal';
import { ImportacaoModal } from '../components/ImportacaoModal';
import {
  Users,
  PlusCircle,
  Upload,
  ArrowLeft,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  History
} from 'lucide-react';

function traduzirStatusCampanha(s) {
  const map = {
    em_preparacao: 'Em Preparação',
    ativa: 'Ativa',
    finalizada: 'Finalizada',
    cancelada: 'Cancelada'
  };
  return map[s] || s;
}

export function Participantes() {
  const { campanha_id } = useParams();
  const navigate = useNavigate();

  // Dados principais
  const [campanha, setCampanha] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [conferencia, setConferencia] = useState(null);

  // Estados de feedback e controle
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingParticipante, setDeletingParticipante] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Exibir feedback com auto-dismiss
  const mostrarFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg('');
    }, 4500);
  };

  // Buscar dados da campanha
  const carregarCampanha = useCallback(async () => {
    try {
      const res = await api.get(`/admin/campanhas/${campanha_id}`);
      setCampanha(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar dados da campanha.');
      return null;
    }
  }, [campanha_id]);

  // Buscar conferência da campanha
  const carregarConferencia = useCallback(async () => {
    try {
      const res = await api.get(`/admin/campanhas/${campanha_id}/conferencia`);
      setConferencia(res.data);
    } catch (err) {
      // Falha silenciosa na conferência para não bloquear a listagem
      console.error('Erro ao atualizar conferência:', err);
    }
  }, [campanha_id]);

  // Listar participantes com os filtros ativos
  const carregarParticipantes = useCallback(async (termoBusca = buscaAplicada, status = filtroStatus) => {
    try {
      setError('');
      const params = {};
      if (status) params.status = status;
      if (termoBusca && termoBusca.trim() !== '') params.busca = termoBusca.trim();

      const res = await api.get(`/admin/campanhas/${campanha_id}/participantes`, { params });
      setParticipantes(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao buscar participantes da campanha.');
    }
  }, [campanha_id, buscaAplicada, filtroStatus]);

  // Carregamento inicial completo
  const carregarDadosCompletos = useCallback(async () => {
    setLoading(true);
    setError('');
    await Promise.all([
      carregarCampanha(),
      carregarParticipantes(buscaAplicada, filtroStatus),
      carregarConferencia()
    ]);
    setLoading(false);
  }, [carregarCampanha, carregarParticipantes, carregarConferencia, buscaAplicada, filtroStatus]);

  useEffect(() => {
    if (campanha_id) {
      carregarDadosCompletos();
    }
  }, [campanha_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tratar submissão de busca por nome
  const handleBuscar = (e) => {
    if (e) e.preventDefault();
    setBuscaAplicada(buscaInput);
    carregarParticipantes(buscaInput, filtroStatus);
  };

  // Tratar alteração no filtro de status
  const handleChangeStatus = (novoStatus) => {
    setFiltroStatus(novoStatus);
    carregarParticipantes(buscaAplicada, novoStatus);
  };

  // Limpar todos os filtros
  const handleLimparFiltros = () => {
    setBuscaInput('');
    setBuscaAplicada('');
    setFiltroStatus('');
    carregarParticipantes('', '');
  };

  // Salvar participante (Cadastro ou Edição)
  const handleSaveParticipante = async (nome, id) => {
    try {
      if (id) {
        // Edição
        await api.put(`/admin/participantes/${id}`, { nome });
        mostrarFeedback(`Participante '${nome}' atualizado com sucesso!`);
      } else {
        // Cadastro individual
        await api.post(`/admin/campanhas/${campanha_id}/participantes`, { nome });
        mostrarFeedback(`Participante '${nome}' cadastrado com sucesso!`);
      }

      await Promise.all([
        carregarParticipantes(buscaAplicada, filtroStatus),
        carregarConferencia()
      ]);
      return null;
    } catch (err) {
      return {
        error: err.response?.data?.error || 'Erro ao salvar participante. Verifique as regras de negócio.'
      };
    }
  };

  // Excluir participante
  const handleDeleteParticipante = async (id) => {
    try {
      const res = await api.delete(`/admin/participantes/${id}`);
      mostrarFeedback(res.data?.mensagem || 'Participante excluído com sucesso.');
      await Promise.all([
        carregarParticipantes(buscaAplicada, filtroStatus),
        carregarConferencia()
      ]);
      return null;
    } catch (err) {
      return {
        error: err.response?.data?.error || 'Não foi possível excluir o participante.'
      };
    }
  };

  // Callback de sucesso da importação
  const handleImportSuccess = async () => {
    mostrarFeedback('Importação de participantes concluída com sucesso!');
    await Promise.all([
      carregarParticipantes(buscaAplicada, filtroStatus),
      carregarConferencia()
    ]);
  };

  // Permissão para cadastrar/importar: campanhas em preparação ou ativas
  const podeGerenciar = campanha && ['em_preparacao', 'ativa'].includes(campanha.status);

  return (
    <div>
      {/* Botão de retorno às Campanhas */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => navigate('/campanhas')}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.45rem 0.875rem' }}
        >
          <ArrowLeft size={16} />
          <span>Voltar às Campanhas</span>
        </button>
      </div>

      {/* Cabeçalho da Página */}
      <div className="page-header-row" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header-title">Participantes da Campanha</h1>
          <p className="page-header-subtitle">
            {campanha ? (
              <>
                <strong>{campanha.nome}</strong> · Números: <strong>{campanha.numero_inicial} a {campanha.numero_final}</strong> ({campanha.numero_final - campanha.numero_inicial + 1} números) · Situação:{' '}
                <span className={`status-badge status-${campanha.status}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                  {traduzirStatusCampanha(campanha.status)}
                </span>
              </>
            ) : (
              'Carregando dados da campanha...'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/campanhas/${campanha_id}/sorteios`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <History size={16} style={{ color: '#D9A72E' }} />
            <span>Histórico de Sorteios</span>
          </button>

          {podeGerenciar && (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsImportOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Upload size={16} style={{ color: '#D9A72E' }} />
                <span>Importar XLSX / CSV</span>
              </button>

              <button
                type="button"
                className="btn-create-header"
                onClick={() => {
                  setEditingParticipante(null);
                  setIsFormOpen(true);
                }}
              >
                <PlusCircle size={18} />
                <span>Novo Participante</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Card e Métricas de Conferência da Campanha */}
      {conferencia && (
        <div className="card-section" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-navy)', letterSpacing: '0.04em' }}>
              Painel de Conferência e Auditoria da Campanha
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`compatibilidade-badge ${conferencia.compativel ? 'compativel' : 'incompativel'}`}>
                {conferencia.compativel ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                <span>{conferencia.compativel ? 'Configuração Compatível' : 'Configuração Incompatível'}</span>
              </span>
            </div>
          </div>

          <div className="conferencia-card-grid">
            <div className="conferencia-mini-card">
              <div className="conf-number">{conferencia.participantes?.total ?? 0}</div>
              <div className="conf-label">Participantes Total</div>
            </div>
            <div className="conferencia-mini-card" style={{ borderColor: '#A7F3D0' }}>
              <div className="conf-number" style={{ color: '#059669' }}>{conferencia.participantes?.disponiveis ?? 0}</div>
              <div className="conf-label">Part. Disponíveis</div>
            </div>
            <div className="conferencia-mini-card" style={{ borderColor: '#C7D2FE' }}>
              <div className="conf-number" style={{ color: '#4338CA' }}>{conferencia.participantes?.sorteados ?? 0}</div>
              <div className="conf-label">Part. Sorteados</div>
            </div>
            <div className="conferencia-mini-card">
              <div className="conf-number">{conferencia.numeros?.total ?? 0}</div>
              <div className="conf-label">Números Total</div>
            </div>
            <div className="conferencia-mini-card">
              <div className="conf-number" style={{ color: '#0284C7' }}>{conferencia.numeros?.disponiveis ?? 0}</div>
              <div className="conf-label">Nº Disponíveis</div>
            </div>
            <div className="conferencia-mini-card">
              <div className="conf-number" style={{ color: '#64748B' }}>{conferencia.numeros?.sorteados ?? 0}</div>
              <div className="conf-label">Nº Sorteados</div>
            </div>
          </div>

          {conferencia.mensagem && (
            <div style={{ fontSize: '0.8125rem', color: conferencia.compativel ? '#065F46' : '#991B1B', background: conferencia.compativel ? '#F0FDF4' : '#FEF2F2', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', marginTop: '0.5rem' }}>
              {conferencia.mensagem}
            </div>
          )}
        </div>
      )}

      {/* Alerta de Feedback de Sucesso */}
      {feedbackMsg && (
        <div className="alert-feedback-success" role="status" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={18} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Alerta de Erro */}
      {error && (
        <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            type="button"
            onClick={carregarDadosCompletos}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={14} /> Recarregar
          </button>
        </div>
      )}

      {/* Barra de Filtros e Pesquisa */}
      <div className="filter-bar">
        <form onSubmit={handleBuscar} className="filter-search">
          <Search size={18} style={{ color: '#64748B' }} />
          <input
            type="text"
            placeholder="Pesquisar participante por nome..."
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
          />
          <button type="submit" className="btn-secondary" style={{ padding: '0.45rem 0.75rem' }}>
            Buscar
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={filtroStatus}
            onChange={(e) => handleChangeStatus(e.target.value)}
            aria-label="Filtrar por situação"
          >
            <option value="">Todas as Situações</option>
            <option value="disponivel">Disponíveis para Sorteio</option>
            <option value="sorteado">Já Contemplados / Sorteados</option>
          </select>

          {(buscaAplicada || filtroStatus) && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleLimparFiltros}
              title="Limpar Filtros"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.45rem 0.65rem' }}
            >
              <X size={15} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Estado: Carregando */}
      {loading && (
        <div className="card-section state-box">
          <div className="spinner" />
          <p>Carregando participantes...</p>
        </div>
      )}

      {/* Estado: Vazio */}
      {!loading && participantes.length === 0 && !error && (
        <div className="card-section state-box">
          <FolderOpen size={48} style={{ color: '#94A3B8' }} />
          <h3>
            {buscaAplicada || filtroStatus
              ? 'Nenhum participante encontrado com os filtros selecionados'
              : 'Nenhum Participante Cadastrado Nesta Campanha'}
          </h3>
          <p>
            {buscaAplicada || filtroStatus
              ? 'Tente ajustar ou limpar os filtros de busca para encontrar outros participantes.'
              : 'Cadastre participantes individualmente ou importe uma planilha XLSX/CSV com a lista de nomes.'}
          </p>

          {buscaAplicada || filtroStatus ? (
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: '0.75rem' }}
              onClick={handleLimparFiltros}
            >
              Limpar Filtros
            </button>
          ) : podeGerenciar ? (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsImportOpen(true)}
              >
                <Upload size={16} />
                <span>Importar Planilha</span>
              </button>
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => {
                  setEditingParticipante(null);
                  setIsFormOpen(true);
                }}
              >
                <PlusCircle size={18} />
                <span>Cadastrar Primeiro Participante</span>
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Tabela de Participantes */}
      {!loading && participantes.length > 0 && (
        <div className="card-section">
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Exibindo <strong>{participantes.length}</strong> participante(s)
            </span>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Nome do Participante</th>
                  <th style={{ width: '150px' }}>Situação</th>
                  <th style={{ width: '160px' }}>Data de Cadastro</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {participantes.map((p) => {
                  const isSorteado = p.status === 'sorteado';

                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: '#64748B' }}>#{p.id}</td>
                      <td>
                        <strong style={{ color: 'var(--color-navy)' }}>{p.nome}</strong>
                      </td>
                      <td>
                        <span className={`status-badge status-${p.status}`}>
                          {p.status === 'disponivel' ? 'Disponível' : 'Sorteado'}
                        </span>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '0.8125rem' }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.375rem' }}>
                          {!isSorteado ? (
                            <>
                              <button
                                type="button"
                                className="btn-icon-table"
                                title="Editar Nome do Participante"
                                onClick={() => {
                                  setEditingParticipante(p);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit2 size={15} />
                              </button>

                              <button
                                type="button"
                                className="btn-icon-table"
                                title="Excluir Participante"
                                style={{ color: '#DC2626' }}
                                onClick={() => {
                                  setDeletingParticipante(p);
                                  setIsDeleteOpen(true);
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          ) : (
                            <span
                              title="Participante sorteado não pode ser alterado nem excluído"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.75rem',
                                color: '#64748B',
                                background: '#F1F5F9',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px'
                              }}
                            >
                              <Lock size={12} />
                              <span>Contemplado</span>
                            </span>
                          )}
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

      {/* Modais de Gerenciamento */}
      <ParticipanteFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingParticipante(null);
        }}
        onSave={handleSaveParticipante}
        participante={editingParticipante}
      />

      <ParticipanteDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingParticipante(null);
        }}
        onConfirm={handleDeleteParticipante}
        participante={deletingParticipante}
      />

      <ImportacaoModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        campanhaId={campanha_id}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default Participantes;
