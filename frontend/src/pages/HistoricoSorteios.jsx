import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SorteioDetalhesModal } from '../components/SorteioDetalhesModal';
import {
  ArrowLeft,
  History,
  Dices,
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Hash,
  Calendar,
  X,
  FileSpreadsheet
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

export function HistoricoSorteios() {
  const { campanha_id } = useParams();
  const navigate = useNavigate();

  // Dados principais
  const [campanha, setCampanha] = useState(null);
  const [sorteios, setSorteios] = useState([]);
  const [todosSorteios, setTodosSorteios] = useState([]); // Para manter métricas globais da campanha

  // Estados de feedback e controle
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [filtroParticipante, setFiltroParticipante] = useState('');
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroStatus, setFiltroStatus] = useState(''); // '' | 'confirmado' | 'cancelado'

  // Modal de Detalhes
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [selectedSorteioId, setSelectedSorteioId] = useState(null);

  // Carregar dados da campanha
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

  // Carregar todos os sorteios (usado para métricas gerais fixas da campanha)
  const carregarTotaisGlobais = useCallback(async () => {
    try {
      const res = await api.get(`/admin/campanhas/${campanha_id}/sorteios`);
      setTodosSorteios(res.data || []);
      return res.data || [];
    } catch (err) {
      console.error('Erro ao consultar métricas globais da campanha:', err);
      return [];
    }
  }, [campanha_id]);

  // Carregar lista de sorteios aplicando os filtros na API
  const carregarSorteiosFiltrados = useCallback(
    async (participante = filtroParticipante, numero = filtroNumero, status = filtroStatus) => {
      try {
        setError('');
        const params = {};
        if (status) params.status = status;
        if (numero !== '' && numero !== null && !isNaN(numero)) {
          params.numero = parseInt(numero, 10);
        }
        if (participante && participante.trim() !== '') {
          params.busca = participante.trim();
        }

        const res = await api.get(`/admin/campanhas/${campanha_id}/sorteios`, { params });
        setSorteios(res.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Erro ao carregar histórico de sorteios.');
      }
    },
    [campanha_id, filtroParticipante, filtroNumero, filtroStatus]
  );

  // Carregamento inicial completo
  const carregarDadosCompletos = useCallback(async () => {
    setLoading(true);
    setError('');
    await Promise.all([
      carregarCampanha(),
      carregarTotaisGlobais(),
      carregarSorteiosFiltrados(filtroParticipante, filtroNumero, filtroStatus)
    ]);
    setLoading(false);
  }, [carregarCampanha, carregarTotaisGlobais, carregarSorteiosFiltrados, filtroParticipante, filtroNumero, filtroStatus]);

  // Atualização manual
  const handleAtualizar = async () => {
    setRefreshing(true);
    await Promise.all([
      carregarCampanha(),
      carregarTotaisGlobais(),
      carregarSorteiosFiltrados(filtroParticipante, filtroNumero, filtroStatus)
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (campanha_id) {
      carregarDadosCompletos();
    }
  }, [campanha_id, carregarDadosCompletos]);

  // Submissão de filtros
  const handleFiltrar = (e) => {
    e.preventDefault();
    carregarSorteiosFiltrados(filtroParticipante, filtroNumero, filtroStatus);
  };

  // Limpeza de filtros
  const handleLimparFiltros = () => {
    setFiltroParticipante('');
    setFiltroNumero('');
    setFiltroStatus('');
    carregarSorteiosFiltrados('', '', '');
  };

  const temFiltroAtivo =
    filtroParticipante.trim() !== '' ||
    filtroNumero !== '' ||
    filtroStatus !== '';

  // Métricas da campanha
  const totalSorteiosGerais = todosSorteios.length;
  const totalAtivosGerais = todosSorteios.filter((s) => s.status === 'confirmado').length;
  const totalCanceladosGerais = todosSorteios.filter((s) => s.status === 'cancelado').length;

  return (
    <div className="historico-sorteios-page">
      {/* Botões de Navegação Superior */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => navigate('/campanhas')}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.45rem 0.875rem' }}
        >
          <ArrowLeft size={16} />
          <span>Voltar às Campanhas</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/campanhas/${campanha_id}/participantes`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <Users size={16} style={{ color: '#0284C7' }} />
            <span>Gerenciar Participantes</span>
          </button>

          {campanha?.status === 'ativa' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(`/sorteio?campanha_id=${campanha_id}`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#B45309', borderColor: '#FDE68A', background: '#FFFBEB' }}
            >
              <Dices size={16} style={{ color: '#D9A72E' }} />
              <span>Abrir Roleta ao Vivo</span>
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={handleAtualizar}
            disabled={refreshing || loading}
            title="Atualizar histórico"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Cabeçalho da Página */}
      <div className="page-header-row" style={{ alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <History size={24} style={{ color: 'var(--color-gold)' }} />
            <h1 className="page-header-title">Histórico de Sorteios</h1>
          </div>
          <p className="page-header-subtitle">
            {campanha ? (
              <>
                Campanha: <strong>{campanha.nome}</strong> · Intervalo:{' '}
                <strong>{campanha.numero_inicial} a {campanha.numero_final}</strong> · Situação:{' '}
                <span className={`status-badge status-${campanha.status}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                  {traduzirStatusCampanha(campanha.status)}
                </span>
              </>
            ) : (
              'Carregando dados da campanha selecionada...'
            )}
          </p>
        </div>
      </div>

      {/* Mensagem de Erro Geral */}
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

      {/* Cards de Métricas Principais da Campanha */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        {/* Total de Sorteios Realizados */}
        <div
          style={{
            background: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem',
            padding: '1.125rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '0.5rem',
              background: 'rgba(9, 26, 53, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-navy)'
            }}
          >
            <History size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy)', lineHeight: 1.1 }}>
              {loading ? '-' : totalSorteiosGerais}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.25rem' }}>
              Total de Sorteios
            </div>
          </div>
        </div>

        {/* Quantidade de Sorteios Ativos */}
        <div
          style={{
            background: 'var(--color-white)',
            border: '1px solid #A7F3D0',
            borderRadius: '0.75rem',
            padding: '1.125rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '0.5rem',
              background: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
              {loading ? '-' : totalAtivosGerais}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.25rem' }}>
              Sorteios Ativos
            </div>
          </div>
        </div>

        {/* Quantidade de Sorteios Cancelados */}
        <div
          style={{
            background: 'var(--color-white)',
            border: '1px solid #FECACA',
            borderRadius: '0.75rem',
            padding: '1.125rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '0.5rem',
              background: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626'
            }}
          >
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626', lineHeight: 1.1 }}>
              {loading ? '-' : totalCanceladosGerais}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.25rem' }}>
              Sorteios Cancelados
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <form onSubmit={handleFiltrar} className="filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Filtro: Participante */}
        <div className="filter-search" style={{ flex: '2', minWidth: '220px' }}>
          <Search size={18} style={{ color: '#64748B' }} />
          <input
            type="text"
            placeholder="Filtrar por participante..."
            value={filtroParticipante}
            onChange={(e) => setFiltroParticipante(e.target.value)}
          />
        </div>

        {/* Filtro: Número sorteado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: '150px' }}>
          <Hash size={18} style={{ color: '#64748B' }} />
          <input
            type="number"
            placeholder="Nº sorteado..."
            value={filtroNumero}
            onChange={(e) => setFiltroNumero(e.target.value)}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              width: '100%',
              outline: 'none'
            }}
          />
        </div>

        {/* Filtro: Situação */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              carregarSorteiosFiltrados(filtroParticipante, filtroNumero, e.target.value);
            }}
          >
            <option value="">Todas as Situações</option>
            <option value="confirmado">Realizados (Ativos)</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        {/* Botão de Filtrar */}
        <button
          type="submit"
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem' }}
        >
          <Filter size={16} />
          <span>Filtrar</span>
        </button>

        {/* Botão de Limpar */}
        {temFiltroAtivo && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLimparFiltros}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', color: '#DC2626' }}
            title="Limpar todos os filtros"
          >
            <X size={16} />
            <span>Limpar</span>
          </button>
        )}
      </form>

      {/* Contagem de resultados quando filtrado */}
      {temFiltroAtivo && !loading && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', paddingLeft: '0.25rem' }}>
          Exibindo <strong>{sorteios.length}</strong> registro(s) encontrado(s) para os filtros aplicados.
        </div>
      )}

      {/* Listagem dos Resultados */}
      <div className="card-section" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div className="spin" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
              <RefreshCw size={24} style={{ color: 'var(--color-gold)' }} />
            </div>
            <p>Carregando histórico de sorteios...</p>
          </div>
        ) : totalSorteiosGerais === 0 ? (
          /* Estado Vazio: Campanha Sem Sorteios */
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(217, 167, 46, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D9A72E',
                marginBottom: '1rem'
              }}
            >
              <Dices size={32} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.375rem' }}>
              Nenhum sorteio registrado até o momento
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              Os resultados dos sorteios realizados na roleta eletrônica para esta campanha serão auditados e listados aqui automaticamente.
            </p>
            {campanha?.status === 'ativa' && (
              <button
                type="button"
                className="btn-create-header"
                onClick={() => navigate(`/sorteio?campanha_id=${campanha_id}`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
              >
                <Dices size={18} />
                <span>Ir para a Roleta ao Vivo</span>
              </button>
            )}
          </div>
        ) : sorteios.length === 0 ? (
          /* Estado Vazio: Filtro não encontrou resultados */
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#F1F5F9',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                marginBottom: '0.875rem'
              }}
            >
              <Search size={28} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
              Nenhum sorteio encontrado para os filtros selecionados
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Tente ajustar os critérios de participante, número ou situação.
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleLimparFiltros}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', margin: '0 auto' }}
            >
              <X size={16} />
              <span>Limpar Filtros</span>
            </button>
          </div>
        ) : (
          /* Tabela com os Sorteios */
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '130px', textAlign: 'center' }}>Número Sorteado</th>
                  <th>Participante</th>
                  <th>Data e Horário</th>
                  <th>Situação</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorteios.map((s) => {
                  const isCancelado = s.status === 'cancelado';
                  return (
                    <tr
                      key={s.id}
                      style={{
                        backgroundColor: isCancelado ? 'rgba(254, 242, 242, 0.4)' : undefined
                      }}
                    >
                      {/* Número sorteado */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: isCancelado
                              ? '#E2E8F0'
                              : 'linear-gradient(135deg, #091A35 0%, #142B4D 100%)',
                            color: isCancelado ? '#64748B' : '#F7C248',
                            border: isCancelado
                              ? '1px solid #CBD5E1'
                              : '1px solid rgba(217, 167, 46, 0.4)',
                            fontWeight: 800,
                            fontSize: '1rem',
                            fontFamily: 'var(--font-display)',
                            borderRadius: '0.5rem',
                            padding: '0.3rem 0.75rem',
                            minWidth: '54px',
                            textAlign: 'center',
                            boxShadow: isCancelado ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          {s.numero_sorteado}
                        </span>
                      </td>

                      {/* Nome do Participante */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: isCancelado ? '#E2E8F0' : 'rgba(9, 26, 53, 0.08)',
                              color: isCancelado ? '#64748B' : 'var(--color-navy)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              flexShrink: 0
                            }}
                          >
                            {s.participante_nome ? s.participante_nome.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: isCancelado ? '#64748B' : 'var(--color-navy)',
                                textDecoration: isCancelado ? 'line-through' : 'none'
                              }}
                            >
                              {s.participante_nome}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              Part. ID #{s.participante_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Data e Horário */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                          <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                          <span>{formatarDataHora(s.sorteado_em)}</span>
                        </div>
                      </td>

                      {/* Situação */}
                      <td>
                        <span
                          className={`status-badge ${isCancelado ? 'status-cancelado' : 'status-confirmado'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.625rem'
                          }}
                        >
                          {isCancelado ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                          <span>{isCancelado ? 'Cancelado' : 'Realizado'}</span>
                        </span>
                      </td>

                      {/* Ações */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-icon-table"
                          title="Visualizar detalhes do sorteio"
                          onClick={() => {
                            setSelectedSorteioId(s.id);
                            setDetalhesModalOpen(true);
                          }}
                          style={{ color: 'var(--color-navy)' }}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Sorteio */}
      <SorteioDetalhesModal
        isOpen={detalhesModalOpen}
        onClose={() => {
          setDetalhesModalOpen(false);
          setSelectedSorteioId(null);
        }}
        sorteioId={selectedSorteioId}
      />
    </div>
  );
}
