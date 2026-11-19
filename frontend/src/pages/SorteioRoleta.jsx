import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import audioEngine from '../utils/audioEngine';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Search,
  UserCheck,
  UserX,
  AlertCircle,
  Trophy,
  CheckCircle,
  Dices,
  Shield,
  Sparkles,
  X,
  RotateCcw
} from 'lucide-react';
import '../styles/roleta.css';

export function SorteioRoleta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCampanhaId = searchParams.get('campanha_id');

  // Estados de dados
  const [campanhasAtivas, setCampanhasAtivas] = useState([]);
  const [campanhaSelecionadaId, setCampanhaSelecionadaId] = useState(initialCampanhaId || '');
  const [campanhaData, setCampanhaData] = useState(null);
  const [participantesDisponiveis, setParticipantesDisponiveis] = useState([]);
  const [numerosDisponiveis, setNumerosDisponiveis] = useState([]);

  // Estados de seleção e controle
  const [participanteSelecionado, setParticipanteSelecionado] = useState(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [dropdownAberto, setDropdownAberto] = useState(false);

  // Estados de execução do sorteio
  const [isSpinning, setIsSpinning] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusLabel, setStatusLabel] = useState('Pronto para girar');
  const [isMuted, setIsMuted] = useState(audioEngine.isMuted);

  // Modal de resultado cerimonial
  const [resultadoSorteio, setResultadoSorteio] = useState(null);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Referências para Canvas e Animação
  const canvasRef = useRef(null);
  const confettiCanvasRef = useRef(null);
  const currentRotationRef = useRef(0);
  const animFrameIdRef = useRef(null);
  const confettiAnimIdRef = useRef(null);

  // ─── 1. Carregar Campanhas Ativas ──────────────────────────────────
  const carregarCampanhasAtivas = useCallback(async () => {
    try {
      const res = await api.get('/admin/campanhas');
      const ativas = (res.data || []).filter(c => c.status === 'ativa');
      setCampanhasAtivas(ativas);

      // Se houver parâmetro na URL e for ativa, seleciona ela; caso contrário seleciona a primeira ativa
      if (initialCampanhaId && ativas.some(c => String(c.id) === String(initialCampanhaId))) {
        setCampanhaSelecionadaId(initialCampanhaId);
      } else if (ativas.length > 0 && !campanhaSelecionadaId) {
        setCampanhaSelecionadaId(String(ativas[0].id));
      }
    } catch (err) {
      setErrorMsg('Erro ao consultar campanhas ativas.');
    } finally {
      setLoadingInitial(false);
    }
  }, [initialCampanhaId, campanhaSelecionadaId]);

  useEffect(() => {
    carregarCampanhasAtivas();
  }, [carregarCampanhasAtivas]);

  // ─── 2. Carregar Dados da Campanha Selecionada ───────────────────────
  const carregarDadosCampanha = useCallback(async (campId) => {
    if (!campId) return;
    try {
      setErrorMsg('');
      const [resCamp, resPart, resNum] = await Promise.all([
        api.get(`/admin/campanhas/${campId}`),
        api.get(`/admin/campanhas/${campId}/participantes/disponiveis`),
        api.get(`/admin/campanhas/${campId}/numeros?status=disponivel`)
      ]);

      setCampanhaData(resCamp.data);
      setParticipantesDisponiveis(resPart.data || []);
      setNumerosDisponiveis(resNum.data || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Erro ao carregar dados da campanha.');
    }
  }, []);

  useEffect(() => {
    if (campanhaSelecionadaId) {
      setParticipanteSelecionado(null);
      setResultadoSorteio(null);
      setShowVictoryModal(false);
      carregarDadosCampanha(campanhaSelecionadaId);
    }
  }, [campanhaSelecionadaId, carregarDadosCampanha]);

  // ─── 3. Desenho da Roleta no Canvas ────────────────────────────────
  const drawWheel = useCallback((rotationAngle, highlightIndex = -1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numSlices = numerosDisponiveis.length;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX - 6;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (numSlices === 0) {
      // Estado sem números disponíveis
      ctx.save();
      ctx.fillStyle = '#091A35';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#D9A72E';
      ctx.font = 'bold 20px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Nenhum número disponível', centerX, centerY);
      ctx.restore();
      return;
    }

    const sliceAngle = (2 * Math.PI) / numSlices;
    const palette = ['#091A35', '#142B4D', '#1A3053', '#0F2342'];

    // Determina o tamanho da fonte com base na quantidade de fatias
    let fontSize = 16;
    if (numSlices > 60) fontSize = 10;
    else if (numSlices > 30) fontSize = 13;

    for (let i = 0; i < numSlices; i++) {
      const angleStart = rotationAngle + (i * sliceAngle);
      const angleEnd = angleStart + sliceAngle;

      // Desenha o segmento de arco
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angleStart, angleEnd);
      ctx.closePath();

      if (i === highlightIndex) {
        // Segmento vencedor destacado em dourado brilhante
        ctx.fillStyle = '#F7C248';
      } else {
        ctx.fillStyle = palette[i % palette.length];
      }
      ctx.fill();

      // Divisórias das fatias
      ctx.strokeStyle = 'rgba(217, 167, 46, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Rótulo numérico voltado para fora
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angleStart + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      if (i === highlightIndex) {
        ctx.fillStyle = '#091A35';
        ctx.font = `900 ${Math.max(fontSize + 4, 16)}px Montserrat, sans-serif`;
      } else {
        ctx.fillStyle = (i % 2 === 0) ? '#FFFFFF' : '#F7C248';
        ctx.font = `700 ${fontSize}px Montserrat, sans-serif`;
      }

      const numVal = numerosDisponiveis[i]?.numero ?? (i + 1);
      ctx.fillText(String(numVal), radius - 16, 0);
      ctx.restore();
    }
  }, [numerosDisponiveis]);

  // Redesenha sempre que os números ou a rotação mudarem
  useEffect(() => {
    drawWheel(currentRotationRef.current, -1);
  }, [drawWheel, numerosDisponiveis]);

  // ─── 4. Efeito de Confetes no Canvas de Vitória ──────────────────────
  const startConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#F7C248', '#FFDF79', '#D9A72E', '#FFFFFF', '#38BDF8', '#10B981', '#EC4899'];
    const particles = Array.from({ length: 80 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 60,
      y: canvas.height / 2 - 40,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.85) * 16,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10,
      tiltSpeed: Math.random() * 0.12 + 0.05,
      gravity: 0.24,
      alpha: 1
    }));

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeCount = 0;

      particles.forEach(p => {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.tilt += p.tiltSpeed;
        p.alpha -= 0.0035;

        if (p.alpha > 0) {
          activeCount++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.tilt);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
          ctx.restore();
        }
      });

      if (activeCount > 0) {
        confettiAnimIdRef.current = requestAnimationFrame(frame);
      }
    }

    if (confettiAnimIdRef.current) cancelAnimationFrame(confettiAnimIdRef.current);
    confettiAnimIdRef.current = requestAnimationFrame(frame);
  }, []);

  // ─── 5. Ação de Girar a Roleta (Consome API + Animação Exata) ────────
  const handleGirarRoleta = async () => {
    if (isSpinning || !participanteSelecionado || !campanhaSelecionadaId || numerosDisponiveis.length === 0) {
      return;
    }

    setErrorMsg('');
    setIsSpinning(true);
    setStatusLabel('Conectando ao sistema de sorteio...');
    audioEngine.playSpinStart();

    let resultadoApi;
    try {
      // 1. REQUISIÇÃO REAL À API — A API É A AUTORIDADE QUE SORTEIA COM CSPRNG E PERSISTE NO MYSQL
      const response = await api.post(`/admin/campanhas/${campanhaSelecionadaId}/sorteios`, {
        participante_id: participanteSelecionado.id
      });
      resultadoApi = response.data;
    } catch (err) {
      // Falha na requisição: interrompe imediatamente sem girar em falso
      setIsSpinning(false);
      setStatusLabel('Pronto para girar');
      setErrorMsg(err.response?.data?.error || 'Erro ao realizar sorteio na API.');
      return;
    }

    // 2. ENCONTRAR O ÍNDICE EXATO DO NÚMERO SORTEADO PELA API
    const winningNumber = resultadoApi.numero_sorteado;
    const targetWinIndex = numerosDisponiveis.findIndex(n => n.numero === winningNumber);

    if (targetWinIndex === -1) {
      // Segurança: se o número não constar na lista local de disponíveis por concorrência
      setIsSpinning(false);
      setStatusLabel('Pronto para girar');
      setErrorMsg(`Número sorteado #${winningNumber} não encontrado na composição atual da roleta.`);
      return;
    }

    setStatusLabel(`Sorteando... Boa sorte, ${participanteSelecionado.nome}!`);

    // 3. CÁLCULO TRIGONOMÉTRICO EXATO DE PARADA NO PONTEIRO SUPERIOR
    // O ponteiro indicador fica no topo (posição de 12 horas = 270 graus = 1.5 * PI radianos)
    const numSlices = numerosDisponiveis.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const targetSliceMidAngle = (targetWinIndex * sliceAngle) + (sliceAngle / 2);
    const desiredFinalRotation = (1.5 * Math.PI) - targetSliceMidAngle;

    // Adiciona 6 voltas completas para uma animação emocionante e fluida
    const extraSpins = 6 * (2 * Math.PI);
    const currentNorm = ((currentRotationRef.current % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    const delta = (((desiredFinalRotation - currentNorm) % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    const totalDelta = extraSpins + delta;

    const startRotation = currentRotationRef.current;
    const finalRotation = startRotation + totalDelta;
    const duration = 5200; // 5.2 segundos
    const startTime = performance.now();
    let lastTickAngle = startRotation;

    // 4. LOOP DE ANIMAÇÃO COM REQUESTANIMATIONFRAME E EASING QUARTIC
    function animateSpin(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Quartic Ease-Out para desaceleração mecânica autêntica
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      currentRotationRef.current = startRotation + (totalDelta * easeProgress);

      // Efeito sonoro de tick ao cruzar limites de fatias
      if (Math.abs(currentRotationRef.current - lastTickAngle) >= sliceAngle) {
        audioEngine.playTick();
        lastTickAngle = currentRotationRef.current;
      }

      drawWheel(currentRotationRef.current, -1);

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animateSpin);
      } else {
        // Parada cravada e alinhamento milimétrico exato
        currentRotationRef.current = finalRotation;
        drawWheel(finalRotation, targetWinIndex);
        setStatusLabel('NÚMERO SORTEADO COM SUCESSO!');

        // Flash de suspense dourado por 1.2 segundos antes do modal triunfante
        setTimeout(() => {
          setResultadoSorteio(resultadoApi);
          setShowVictoryModal(true);
          setIsSpinning(false);
          audioEngine.playVictory();
          startConfetti();
        }, 1200);
      }
    }

    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    animFrameIdRef.current = requestAnimationFrame(animateSpin);
  };

  // ─── 6. Ação Explícita de Novo Sorteio ──────────────────────────────
  const handleNovoSorteio = async () => {
    setShowVictoryModal(false);
    setResultadoSorteio(null);
    setParticipanteSelecionado(null);
    setTermoBusca('');
    setStatusLabel('Pronto para girar');
    setErrorMsg('');

    if (confettiAnimIdRef.current) {
      cancelAnimationFrame(confettiAnimIdRef.current);
    }

    // Atualiza imediatamente os participantes e números disponíveis da API
    if (campanhaSelecionadaId) {
      await carregarDadosCampanha(campanhaSelecionadaId);
    }
  };

  // Alternar Mudo
  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  // Filtro de participantes disponíveis por busca
  const participantesFiltrados = participantesDisponiveis.filter(p =>
    p.nome.toLowerCase().includes(termoBusca.toLowerCase().trim())
  );

  // Iniciais para avatar
  const getInitials = (name) => {
    if (!name) return 'SM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // 16 rebites para o aro da roleta
  const rivets = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 16;
    const x = 50 + 47.6 * Math.cos(angle);
    const y = 50 + 47.6 * Math.sin(angle);
    return { x, y, id: i };
  });

  return (
    <div className="roleta-screen">
      {/* ─── Cabeçalho Superior ───────────────────────────────────────── */}
      <header className="roleta-header">
        <div className="roleta-header-left">
          <button
            type="button"
            className="roleta-back-btn"
            onClick={() => navigate('/campanhas')}
            disabled={isSpinning}
            title="Voltar ao Painel Administrativo"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="roleta-brand">
            <div className="roleta-brand-title">
              <span>Sorteio Master</span>
              <span className="roleta-brand-badge">Ao Vivo</span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Roleta Eletrônica Oficial</span>
          </div>
        </div>

        <div className="roleta-header-right">
          <button
            type="button"
            className="roleta-audio-btn"
            onClick={handleToggleMute}
            title={isMuted ? 'Ativar Efeitos Sonoros' : 'Desativar Som'}
          >
            {isMuted ? <VolumeX size={18} color="#F87171" /> : <Volume2 size={18} color="#F7C248" />}
          </button>
        </div>
      </header>

      {/* ─── Corpo Principal (Mobile First) ────────────────────────────── */}
      <main className="roleta-main-content">
        {/* Mensagem de Erro Geral */}
        {errorMsg && (
          <div className="alert-error" style={{ marginBottom: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => carregarDadosCampanha(campanhaSelecionadaId)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCcw size={14} /> Recarregar
            </button>
          </div>
        )}

        {/* ─── Card de Seleção e Resumo da Campanha Ativa ─────────────── */}
        <div className="roleta-campaign-card">
          <div className="roleta-campaign-top">
            <div className="roleta-live-pill">
              <span className="roleta-live-dot" />
              <span>Campanha Ativa</span>
            </div>

            <div className="roleta-counts-pill">
              <Dices size={14} />
              <span>{numerosDisponiveis.length} números disponíveis</span>
            </div>
          </div>

          {campanhasAtivas.length === 0 && !loadingInitial ? (
            <div style={{ padding: '0.5rem 0', color: '#F87171', fontSize: '0.875rem' }}>
              Nenhuma campanha ativa encontrada no sistema. Ative uma campanha no painel para realizar sorteios.
            </div>
          ) : (
            <select
              className="roleta-campaign-select"
              value={campanhaSelecionadaId}
              onChange={(e) => setCampanhaSelecionadaId(e.target.value)}
              disabled={isSpinning}
              aria-label="Selecionar Campanha Ativa"
            >
              {campanhasAtivas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome} (Números {c.numero_inicial} a {c.numero_final})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ─── Seção de Seleção do Participante ───────────────────────── */}
        <section className="roleta-participant-section">
          <div className="roleta-section-label">
            <span>Participante da Rodada</span>
            <span style={{ color: '#F7C248', fontWeight: 600 }}>
              {participantesDisponiveis.length} aptos
            </span>
          </div>

          {!participanteSelecionado ? (
            <div className="roleta-search-wrapper">
              <div className="roleta-search-input-box">
                <Search size={18} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Pesquisar participante disponível..."
                  value={termoBusca}
                  onChange={(e) => {
                    setTermoBusca(e.target.value);
                    setDropdownAberto(true);
                  }}
                  onFocus={() => setDropdownAberto(true)}
                  disabled={isSpinning || participantesDisponiveis.length === 0}
                />
                {termoBusca && (
                  <button
                    type="button"
                    onClick={() => setTermoBusca('')}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Dropdown de Autocomplete com Participantes Disponíveis */}
              {dropdownAberto && (
                <div className="roleta-dropdown-results">
                  {participantesFiltrados.length === 0 ? (
                    <div style={{ padding: '0.625rem', textAlign: 'center', fontSize: '0.8125rem', color: '#94A3B8' }}>
                      Nenhum participante disponível encontrado
                    </div>
                  ) : (
                    participantesFiltrados.slice(0, 15).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className="roleta-dropdown-item"
                        onClick={() => {
                          setParticipanteSelecionado(p);
                          setDropdownAberto(false);
                          setTermoBusca('');
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <div className="roleta-avatar-small">
                            {getInitials(p.nome)}
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.nome}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>
                          Selecionar
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              <div className="roleta-select-prompt">
                <AlertCircle size={15} color="#F7C248" />
                <span>Escolha um participante disponível acima para liberar o giro da roleta.</span>
              </div>
            </div>
          ) : (
            /* Card do Participante Selecionado */
            <div className="roleta-selected-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                <div className="roleta-selected-avatar">
                  {getInitials(participanteSelecionado.nome)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span className="roleta-selected-name">
                    {participanteSelecionado.nome}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <UserCheck size={13} /> Apto para o Sorteio
                  </span>
                </div>
              </div>

              {!isSpinning && (
                <button
                  type="button"
                  className="roleta-change-btn"
                  onClick={() => setParticipanteSelecionado(null)}
                  title="Trocar Participante"
                >
                  <UserX size={15} />
                  <span>Trocar</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* ─── Palco Central da Roleta Eletrônica ─────────────────────── */}
        <section className="roleta-stage" aria-label="Roleta Eletrônica Sorteio Master">
          {/* Brilho Ambiente Traseiro */}
          <div className="roleta-stage-glow" />

          {/* Chassis Circular */}
          <div className="roleta-chassis">
            {/* Ponteiro Fixo Superior (Ruby & Gold) */}
            <div className="roleta-pointer-wrap">
              <div className="roleta-pointer-shape">
                <div className="roleta-pointer-dot" />
              </div>
            </div>

            {/* Aro Dourado com Rebites */}
            <div className="roleta-rim">
              <div className="roleta-rivets-ring">
                {rivets.map(r => (
                  <div
                    key={r.id}
                    className="roleta-rivet"
                    style={{ left: `${r.x}%`, top: `${r.y}%` }}
                  />
                ))}
              </div>

              {/* Superfície do Canvas da Roleta */}
              <div className="roleta-canvas-surface">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={600}
                />
              </div>

              {/* Cubo Central de Bronze (Badge Sorteio Master) */}
              <div className="roleta-hub">
                <div className="roleta-hub-inner">
                  <Sparkles size={16} className="roleta-hub-star" />
                  <span className="roleta-hub-title">SORTEIO</span>
                  <span className="roleta-hub-sub">MASTER</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback de Status do Giro */}
          <div className="roleta-status-feedback">
            {isSpinning ? (
              <span style={{ color: '#F7C248', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Dices size={16} className="animate-spin" /> {statusLabel}
              </span>
            ) : (
              <span>{statusLabel}</span>
            )}
          </div>
        </section>

        {/* ─── Botão Hero de Ação (Girar Roleta) ───────────────────────── */}
        <div className="roleta-action-container">
          <button
            type="button"
            className={`roleta-btn-spin ${
              isSpinning ? 'spinning' : participanteSelecionado && numerosDisponiveis.length > 0 ? 'ready' : 'disabled'
            }`}
            onClick={handleGirarRoleta}
            disabled={isSpinning || !participanteSelecionado || numerosDisponiveis.length === 0}
          >
            <Dices size={22} />
            <span>
              {isSpinning
                ? 'SORTEANDO NÚMERO...'
                : !participanteSelecionado
                ? 'SELECIONE UM PARTICIPANTE'
                : numerosDisponiveis.length === 0
                ? 'SEM NÚMEROS DISPONÍVEIS'
                : 'GIRAR ROLETA'}
            </span>
          </button>

          <div className="roleta-audit-caption">
            <Shield size={13} color="#D9A72E" />
            <span>Sorteio Criptográfico CSPRNG Auditado e Registrado pela API</span>
          </div>
        </div>
      </main>

      {/* ─── Modal / Overlay Cerimonial de Vitória ─────────────────────── */}
      {showVictoryModal && resultadoSorteio && (
        <div className="roleta-victory-overlay" role="dialog" aria-modal="true">
          <canvas ref={confettiCanvasRef} className="roleta-confetti-canvas" />

          <div className="roleta-victory-card">
            <div className="roleta-victory-glow" />

            <div className="roleta-trophy-badge">
              <Trophy size={36} />
            </div>

            <span className="roleta-victory-subtitle">PARABÉNS!</span>

            <h2 className="roleta-winner-name">
              {resultadoSorteio.participante_nome || participanteSelecionado?.nome}
            </h2>

            <div className="roleta-result-box">
              <span className="roleta-result-caption">NÚMERO CONTEMPLADO</span>
              <div className="roleta-result-number">
                {resultadoSorteio.numero_sorteado}
              </div>
              <span className="roleta-auth-badge">
                <CheckCircle size={14} /> Registro Oficial Autenticado #{resultadoSorteio.id}
              </span>
            </div>

            <button
              type="button"
              className="roleta-btn-next"
              onClick={handleNovoSorteio}
            >
              <RotateCcw size={18} />
              <span>NOVO SORTEIO</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SorteioRoleta;
