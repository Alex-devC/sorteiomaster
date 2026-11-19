import React, { useState } from 'react';
import api from '../services/api';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle
} from 'lucide-react';

export function ImportacaoModal({ isOpen, onClose, campanhaId, onImportSuccess }) {
  const [etapa, setEtapa] = useState(1); // 1: Selecionar Arquivo, 2: Preview, 3: Concluído
  const [arquivo, setArquivo] = useState(null);
  const [colunaSelecionada, setColunaSelecionada] = useState('');
  const [previewData, setPreviewData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultadoFinal, setResultadoFinal] = useState(null);

  if (!isOpen) return null;

  const resetarEstado = () => {
    setEtapa(1);
    setArquivo(null);
    setColunaSelecionada('');
    setPreviewData(null);
    setLoading(false);
    setError('');
    setResultadoFinal(null);
  };

  const handleClose = () => {
    resetarEstado();
    onClose();
  };

  // Passo 1 -> Passo 2: Upload e Obtenção do Preview
  const handleGerarPreview = async (overrideColuna = null) => {
    if (!arquivo) {
      setError('Por favor, selecione um arquivo válido (.xlsx, .xls ou .csv).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      const colToUse = overrideColuna !== null ? overrideColuna : colunaSelecionada;
      if (colToUse !== '') {
        formData.append('coluna', colToUse);
      }

      const response = await api.post(`/admin/campanhas/${campanhaId}/importar/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPreviewData(response.data);
      if (response.data.coluna_selecionada !== undefined && colunaSelecionada === '') {
        setColunaSelecionada(String(response.data.coluna_selecionada));
      }
      setEtapa(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao processar o arquivo. Verifique o formato e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Alterar a coluna selecionada dinamicamente
  const handleChangeColuna = (novaCol) => {
    setColunaSelecionada(novaCol);
    handleGerarPreview(novaCol);
  };

  // Passo 2 -> Passo 3: Confirmação e Inserção no Banco
  const handleConfirmarImportacao = async () => {
    const nomesParaImportar = previewData?.nomes_validos || previewData?.exemplos_validos;
    if (!previewData || !nomesParaImportar || nomesParaImportar.length === 0) {
      setError('Não há registros válidos para importar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // O endpoint de confirmação recebe a lista completa de nomes válidos identificados
      const response = await api.post(`/admin/campanhas/${campanhaId}/importar/confirmar`, {
        nomes: nomesParaImportar
      });

      setResultadoFinal(response.data);
      setEtapa(3);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao confirmar a importação de participantes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '640px' }}>
        {/* Cabeçalho */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <FileSpreadsheet size={20} style={{ color: '#D9A72E' }} />
            <h2 className="modal-title">Importar Participantes (XLSX / CSV)</h2>
          </div>
          <button onClick={handleClose} className="modal-close-btn" disabled={loading} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Indicador Visual de Etapas */}
        <div className="import-stepper">
          <div className={`step-item ${etapa >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span>Arquivo</span>
          </div>
          <div className="step-line" />
          <div className={`step-item ${etapa >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span>Prévia & Validação</span>
          </div>
          <div className="step-line" />
          <div className={`step-item ${etapa >= 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span>Concluído</span>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="alert-error" style={{ margin: '1rem 1.5rem 0' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Corpo do Modal */}
        <div className="modal-body">
          {/* ETAPA 1: SELECIONAR ARQUIVO */}
          {etapa === 1 && (
            <div>
              <div
                className="file-dropzone"
                onClick={() => document.getElementById('input-file-import').click()}
              >
                <UploadCloud size={44} style={{ color: '#D9A72E', marginBottom: '0.75rem' }} />
                <p style={{ fontWeight: 600, color: '#091A35', marginBottom: '0.25rem' }}>
                  Clique para selecionar sua planilha ou arquivo
                </p>
                <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                  Formatos aceitos: <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong> (Máx: 10MB)
                </span>
                <input
                  id="input-file-import"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArquivo(e.target.files[0]);
                      setError('');
                    }
                  }}
                />
              </div>

              {arquivo && (
                <div className="selected-file-card">
                  <FileSpreadsheet size={20} style={{ color: '#091A35' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {arquivo.name}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {(arquivo.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setArquivo(null);
                    }}
                    style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ETAPA 2: PRÉ-VISUALIZAÇÃO & VALIDAÇÃO */}
          {etapa === 2 && previewData && (
            <div>
              {/* Seletor de Coluna */}
              {previewData.colunas && previewData.colunas.length > 1 && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Coluna com os Nomes dos Participantes:</label>
                  <select
                    className="form-input-text"
                    value={colunaSelecionada}
                    onChange={(e) => handleChangeColuna(e.target.value)}
                    disabled={loading}
                  >
                    {previewData.colunas.map((col) => (
                      <option key={col.indice} value={col.indice}>
                        {col.nome} (Coluna {col.indice + 1})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Grid de Resumo das Validações */}
              <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
                <div className="metric-card" style={{ padding: '0.75rem' }}>
                  <span className="metric-title" style={{ fontSize: '0.7rem' }}>Encontrados</span>
                  <div className="metric-value" style={{ fontSize: '1.25rem', margin: 0 }}>
                    {previewData.resumo?.total_encontrados ?? 0}
                  </div>
                </div>

                <div className="metric-card" style={{ padding: '0.75rem', borderColor: '#86EFAC' }}>
                  <span className="metric-title" style={{ fontSize: '0.7rem', color: '#16A34A' }}>Válidos</span>
                  <div className="metric-value" style={{ fontSize: '1.25rem', color: '#16A34A', margin: 0 }}>
                    {previewData.resumo?.validos ?? 0}
                  </div>
                </div>

                <div className="metric-card" style={{ padding: '0.75rem', borderColor: '#FCA5A5' }}>
                  <span className="metric-title" style={{ fontSize: '0.7rem', color: '#DC2626' }}>Duplicados/Inválidos</span>
                  <div className="metric-value" style={{ fontSize: '1.25rem', color: '#DC2626', margin: 0 }}>
                    {(previewData.resumo?.duplicados_no_arquivo ?? 0) +
                      (previewData.resumo?.ja_cadastrados_na_campanha ?? 0) +
                      (previewData.resumo?.vazios ?? 0)}
                  </div>
                </div>
              </div>

              {/* Detalhes de Auditoria da Prévia */}
              <div className="detail-section" style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', color: '#091A35', marginBottom: '0.5rem' }}>
                  Diagnóstico das Linhas
                </h4>
                <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>✔ Registros aptos para inserção: <strong>{previewData.resumo?.validos ?? 0}</strong></div>
                  <div>○ Nomes em branco/vazios desconsiderados: <strong>{previewData.resumo?.vazios ?? 0}</strong></div>
                  <div>○ Duplicados dentro da mesma planilha: <strong>{previewData.resumo?.duplicados_no_arquivo ?? 0}</strong></div>
                  <div>○ Participantes que já estavam cadastrados na campanha: <strong>{previewData.resumo?.ja_cadastrados_na_campanha ?? 0}</strong></div>
                </div>
              </div>

              {/* Amostra dos Nomes Encontrados */}
              {previewData.exemplos_validos && previewData.exemplos_validos.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                    Amostra de Participantes Válidos:
                  </span>
                  <div className="preview-sample-box">
                    {previewData.exemplos_validos.slice(0, 8).map((nome, i) => (
                      <span key={i} className="preview-pill">
                        {nome}
                      </span>
                    ))}
                    {previewData.exemplos_validos.length > 8 && (
                      <span className="preview-pill" style={{ background: '#CBD5E1' }}>
                        +{previewData.exemplos_validos.length - 8} outros
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ETAPA 3: RESULTADO FINAL */}
          {etapa === 3 && (
            <div className="state-box" style={{ padding: '2rem 1rem' }}>
              <div className="metric-icon-wrap" style={{ width: 56, height: 56, borderRadius: '50%', background: '#ECFDF5', color: '#16A34A', margin: '0 auto' }}>
                <Check size={28} />
              </div>
              <h3 style={{ color: '#091A35', fontSize: '1.25rem', marginTop: '0.75rem' }}>
                Importação Concluída com Sucesso!
              </h3>
              <p style={{ color: '#475569', fontSize: '0.9375rem', maxWidth: 400 }}>
                {resultadoFinal?.mensagem || `${resultadoFinal?.total_efetivamente_importado ?? 0} participantes foram integrados com sucesso à campanha.`}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé das Ações */}
        <div className="modal-footer">
          {etapa === 1 && (
            <>
              <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => handleGerarPreview()}
                disabled={!arquivo || loading}
              >
                {loading ? 'Analisando Arquivo...' : (
                  <>
                    <span>Processar Prévia</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </>
          )}

          {etapa === 2 && (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEtapa(1)}
                disabled={loading}
              >
                <ArrowLeft size={16} />
                <span>Trocar Arquivo</span>
              </button>
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleConfirmarImportacao}
                disabled={loading || (previewData?.resumo?.validos ?? 0) === 0}
              >
                {loading ? 'Confirmando...' : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirmar Importação ({previewData?.resumo?.validos ?? 0})</span>
                  </>
                )}
              </button>
            </>
          )}

          {etapa === 3 && (
            <button type="button" className="btn-primary-action" onClick={handleClose}>
              Finalizar e Ver Participantes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
