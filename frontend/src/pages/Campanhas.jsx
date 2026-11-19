import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CampanhaFormModal } from '../components/CampanhaFormModal';
import { CampanhaDetalhesModal } from '../components/CampanhaDetalhesModal';
import { StatusConfirmModal } from '../components/StatusConfirmModal';
import {
  Layers,
  PlusCircle,
  Eye,
  Edit2,
  Users,
  Dices,
  History,
  PlayCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  FolderOpen,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export function Campanhas() {
  const navigate = useNavigate();
  const [campanhas, setCampanhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Modais de Controle
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState(null);

  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [viewingCampanha, setViewingCampanha] = useState(null);
  const [conferenciaData, setConferenciaData] = useState(null);
  const [loadingConferencia, setLoadingConferencia] = useState(false);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [targetStatusCampanha, setTargetStatusCampanha] = useState(null);
  const [novoStatusAlvo, setNovoStatusAlvo] = useState('');

  // 1. Carregar lista de campanhas da API
  const carregarCampanhas = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/campanhas');
      setCampanhas(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar a listagem de campanhas da API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCampanhas();
  }, []);

  const exibirFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  // 2. Salvar Campanha (Criar ou Editar)
  const handleSaveCampanha = async (payload, id) => {
    try {
      if (id) {
        // Edição PUT /api/admin/campanhas/:id
        await api.put(`/admin/campanhas/${id}`, payload);
        exibirFeedback('Campanha atualizada com sucesso!');
      } else {
        // Criação POST /api/admin/campanhas
        await api.post('/admin/campanhas', payload);
        exibirFeedback('Campanha cadastrada e números gerados com sucesso!');
      }
      await carregarCampanhas();
      return { success: true };
    } catch (err) {
      return {
        error: err.response?.data?.error || 'Não foi possível salvar a campanha. Verifique os dados.'
      };
    }
  };

  // 3. Abrir Detalhes e Carregar Conferência
  const handleAbrirDetalhes = async (campanha) => {
    setViewingCampanha(campanha);
    setIsDetalhesOpen(true);
    setLoadingConferencia(true);
    setConferenciaData(null);

    try {
      const res = await api.get(`/admin/campanhas/${campanha.id}/conferencia`);
      setConferenciaData(res.data);
    } catch (err) {
      console.error('Falha ao obter conferência:', err);
    } finally {
      setLoadingConferencia(false);
    }
  };

  // 4. Alterar Status
  const handleAbrirModalStatus = (campanha, novoStatus) => {
    setTargetStatusCampanha(campanha);
    setNovoStatusAlvo(novoStatus);
    setIsStatusOpen(true);
  };

  const handleConfirmarStatus = async (id, status) => {
    try {
      await api.patch(`/admin/campanhas/${id}/status`, { status });
      exibirFeedback(`Status da campanha alterado para ${status.toUpperCase()}!`);
      await carregarCampanhas();
      return { success: true };
    } catch (err) {
      return {
        error: err.response?.data?.error || 'Falha ao alterar o status da campanha.'
      };
    }
  };

  // Helper para identificar ações permitidas pelo backend
  // em_preparacao -> ativa, cancelada
  // ativa -> finalizada, cancelada
  // finalizada -> []
  // cancelada -> []
  const getAcoesStatusPermitidas = (campanha) => {
    const acoes = [];
    if (campanha.status === 'em_preparacao') {
      acoes.push({
        status: 'ativa',
        label: 'Ativar',
        icon: PlayCircle,
        classe: 'btn-action-ativa'
      });
      acoes.push({
        status: 'cancelada',
        label: 'Cancelar',
        icon: XCircle,
        classe: 'btn-action-cancela'
      });
    } else if (campanha.status === 'ativa') {
      acoes.push({
        status: 'finalizada',
        label: 'Finalizar',
        icon: CheckCircle,
        classe: 'btn-action-finaliza'
      });
      acoes.push({
        status: 'cancelada',
        label: 'Cancelar',
        icon: XCircle,
        classe: 'btn-action-cancela'
      });
    }
    return acoes;
  };

  return (
    <div>
      {/* Cabeçalho da Página */}
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">Gestão de Campanhas</h1>
          <p className="page-header-subtitle">
            Cadastre, configure intervalos e gerencie os estados de execução
          </p>
        </div>

        <button
          type="button"
          className="btn-create-header"
          onClick={() => {
            setEditingCampanha(null);
            setIsFormOpen(true);
          }}
        >
          <PlusCircle size={18} />
          <span>Nova Campanha</span>
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
            onClick={carregarCampanhas}
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

      {/* Estado: Carregando */}
      {loading && (
        <div className="card-section state-box">
          <div className="spinner" />
          <p>Carregando campanhas...</p>
        </div>
      )}

      {/* Estado: Vazio */}
      {!loading && campanhas.length === 0 && !error && (
        <div className="card-section state-box">
          <FolderOpen size={48} style={{ color: '#94A3B8' }} />
          <h3>Nenhuma Campanha Cadastrada</h3>
          <p>Cadastre sua primeira campanha para iniciar a distribuição de números e participantes.</p>
          <button
            type="button"
            className="btn-primary-action"
            style={{ marginTop: '0.75rem' }}
            onClick={() => {
              setEditingCampanha(null);
              setIsFormOpen(true);
            }}
          >
            <PlusCircle size={18} />
            <span>Cadastrar Primeira Campanha</span>
          </button>
        </div>
      )}

      {/* Estado: Listagem de Campanhas */}
      {!loading && campanhas.length > 0 && (
        <div className="card-section">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome da Campanha</th>
                  <th>Intervalo Numérico</th>
                  <th>Todos Premiados</th>
                  <th>Status</th>
                  <th>Data de Criação</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {campanhas.map((camp) => {
                  const acoesPermitidas = getAcoesStatusPermitidas(camp);
                  const podeEditar = camp.status === 'em_preparacao';

                  return (
                    <tr key={camp.id}>
                      <td style={{ fontWeight: 600 }}>#{camp.id}</td>
                      <td>
                        <strong>{camp.nome}</strong>
                      </td>
                      <td>
                        {camp.numero_inicial} até {camp.numero_final}{' '}
                        <span style={{ color: '#64748B', fontSize: '0.8rem' }}>
                          ({camp.numero_final - camp.numero_inicial + 1} números)
                        </span>
                      </td>
                      <td>
                        {camp.todos_premiados ? (
                          <span className="metric-tag tag-success" style={{ fontSize: '0.7rem' }}>
                            Sim
                          </span>
                        ) : (
                          <span className="metric-tag tag-neutral" style={{ fontSize: '0.7rem' }}>
                            Não
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge status-${camp.status}`}>
                          {camp.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ color: '#64748B', fontSize: '0.8125rem' }}>
                        {camp.created_at ? new Date(camp.created_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.375rem' }}>
                          {/* Sorteio / Roleta (Campanhas Ativas) */}
                          {camp.status === 'ativa' && (
                            <button
                              className="btn-icon-table"
                              title="Abrir Roleta ao Vivo desta Campanha"
                              style={{ color: '#D9A72E' }}
                              onClick={() => navigate(`/sorteio?campanha_id=${camp.id}`)}
                            >
                              <Dices size={16} />
                            </button>
                          )}

                          {/* Gerenciar Participantes */}
                          <button
                            className="btn-icon-table"
                            title="Gerenciar Participantes"
                            onClick={() => navigate(`/campanhas/${camp.id}/participantes`)}
                          >
                            <Users size={16} />
                          </button>

                          {/* Histórico de Sorteios */}
                          <button
                            className="btn-icon-table"
                            title="Histórico de Sorteios"
                            style={{ color: '#091A35' }}
                            onClick={() => navigate(`/campanhas/${camp.id}/sorteios`)}
                          >
                            <History size={16} />
                          </button>

                          {/* Visualizar / Detalhes */}
                          <button
                            className="btn-icon-table"
                            title="Consultar Detalhes e Conferência"
                            onClick={() => handleAbrirDetalhes(camp)}
                          >
                            <Eye size={16} />
                          </button>

                          {/* Editar (Apenas se em preparação) */}
                          {podeEditar && (
                            <button
                              className="btn-icon-table"
                              title="Editar Campanha"
                              onClick={() => {
                                setEditingCampanha(camp);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit2 size={16} />
                            </button>
                          )}

                          {/* Ações de Transição de Status Permitidas */}
                          {acoesPermitidas.map((acao) => {
                            const IconComponent = acao.icon;
                            return (
                              <button
                                key={acao.status}
                                className={`btn-status-action ${acao.classe}`}
                                title={`${acao.label} Campanha`}
                                onClick={() => handleAbrirModalStatus(camp, acao.status)}
                              >
                                <IconComponent size={14} />
                                <span>{acao.label}</span>
                              </button>
                            );
                          })}
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
      <CampanhaFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCampanha(null);
        }}
        onSave={handleSaveCampanha}
        campanha={editingCampanha}
      />

      <CampanhaDetalhesModal
        isOpen={isDetalhesOpen}
        onClose={() => {
          setIsDetalhesOpen(false);
          setViewingCampanha(null);
        }}
        campanha={viewingCampanha}
        conferencia={conferenciaData}
        loadingConferencia={loadingConferencia}
      />

      <StatusConfirmModal
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setTargetStatusCampanha(null);
        }}
        onConfirm={handleConfirmarStatus}
        campanha={targetStatusCampanha}
        novoStatus={novoStatusAlvo}
      />
    </div>
  );
}
