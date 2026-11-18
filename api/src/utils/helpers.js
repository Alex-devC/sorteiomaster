'use strict';

/**
 * Utilitários gerais
 */

/**
 * Normaliza o nome para comparação case-insensitive sem espaços extras.
 * @param {string} nome
 * @returns {string}
 */
function normalizarNome(nome) {
  if (!nome) return '';
  return nome.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Gera um array de números inteiros no intervalo [inicio, fim].
 * @param {number} inicio
 * @param {number} fim
 * @returns {number[]}
 */
function gerarIntervalo(inicio, fim) {
  const result = [];
  for (let i = inicio; i <= fim; i++) {
    result.push(i);
  }
  return result;
}

/**
 * Valida a regra de quantidade para campanhas.
 * @param {object} param
 * @param {boolean} param.todosPremiados
 * @param {number} param.totalNumeros
 * @param {number} param.totalParticipantes
 * @returns {{ valido: boolean, mensagem: string|null }}
 */
function validarQuantidades({ todosPremiados, totalNumeros, totalParticipantes }) {
  if (todosPremiados) {
    if (totalParticipantes > totalNumeros) {
      return {
        valido: false,
        mensagem: `Com todos_premiados=true, o número de participantes (${totalParticipantes}) não pode ser maior que o de números disponíveis (${totalNumeros}).`,
      };
    }
  }
  return { valido: true, mensagem: null };
}

module.exports = { normalizarNome, gerarIntervalo, validarQuantidades };
