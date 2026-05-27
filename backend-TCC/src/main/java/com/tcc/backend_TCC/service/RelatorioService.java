package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.exception.RecursoNaoEncontradoException;
import com.tcc.backend_TCC.model.OrdemServico;
import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.enuns.TipoPessoa;
import com.tcc.backend_TCC.repository.OrdemServicoMecanicoRepository;
import com.tcc.backend_TCC.repository.OrdemServicoRepository;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RelatorioService {

    @Autowired
    private PessoaRepository pessoaRepository;

    @Autowired
    private OrdemServicoRepository ordemServicoRepository;

    @Autowired
    private OrdemServicoMecanicoRepository mecanicoRepository;

    // Helper para evitar erros de valor nulo vindo do banco
    private BigDecimal zeroSeNulo(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }

    public Map<String, Object> relatorioFuncionario(Long id, LocalDate inicio, LocalDate fim) {
        Pessoa funcionario = pessoaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Funcionário não encontrado"));

        // Tratando nulo caso o repository retorne vazio
        BigDecimal totalComissao = zeroSeNulo(mecanicoRepository.totalComissaoPorMecanicoEPeriodo(id, inicio, fim));

        BigDecimal salarioBase = funcionario.getSalarioBase() != null
                ? BigDecimal.valueOf(funcionario.getSalarioBase())
                : BigDecimal.ZERO;

        long quantidadeOS = mecanicoRepository.contarOSPormecanicoEPeriodo(id, inicio, fim);
        double percentual = funcionario.getPercentualComissao() != null ? funcionario.getPercentualComissao() : 0;

        // Criando um HashMap para evitar limitações do Map.of
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("id", id);
        resultado.put("nome", funcionario.getNome());
        resultado.put("cargo", funcionario.getCargo() != null ? funcionario.getCargo() : "Sem cargo");
        resultado.put("percentualComissao", percentual);
        resultado.put("salarioBase", salarioBase);
        resultado.put("totalComissao", totalComissao);
        resultado.put("totalReceber", salarioBase.add(totalComissao));
        resultado.put("quantidadeOS", quantidadeOS);

        return resultado;
    }

    public List<Map<String, Object>> relatorioTodosFuncionarios(LocalDate inicio, LocalDate fim) {
        return pessoaRepository.findByTipo(TipoPessoa.FUNCIONARIO)
                .stream()
                .map(f -> relatorioFuncionario(f.getId(), inicio, fim)) // Reutiliza a lógica acima
                .sorted((a, b) -> ((BigDecimal) b.get("totalReceber"))
                        .compareTo((BigDecimal) a.get("totalReceber"))) // Ordena do maior para o menor
                .collect(Collectors.toList());
    }

    public Map<String, Object> faturamentoPorPeriodo(LocalDate inicio, LocalDate fim) {
        BigDecimal total = zeroSeNulo(ordemServicoRepository.totalFaturadoPorPeriodo(inicio, fim));
        List<OrdemServico> lista = ordemServicoRepository.findByDataRegistoBetween(inicio, fim);

        long concluidas = contarPorStatus(lista, "CONCLUIDA");
        long abertas = contarPorStatus(lista, "ABERTA");
        long canceladas = contarPorStatus(lista, "CANCELADA");

        return Map.of(
                "periodo", inicio.toString() + " até " + fim.toString(),
                "totalFaturado", total,
                "totalOS", (long) lista.size(),
                "concluidas", concluidas,
                "abertas", abertas,
                "canceladas", canceladas
        );
    }

    public Map<String, Object> dashboard() {
        LocalDate hoje = LocalDate.now();
        LocalDate mesAtual = hoje.withDayOfMonth(1);

        // NOTA: Como a entidade OrdemServico não possui uma coluna 'dataConclusao',
        // o faturamento é calculado com base no regime de competência utilizando a 'dataRegisto'
        // das ordens de serviço que se encontram no status 'CONCLUIDA'.
        List<OrdemServico> lista = ordemServicoRepository.findByDataRegistoBetween(mesAtual, hoje);

        BigDecimal faturamentoMes = lista.stream()
                .filter(os -> os.getStatus() != null && "CONCLUIDA".equals(os.getStatus().name()))
                .map(os -> zeroSeNulo(os.getValorTotal()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalClientes = pessoaRepository.countByTipo(TipoPessoa.CLIENTE);
        long totalFuncionarios = pessoaRepository.countByTipo(TipoPessoa.FUNCIONARIO);
        long osAbertas = contarPorStatus(lista, "ABERTA");
        long osConcluidasMes = contarPorStatus(lista, "CONCLUIDA");
        long osHoje = lista.stream().filter(os -> os.getDataRegisto().equals(hoje)).count();
        long hojeAbertas = lista.stream().filter(os -> os.getDataRegisto().equals(hoje) && os.getStatus() != null && "ABERTA".equals(os.getStatus().name())).count();
        long hojeConcluidas = lista.stream().filter(os -> os.getDataRegisto().equals(hoje) && os.getStatus() != null && "CONCLUIDA".equals(os.getStatus().name())).count();
        long hojeCanceladas = lista.stream().filter(os -> os.getDataRegisto().equals(hoje) && os.getStatus() != null && "CANCELADA".equals(os.getStatus().name())).count();

        BigDecimal ticketMedio = osConcluidasMes > 0
                ? faturamentoMes.divide(BigDecimal.valueOf(osConcluidasMes), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Construindo o Map manualmente para suportar mais de 10 chaves
        Map<String, Object> dash = new HashMap<>();
        dash.put("dataGeracao", hoje.toString());
        dash.put("mesReferencia", mesAtual.getMonth().name() + "/" + hoje.getYear());
        dash.put("faturamentoMes", faturamentoMes);
        dash.put("osMes", (long) lista.size());
        dash.put("osAbertasMes", osAbertas);
        dash.put("osConcluidasMes", osConcluidasMes);
        dash.put("osHoje", osHoje);
        dash.put("hojeAbertas", hojeAbertas);
        dash.put("hojeConcluidas", hojeConcluidas);
        dash.put("hojeCanceladas", hojeCanceladas);
        dash.put("osEmServico", contarPorStatus(lista, "EM_SERVICO"));
        dash.put("osAguardandoPeca", contarPorStatus(lista, "AGUARDANDO_PECA"));
        dash.put("osCanceladas", contarPorStatus(lista, "CANCELADA"));
        dash.put("ticketMedio", ticketMedio);
        dash.put("totalClientes", totalClientes);
        dash.put("totalFuncionarios", totalFuncionarios);

        // --- Adicionando Histórico de Faturamento dos últimos 6 meses (otimizado para 1 query) ---
        LocalDate inicioPeriodo = hoje.minusMonths(5).withDayOfMonth(1);
        List<Object[]> faturamentoAgrupado = ordemServicoRepository.faturamentoMensalAgrupado(inicioPeriodo, hoje);
        Map<String, BigDecimal> faturamentoMap = new HashMap<>();
        for (Object[] row : faturamentoAgrupado) {
            Integer ano = (Integer) row[0];
            Integer mes = (Integer) row[1];
            BigDecimal total = (BigDecimal) row[2];
            faturamentoMap.put(ano + "-" + mes, total);
        }

        List<Map<String, Object>> historicoFaturamento = new ArrayList<>();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MMM", new Locale("pt", "BR"));
        for (int i = 5; i >= 0; i--) {
            LocalDate inicioMes = hoje.minusMonths(i).withDayOfMonth(1);
            
            String chave = inicioMes.getYear() + "-" + inicioMes.getMonthValue();
            BigDecimal fatMes = zeroSeNulo(faturamentoMap.get(chave));
            
            Map<String, Object> dadosMes = new HashMap<>();
            String nomeMes = inicioMes.format(formatter);
            // Capitaliza a primeira letra (ex: "jan" -> "Jan")
            nomeMes = nomeMes.substring(0, 1).toUpperCase() + nomeMes.substring(1);
            
            dadosMes.put("mes", nomeMes);
            dadosMes.put("faturamento", fatMes);
            historicoFaturamento.add(dadosMes);
        }
        dash.put("historicoFaturamento", historicoFaturamento);

        return dash;
    }

    // Método auxiliar para limpar o código e evitar repetição
    private long contarPorStatus(List<OrdemServico> lista, String statusNome) {
        return lista.stream()
                .filter(os -> os.getStatus() != null && os.getStatus().name().equals(statusNome))
                .count();
    }
}