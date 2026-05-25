package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.enuns.StatusLancamento;
import com.tcc.backend_TCC.enuns.TipoLancamento;
import com.tcc.backend_TCC.exception.RecursoNaoEncontradoException;
import com.tcc.backend_TCC.model.Lancamento;
import com.tcc.backend_TCC.repository.LancamentoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LancamentoService {

    private static final Logger log = LoggerFactory.getLogger(LancamentoService.class);

    @Autowired
    private LancamentoRepository repository;

    public List<Lancamento> listarPorTipo(TipoLancamento tipo) {
        return repository.findByTipoOrderByVencimentoAsc(tipo);
    }

    public org.springframework.data.domain.Page<Lancamento> listarPorTipoPaginado(TipoLancamento tipo, org.springframework.data.domain.Pageable pageable) {
        return repository.findByTipoOrderByVencimentoAsc(tipo, pageable);
    }

    public org.springframework.data.domain.Page<Lancamento> pesquisar(
            TipoLancamento tipo, String statusStr, String busca, org.springframework.data.domain.Pageable pageable) {
        
        com.tcc.backend_TCC.enuns.StatusLancamento status = null;
        if (statusStr != null && !statusStr.isBlank() && !"TODOS".equalsIgnoreCase(statusStr)) {
            try {
                status = com.tcc.backend_TCC.enuns.StatusLancamento.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException("Status inválido: " + statusStr);
            }
        }
        
        return repository.pesquisar(tipo, status, busca, pageable);
    }

    public Lancamento criar(Lancamento lancamento) {
        log.info("Novo lancamento criado: {} - R${}", lancamento.getDescricao(), lancamento.getValor());
        return repository.save(lancamento);
    }

    public Lancamento atualizarStatus(Long id, String status) {
        Lancamento lancamento = repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Lancamento nao encontrado com ID: " + id));
        try {
            lancamento.setStatus(StatusLancamento.valueOf(status));
        } catch (IllegalArgumentException e) {
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                    "Status invalido: " + status + ". Valores aceitos: PENDENTE, PAGO, ATRASADO");
        }
        return repository.save(lancamento);
    }

    public void atualizarStatusEmLote(List<Long> ids, String status) {
        StatusLancamento novoStatus;
        try {
            novoStatus = StatusLancamento.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException("Status invalido: " + status);
        }

        List<Lancamento> lancamentos = repository.findAllById(ids);
        for (Lancamento l : lancamentos) {
            l.setStatus(novoStatus);
        }
        repository.saveAll(lancamentos);
        log.info("Baixa em massa realizada para {} lancamentos com status {}", ids.size(), status);
    }

    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Lancamento nao encontrado com ID: " + id);
        }
        repository.deleteById(id);
        log.info("Lancamento excluido: ID {}", id);
    }

    public java.util.Map<String, java.math.BigDecimal> getResumoFinanceiro() {
        java.math.BigDecimal totalReceberPendente = repository.sumPendenteByTipo(TipoLancamento.RECEBER);
        java.math.BigDecimal totalPagarPendente = repository.sumPendenteByTipo(TipoLancamento.PAGAR);
        java.math.BigDecimal saldoAtual = repository.getSaldoAtual();

        return java.util.Map.of(
                "totalReceberPendente", totalReceberPendente,
                "totalPagarPendente", totalPagarPendente,
                "saldoAtual", saldoAtual
        );
    }
}
