import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Layers,
  Hash,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export function Dashboard() {
  const [campanhas, setCampanhas] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [conferencia, setConferencia] = useState(null);
  const [loadingCampanhas, setLoadingCampanhas] = useState(true);
  const [loadingConferencia, setLoadingConferencia] = useState(false);
  const [error, setError] = useState('');

  // 1. Carregar lista de campanhas da API
  const carregarCampanhas = async () => {
    setLoadingCampanhas(true);
    setError('');
    try {
      const response = await api.get('/admin/campanhas');
      const lista = response.data || [];
      setCampanhas(lista);

      // Se houver campanhas, selecionar a primeira por padrão
      if (lista.length > 0) {
        setSelectedId(String(lista[0].id));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar lista de campanhas da API.');
    } finally {
      setLoadingCampanhas(false);
    }
  };

  useEffect(() => {
    carregarCampanhas();
  }, []);

  // 2. Carregar conferência da campanha selecionada
  useEffect(() => {
    if (!selectedId) {
      setConferencia(null);
      return;
    }

    const carregarConferencia = async () => {
      setLoadingConferencia(true);
      try {
        const response = await api.get(`/admin/campanhas/${selectedId}/conferencia`);
        setConferencia(response.data);
      } catch (err) {
        console.error('Erro ao buscar conferência:', err);
      } finally {
        setLoadingConferencia(false);
      }
    };

    carregarConferencia();
  }, [selectedId]);

  // Contadores globais das campanhas
  const totalCampanhas = campanhas.length;
  const campanhasAtivas = campanhas.filter((c) => c.status === 'ativa').length;
  const campanhasPreparacao = campanhas.filter((c) => c.status === 'em_preparacao').length;

  return (
    <div>
      {/* Bloco de Destaque / Seletor de Campanha */}
      <div className="dashboard-hero">
        <div>
          <h1 className="dashboard-hero-title">Painel de Controle Institucional</h1>
          <p className="dashboard-hero-subtitle">
            Acompanhe o status e a conferência das campanhas em tempo real
          </p>
        </div>

        {totalCampanhas > 0 && (
          <div className="campaign-selector-box">
            <label className="campaign-selector-label" htmlFor="select-campanha">
              Campanha em Análise:
            </label>
            <select
              id="select-campanha"
              className="campaign-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {campanhas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Alerta de Erro */}
      {error && (
        <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            onClick={carregarCampanhas}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      )}

      {/* Estado: Carregando Inicial */}
      {loadingCampanhas && (
        <div className="card-section state-box">
          <div className="spinner" />
          <p>Carregando informações da API...</p>
        </div>
      )}

      {/* Estado: Vazio (Nenhuma campanha cadastrada) */}
      {!loadingCampanhas && totalCampanhas === 0 && !error && (
        <div className="card-section state-box">
          <FolderOpen size={48} style={{ color: '#94A3B8' }} />
          <h3>Nenhuma Campanha Cadastrada</h3>
          <p>Não há campanhas registradas no banco de dados para exibição no momento.</p>
        </div>
      )}

      {/* Estado: Dados Carregados */}
      {!loadingCampanhas && totalCampanhas > 0 && (
        <>
          {/* Grid de Métricas da Campanha Selecionada */}
          <div className="metrics-grid">
            {/* Card 1: Campanhas Cadastradas */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Campanhas Totais</span>
                <div className="metric-icon-wrap">
                  <Layers size={18} />
                </div>
              </div>
              <div className="metric-value">{totalCampanhas}</div>
              <div className="metric-tag tag-neutral">
                {campanhasAtivas} ativa(s) | {campanhasPreparacao} prep.
              </div>
            </div>

            {/* Card 2: Números da Campanha */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Números</span>
                <div className="metric-icon-wrap">
                  <Hash size={18} />
                </div>
              </div>
              <div className="metric-value">
                {loadingConferencia ? '...' : conferencia?.numeros?.total ?? 0}
              </div>
              <div className="metric-tag tag-neutral">
                {conferencia?.numeros?.disponiveis ?? 0} disp. | {conferencia?.numeros?.sorteados ?? 0} sort.
              </div>
            </div>

            {/* Card 3: Participantes da Campanha */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Participantes</span>
                <div className="metric-icon-wrap">
                  <Users size={18} />
                </div>
              </div>
              <div className="metric-value">
                {loadingConferencia ? '...' : conferencia?.participantes?.total ?? 0}
              </div>
              <div className="metric-tag tag-neutral">
                {conferencia?.participantes?.disponiveis ?? 0} disp. | {conferencia?.participantes?.sorteados ?? 0} sort.
              </div>
            </div>

            {/* Card 4: Situação da Conferência */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Conferência</span>
                <div className="metric-icon-wrap">
                  {conferencia?.compativel ? (
                    <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                  ) : (
                    <AlertTriangle size={18} style={{ color: '#EF4444' }} />
                  )}
                </div>
              </div>
              <div className="metric-value" style={{ fontSize: '1.25rem', textTransform: 'capitalize' }}>
                {loadingConferencia
                  ? '...'
                  : conferencia?.compativel
                  ? 'Compatível'
                  : 'Incompatível'}
              </div>
              <div
                className={`metric-tag ${
                  conferencia?.compativel ? 'tag-success' : 'tag-danger'
                }`}
              >
                {conferencia?.mensagem || 'Análise de compatibilidade'}
              </div>
            </div>
          </div>

          {/* Tabela Resumo das Campanhas */}
          <div className="card-section">
            <h2 className="card-section-title">
              <span>Relação de Campanhas Cadastradas</span>
            </h2>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Intervalo</th>
                    <th>Todos Premiados</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {campanhas.map((camp) => (
                    <tr key={camp.id}>
                      <td style={{ fontWeight: 600 }}>#{camp.id}</td>
                      <td>
                        <strong>{camp.nome}</strong>
                      </td>
                      <td>
                        {camp.numero_inicial} até {camp.numero_final}
                      </td>
                      <td>{camp.todos_premiados ? 'Sim' : 'Não'}</td>
                      <td>
                        <span className={`status-badge status-${camp.status}`}>
                          {camp.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedId(String(camp.id))}
                          style={{
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '0.375rem',
                            border: '1px solid #CBD5E1',
                            background: selectedId === String(camp.id) ? '#091A35' : '#FFFFFF',
                            color: selectedId === String(camp.id) ? '#D9A72E' : '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          {selectedId === String(camp.id) ? 'Selecionada' : 'Visualizar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
