package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.model.TipoPessoa;
import com.tcc.backend_TCC.repository.OrdemServicoMecanicoRepository;
import com.tcc.backend_TCC.repository.OrdemServicoRepository;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RelatorioService {

    @Autowired
    private PessoaRepository pessoaRepository;

    @Autowired
    private OrdemServicoRepository ordemServicoRepository;

    @Autowired
    private OrdemServicoMecanicoRepository mecanicoRepository;

    public Map<String, Object> relatorioFuncionario(Long id, LocalDate inicio, LocalDate fim) {
        Pessoa funcionario = pessoaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));

        BigDecimal totalComissao = mecanicoRepository
                .totalComissaoPorMecanicoEPeriodo(id, inicio, fim);

        BigDecimal salarioBase = funcionario.getSalarioBase() != null
                ? BigDecimal.valueOf(funcionario.getSalarioBase())
                : BigDecimal.ZERO;

        long quantidadeOS = mecanicoRepository.findByMecanicoId(id).stream()
                .filter(m -> !m.getOrdemServico().getDataRegisto().isBefore(inicio)
                        && !m.getOrdemServico().getDataRegisto().isAfter(fim))
                .count();

        return Map.of(
                "funcionario", funcionario.getNome(),
                "cargo", funcionario.getCargo() != null ? funcionario.getCargo() : "",
                "percentualComissao", funcionario.getPercentualComissao() != null ? funcionario.getPercentualComissao() : 0,
                "salarioBase", salarioBase,
                "totalComissao", totalComissao,
                "totalReceber", salarioBase.add(totalComissao),
                "quantidadeOS", quantidadeOS
        );
    }

    public List<Map<String, Object>> relatorioTodosFuncionarios(LocalDate inicio, LocalDate fim) {
        return pessoaRepository.findByTipo(TipoPessoa.FUNCIONARIO)
                .stream()
                .map(f -> relatorioFuncionario(f.getId(), inicio, fim))
                .collect(Collectors.toList());
    }

    public Map<String, Object> faturamentoPorPeriodo(LocalDate inicio, LocalDate fim) {
        BigDecimal total = ordemServicoRepository.totalFaturadoPorPeriodo(inicio, fim);
        long qtd = ordemServicoRepository.findByDataRegistoBetween(inicio, fim).size();

        return Map.of(
                "periodo", inicio + " até " + fim,
                "totalFaturado", total,
                "quantidadeOS", qtd
        );
    }
}