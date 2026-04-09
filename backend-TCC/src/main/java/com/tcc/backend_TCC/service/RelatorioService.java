package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.model.OrdemServico;
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

        long quantidadeOS = mecanicoRepository
                .contarOSPormecanicoEPeriodo(id, inicio, fim);

        double percentual = funcionario.getPercentualComissao() != null
                ? funcionario.getPercentualComissao() : 0;

        return Map.of(
                "id", id,
                "nome", funcionario.getNome(),
                "cargo", funcionario.getCargo() != null ? funcionario.getCargo() : "Sem cargo",
                "percentualComissao", percentual,
                "salarioBase", salarioBase,
                "totalComissao", totalComissao,
                "totalReceber", salarioBase.add(totalComissao),
                "quantidadeOS", quantidadeOS
        );
    }

    public List<Map<String, Object>> relatorioTodosFuncionarios(LocalDate inicio, LocalDate fim) {
        return pessoaRepository.findByTipo(TipoPessoa.FUNCIONARIO)
                .stream()
                .map(f -> {
                    BigDecimal totalComissao = mecanicoRepository
                            .totalComissaoPorMecanicoEPeriodo(f.getId(), inicio, fim);
                    BigDecimal salarioBase = f.getSalarioBase() != null
                            ? BigDecimal.valueOf(f.getSalarioBase())
                            : BigDecimal.ZERO;
                    long quantidadeOS = mecanicoRepository
                            .contarOSPormecanicoEPeriodo(f.getId(), inicio, fim);
                    double percentual = f.getPercentualComissao() != null
                            ? f.getPercentualComissao() : 0;

                    return Map.<String, Object>of(
                            "id", f.getId(),
                            "nome", f.getNome(),
                            "cargo", f.getCargo() != null ? f.getCargo() : "Sem cargo",
                            "percentualComissao", percentual,
                            "salarioBase", salarioBase,
                            "totalComissao", totalComissao,
                            "totalReceber", salarioBase.add(totalComissao),
                            "quantidadeOS", quantidadeOS
                    );
                })
                .sorted((a, b) -> ((BigDecimal) a.get("totalReceber"))
                        .compareTo((BigDecimal) b.get("totalReceber")))
                .collect(Collectors.toList());
    }

    public Map<String, Object> faturamentoPorPeriodo(LocalDate inicio, LocalDate fim) {
        BigDecimal total = ordemServicoRepository.totalFaturadoPorPeriodo(inicio, fim);
        List<OrdemServico> lista = ordemServicoRepository.findByDataRegistoBetween(inicio, fim);

        long concluidas = lista.stream().filter(os ->
                os.getStatus() != null && os.getStatus().name().equals("CONCLUIDA")).count();
        long abertas = lista.stream().filter(os ->
                os.getStatus() == null || os.getStatus().name().equals("ABERTA")).count();
        long canceladas = lista.stream().filter(os ->
                os.getStatus() != null && os.getStatus().name().equals("CANCELADA")).count();

        return Map.of(
                "periodo", inicio.toString() + " até " + fim.toString(),
                "totalFaturado", total,
                "totalOS", lista.size(),
                "concluidas", concluidas,
                "abertas", abertas,
                "canceladas", canceladas
        );
    }

    // Métricas rápidas para o Dashboard — faturamento só de OS concluídas
    public Map<String, Object> dashboard() {
        LocalDate hoje = LocalDate.now();
        LocalDate mesAtual = hoje.withDayOfMonth(1);

        List<OrdemServico> lista = ordemServicoRepository.findByDataRegistoBetween(mesAtual, hoje);

        // Só OS concluídas contam pro faturamento
        BigDecimal faturamentoMes = lista.stream()
                .filter(os -> os.getStatus() != null && os.getStatus().name().equals("CONCLUIDA"))
                .map(OrdemServico::getValorTotal)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalClientes = pessoaRepository.findByTipo(TipoPessoa.CLIENTE).size();
        long totalFuncionarios = pessoaRepository.findByTipo(TipoPessoa.FUNCIONARIO).size();
        long osAbertas = lista.stream().filter(os ->
                os.getStatus() == null || os.getStatus().name().equals("ABERTA")).count();

        return Map.of(
                "dataGeracao", hoje.toString(),
                "mesReferencia", mesAtual.getMonth() + "/" + hoje.getYear(),
                "faturamentoMes", faturamentoMes,
                "osMes", lista.size(),
                "osAbertasMes", osAbertas,
                "totalClientes", totalClientes,
                "totalFuncionarios", totalFuncionarios
        );
    }
}