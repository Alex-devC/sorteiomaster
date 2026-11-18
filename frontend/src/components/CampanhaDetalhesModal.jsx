import React from 'react';
import { X, CheckCircle2, AlertTriangle, Layers, Hash, Users, ShieldAlert } from 'lucide-react';

export function CampanhaDetalhesModal({ isOpen, onClose, campanha, conferencia, loadingConferencia }) {
  if (!isOpen || !campanha) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="metric-icon-wrap" style={{ background: '#091A35', color: '#D9A72E' }}>
              <Layers size={18} />
            </div>
            <div>
              <h2 className="modal-title">{campanha.nome}</h2>
              <span className="modal-subtitle">ID #{campanha.id} — Detalhes e Auditoria</span>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Informações Gerais */}
          <div className="detail-section">
            <h3 className="detail-section-title">Dados Estruturais</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Status Atual</span>
                <span className={`status-badge status-${campanha.status}`}>
                  {campanha.status.replace('_', ' ')}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Intervalo de Números</span>
                <span className="detail-value">
                  {campanha.numero_inicial} até {campanha.numero_final}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Modo Todos Premiados</span>
                <span className="detail-value">
                  {campanha.todos_premiados ? 'Habilitado (true)' : 'Desabilitado (false)'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Data de Criação</span>
                <span className="detail-value">
                  {campanha.created_at ? new Date(campanha.created_at).toLocaleString('pt-BR') : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Seção de Conferência em Tempo Real */}
          <div className="detail-section" style={{ marginTop: '1.25rem' }}>
            <h3 className="detail-section-title">
              <span>Conferência de Compatibilidade</span>
              {conferencia && (
                <span className={`metric-tag ${conferencia.compativel ? 'tag-success' : 'tag-danger'}`} style={{ marginLeft: 'auto' }}>
                  {conferencia.compativel ? 'Compatível' : 'Incompatível'}
                </span>
              )}
            </h3>

            {loadingConferencia ? (
              <div className="state-box" style={{ padding: '2rem' }}>
                <div className="spinner" />
                <p>Consultando conferência na API...</p>
              </div>
            ) : conferencia ? (
              <div>
                <div className="metrics-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="metric-card" style={{ padding: '0.875rem' }}>
                    <div className="metric-header" style={{ marginBottom: '0.25rem' }}>
                      <span className="metric-title">Números</span>
                      <Hash size={16} />
                    </div>
                    <div className="metric-value" style={{ fontSize: '1.35rem', marginBottom: 0 }}>
                      {conferencia.numeros?.total ?? 0}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {conferencia.numeros?.disponiveis ?? 0} disp. | {conferencia.numeros?.sorteados ?? 0} sort.
                    </span>
                  </div>

                  <div className="metric-card" style={{ padding: '0.875rem' }}>
                    <div className="metric-header" style={{ marginBottom: '0.25rem' }}>
                      <span className="metric-title">Participantes</span>
                      <Users size={16} />
                    </div>
                    <div className="metric-value" style={{ fontSize: '1.35rem', marginBottom: 0 }}>
                      {conferencia.participantes?.total ?? 0}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {conferencia.participantes?.disponiveis ?? 0} disp. | {conferencia.participantes?.sorteados ?? 0} sort.
                    </span>
                  </div>
                </div>

                <div className={`conferencia-status-box ${conferencia.compativel ? 'compativel' : 'incompativel'}`}>
                  {conferencia.compativel ? (
                    <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0 }} />
                  ) : (
                    <ShieldAlert size={20} style={{ color: '#EF4444', flexShrink: 0 }} />
                  )}
                  <div>
                    <strong>{conferencia.situacao_compatibilidade === 'compativel' ? 'Configuração Aprovada' : 'Atenção Necessária'}</strong>
                    <p style={{ margin: 0, fontSize: '0.8125rem' }}>{conferencia.mensagem}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Nenhum dado de conferência retornado.</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
