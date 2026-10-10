package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.enuns.StatusLancamento;
import com.tcc.backend_TCC.enuns.TipoLancamento;
import com.tcc.backend_TCC.exception.RecursoNaoEncontradoException;
import com.tcc.backend_TCC.model.Lancamento;
import com.tcc.backend_TCC.model.BaixaLancamentoDTO;
import com.tcc.backend_TCC.model.BaixaLoteDTO;
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
            StatusLancamento novoStatus = StatusLancamento.valueOf(status);
            if (lancamento.getStatus() == StatusLancamento.PAGO && novoStatus != StatusLancamento.PAGO) {
                throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                        "Operação não permitida: Uma conta já quitada (PAGO) não pode ter seu status alterado diretamente.");
            }
            lancamento.setStatus(novoStatus);
            if (novoStatus == StatusLancamento.PAGO) {
                if (lancamento.getDataPagamento() == null) {
                    lancamento.setDataPagamento(java.time.LocalDate.now());
                }
                if (lancamento.getValorPago() == null) {
                    java.math.BigDecimal desc = lancamento.getDesconto() != null ? lancamento.getDesconto() : java.math.BigDecimal.ZERO;
                    lancamento.setDesconto(desc);
                    lancamento.setValorPago(lancamento.getValor().subtract(desc));
                }
            } else {
                lancamento.setDesconto(null);
                lancamento.setValorPago(null);
                lancamento.setDataPagamento(null);
            }
        } catch (IllegalArgumentException e) {
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                    "Status invalido: " + status + ". Valores aceitos: PENDENTE, PAGO, ATRASADO");
        }
        return repository.save(lancamento);
    }

    @Transactional
    public Lancamento darBaixa(Long id, BaixaLancamentoDTO dto) {
        Lancamento lancamento = repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Lancamento nao encontrado com ID: " + id));

        if (lancamento.getStatus() == StatusLancamento.PAGO) {
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                    "O lançamento #" + id + " (" + lancamento.getDescricao() + ") já foi pago anteriormente e não pode receber baixa novamente.");
        }

        java.time.LocalDate dataPag = dto != null && dto.getDataPagamento() != null ? dto.getDataPagamento() : java.time.LocalDate.now();
        String formaPag = dto != null ? dto.getFormaPagamento() : null;

        // Se for PAGAMENTO PARCIAL (Abatimento):
        if (dto != null && Boolean.TRUE.equals(dto.getPagamentoParcial()) && dto.getValorRecebidoParcial() != null) {
            java.math.BigDecimal valorRecebido = dto.getValorRecebidoParcial();
            java.math.BigDecimal valorOriginal = lancamento.getValor();

            if (valorRecebido.compareTo(java.math.BigDecimal.ZERO) > 0 && valorRecebido.compareTo(valorOriginal) < 0) {
                java.math.BigDecimal saldoRestante = valorOriginal.subtract(valorRecebido);

                // Quita o lançamento atual referente à parte recebida
                lancamento.setValor(valorRecebido);
                lancamento.setValorPago(valorRecebido);
                lancamento.setDesconto(java.math.BigDecimal.ZERO);
                lancamento.setStatus(StatusLancamento.PAGO);
                lancamento.setDataPagamento(dataPag);
                lancamento.setFormaPagamento(formaPag);
                if (!lancamento.getDescricao().contains("(Parcial)")) {
                    lancamento.setDescricao(lancamento.getDescricao() + " (Parcial)");
                }
                repository.save(lancamento);

                // Cria o lançamento para o saldo restante em aberto
                Lancamento restante = new Lancamento();
                restante.setAtivo(true);
                String descBase = lancamento.getDescricao().replace(" (Parcial)", "");
                restante.setDescricao("Saldo Restante - " + descBase);
                restante.setEnvolvido(lancamento.getEnvolvido());
                restante.setValor(saldoRestante);
                restante.setTipo(lancamento.getTipo());
                restante.setStatus(StatusLancamento.PENDENTE);
                restante.setVencimento(dto.getNovoVencimentoRestante() != null ? dto.getNovoVencimentoRestante() : dataPag.plusDays(30));
                restante.setOrdemServicoId(lancamento.getOrdemServicoId());
                repository.save(restante);

                log.info("Pagamento parcial no lancamento ID {}: recebido R${}, saldo restante R${} (novo ID {})",
                        id, valorRecebido, saldoRestante, restante.getId());
                return lancamento;
            }
        }

        // Baixa normal (integral ou com desconto):
        lancamento.setStatus(StatusLancamento.PAGO);
        lancamento.setDataPagamento(dataPag);
        lancamento.setFormaPagamento(formaPag);

        java.math.BigDecimal desc = (dto != null && dto.getDesconto() != null && dto.getDesconto().compareTo(java.math.BigDecimal.ZERO) > 0)
                ? dto.getDesconto()
                : java.math.BigDecimal.ZERO;
        lancamento.setDesconto(desc);

        if (dto != null && dto.getValorPago() != null) {
            lancamento.setValorPago(dto.getValorPago());
        } else {
            java.math.BigDecimal calculado = lancamento.getValor().subtract(desc);
            lancamento.setValorPago(calculado.compareTo(java.math.BigDecimal.ZERO) >= 0 ? calculado : java.math.BigDecimal.ZERO);
        }

        log.info("Baixa com desconto realizada para lancamento ID {}: original R${}, desconto R${}, pago R${}, forma {}",
                id, lancamento.getValor(), lancamento.getDesconto(), lancamento.getValorPago(), formaPag);
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
        if (novoStatus != StatusLancamento.PAGO) {
            List<Lancamento> jaPagos = lancamentos.stream()
                    .filter(l -> l.getStatus() == StatusLancamento.PAGO)
                    .toList();
            if (!jaPagos.isEmpty()) {
                String idsPagos = jaPagos.stream()
                        .map(l -> "#" + l.getId() + " (" + l.getDescricao() + ")")
                        .collect(java.util.stream.Collectors.joining(", "));
                throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                        "Operação cancelada: O lote contém contas já quitadas que não podem ter o status alterado: " + idsPagos);
            }
        }
        for (Lancamento l : lancamentos) {
            l.setStatus(novoStatus);
            if (novoStatus == StatusLancamento.PAGO) {
                if (l.getDataPagamento() == null) {
                    l.setDataPagamento(java.time.LocalDate.now());
                }
                if (l.getValorPago() == null) {
                    java.math.BigDecimal desc = l.getDesconto() != null ? l.getDesconto() : java.math.BigDecimal.ZERO;
                    l.setDesconto(desc);
                    l.setValorPago(l.getValor().subtract(desc));
                }
            } else {
                l.setDesconto(null);
                l.setValorPago(null);
                l.setDataPagamento(null);
            }
        }
        repository.saveAll(lancamentos);
        log.info("Baixa em massa realizada para {} lancamentos com status {}", ids.size(), status);
    }

    public void darBaixaEmLoteComDesconto(BaixaLoteDTO dto) {
        if (dto.getIds() == null || dto.getIds().isEmpty()) {
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException("Nenhum lançamento informado para baixa.");
        }

        List<Lancamento> lancamentos = repository.findAllById(dto.getIds());
        if (lancamentos.isEmpty()) {
            throw new RecursoNaoEncontradoException("Lançamentos não encontrados.");
        }

        // Validação estrita: NENHUMA conta já paga pode estar no lote!
        List<Lancamento> jaPagos = lancamentos.stream()
                .filter(l -> l.getStatus() == StatusLancamento.PAGO)
                .toList();

        if (!jaPagos.isEmpty()) {
            String idsPagos = jaPagos.stream()
                    .map(l -> "#" + l.getId() + " (" + l.getDescricao() + ")")
                    .collect(java.util.stream.Collectors.joining(", "));
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                    "Operação cancelada: O lote contém contas que já foram pagas anteriormente: " + idsPagos + ". Somente contas em aberto podem receber baixa.");
        }

        java.time.LocalDate dataPag = dto.getDataPagamento() != null ? dto.getDataPagamento() : java.time.LocalDate.now();

        // Se for PAGAMENTO PARCIAL EM LOTE (Abatimento Unificado):
        if (Boolean.TRUE.equals(dto.getPagamentoParcial()) && dto.getValorRecebidoParcial() != null) {
            java.math.BigDecimal valorRecebido = dto.getValorRecebidoParcial();
            java.math.BigDecimal somaValores = lancamentos.stream()
                    .map(Lancamento::getValor)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            if (valorRecebido.compareTo(java.math.BigDecimal.ZERO) <= 0 || valorRecebido.compareTo(somaValores) >= 0) {
                throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                        "O valor recebido parcial (R$ " + valorRecebido + ") deve ser maior que zero e menor que a soma do lote (R$ " + somaValores + ").");
            }

            java.math.BigDecimal saldoRestante = somaValores.subtract(valorRecebido);
            java.math.BigDecimal valorRecebidoAcumulado = java.math.BigDecimal.ZERO;

            for (int i = 0; i < lancamentos.size(); i++) {
                Lancamento l = lancamentos.get(i);
                java.math.BigDecimal valorRecebidoItem;
                if (i == lancamentos.size() - 1) {
                    valorRecebidoItem = valorRecebido.subtract(valorRecebidoAcumulado).max(java.math.BigDecimal.ZERO);
                } else {
                    valorRecebidoItem = l.getValor().multiply(valorRecebido)
                            .divide(somaValores, 2, java.math.RoundingMode.HALF_UP);
                    valorRecebidoAcumulado = valorRecebidoAcumulado.add(valorRecebidoItem);
                }

                l.setValor(valorRecebidoItem);
                l.setValorPago(valorRecebidoItem);
                l.setDesconto(java.math.BigDecimal.ZERO);
                l.setStatus(StatusLancamento.PAGO);
                l.setDataPagamento(dataPag);
                l.setFormaPagamento(dto.getFormaPagamento());
                if (!l.getDescricao().contains("(Parcial)")) {
                    l.setDescricao(l.getDescricao() + " (Parcial)");
                }
            }
            repository.saveAll(lancamentos);

            // Cria o lançamento único para o saldo restante em aberto
            Lancamento restante = new Lancamento();
            restante.setAtivo(true);

            String osIds = lancamentos.stream()
                    .map(Lancamento::getOrdemServicoId)
                    .filter(java.util.Objects::nonNull)
                    .map(String::valueOf)
                    .distinct()
                    .collect(java.util.stream.Collectors.joining(", #"));

            if (!osIds.isEmpty()) {
                restante.setDescricao("Saldo Restante de Acordo - OSs #" + osIds);
            } else {
                restante.setDescricao("Saldo Restante de Acordo - Lote (" + lancamentos.size() + " contas)");
            }

            restante.setEnvolvido(lancamentos.get(0).getEnvolvido());
            restante.setValor(saldoRestante);
            restante.setTipo(lancamentos.get(0).getTipo());
            restante.setStatus(StatusLancamento.PENDENTE);
            restante.setVencimento(dto.getNovoVencimentoRestante() != null ? dto.getNovoVencimentoRestante() : dataPag.plusDays(30));
            repository.save(restante);

            log.info("Baixa parcial em lote realizada para {} lancamentos. Recebido R${}, Saldo restante R${} (novo ID {})",
                    lancamentos.size(), valorRecebido, saldoRestante, restante.getId());
            return;
        }

        // Se foram enviados itens individuais com desconto por item:
        if (dto.getItens() != null && !dto.getItens().isEmpty()) {
            java.util.Map<Long, BaixaLoteDTO.ItemBaixaDTO> mapItens = dto.getItens().stream()
                    .collect(java.util.stream.Collectors.toMap(BaixaLoteDTO.ItemBaixaDTO::getId, item -> item));

            for (Lancamento l : lancamentos) {
                l.setStatus(StatusLancamento.PAGO);
                l.setDataPagamento(dataPag);
                l.setFormaPagamento(dto.getFormaPagamento());
                BaixaLoteDTO.ItemBaixaDTO itemDto = mapItens.get(l.getId());
                if (itemDto != null) {
                    java.math.BigDecimal desc = itemDto.getDesconto() != null ? itemDto.getDesconto() : java.math.BigDecimal.ZERO;
                    l.setDesconto(desc);
                    if (itemDto.getValorPago() != null) {
                        l.setValorPago(itemDto.getValorPago());
                    } else {
                        l.setValorPago(l.getValor().subtract(desc).max(java.math.BigDecimal.ZERO));
                    }
                } else {
                    l.setDesconto(java.math.BigDecimal.ZERO);
                    l.setValorPago(l.getValor());
                }
            }
        } else {
            // Se foi enviado um desconto total geral para ratear entre as contas:
            java.math.BigDecimal descontoTotal = dto.getDescontoTotal() != null ? dto.getDescontoTotal() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal somaValores = lancamentos.stream().map(Lancamento::getValor).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            java.math.BigDecimal descontoAcumulado = java.math.BigDecimal.ZERO;

            for (int i = 0; i < lancamentos.size(); i++) {
                Lancamento l = lancamentos.get(i);
                l.setStatus(StatusLancamento.PAGO);
                l.setDataPagamento(dataPag);
                l.setFormaPagamento(dto.getFormaPagamento());

                java.math.BigDecimal descItem = java.math.BigDecimal.ZERO;
                if (descontoTotal.compareTo(java.math.BigDecimal.ZERO) > 0 && somaValores.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    if (i == lancamentos.size() - 1) {
                        // Último item fica com a diferença para fechar o total exato
                        descItem = descontoTotal.subtract(descontoAcumulado).max(java.math.BigDecimal.ZERO);
                    } else {
                        descItem = l.getValor().multiply(descontoTotal)
                                .divide(somaValores, 2, java.math.RoundingMode.HALF_UP);
                        descontoAcumulado = descontoAcumulado.add(descItem);
                    }
                }
                l.setDesconto(descItem);
                l.setValorPago(l.getValor().subtract(descItem).max(java.math.BigDecimal.ZERO));
            }
        }

        repository.saveAll(lancamentos);
        log.info("Baixa em lote com desconto realizada para {} lançamentos", lancamentos.size());
    }

    public void excluir(Long id) {
        Lancamento lancamento = repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Lancamento nao encontrado com ID: " + id));

        if (lancamento.getStatus() == StatusLancamento.PAGO) {
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                    "Operação negada: Não é permitido excluir um lançamento financeiro que já foi quitado (PAGO).");
        }

        repository.delete(lancamento);
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
