package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.model.TipoPessoa;
import com.tcc.backend_TCC.repository.OrdemServicoMecanicoRepository;
import com.tcc.backend_TCC.repository.OrdemServicoRepository;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
public class RelatorioServiceOTIMIZADO {

    @Autowired
    private PessoaRepository pessoaRepository;

    @Autowired
    private OrdemServicoRepository ordemServicoRepository;

    @Autowired
    private OrdemServicoMecanicoRepository mecanicoRepository;

    private BigDecimal zeroSeNulo(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }

    // VERSÃO OTIMIZADA DO DASHBOARD - SEM N+1!
    public Map<String, Object> dashboard() {
        LocalDate hoje = LocalDate.now();
        LocalDate mesAtual = hoje.withDayOfMonth(1);

        // UMA QUERY SÓ traz todas as métricas!
        Object[] metrics = ordemServicoRepository.getDashboardMetrics(mesAtual, hoje, hoje);
        
        // Contagens de pessoas (pode cachear depois)
        long totalClientes = pessoaRepository.countByTipo(TipoPessoa.CLIENTE);
        long totalFuncionarios = pessoaRepository.countByTipo(TipoPessoa.FUNCIONARIO);

        // Extrair valores da query
        Long totalOS = (Long) metrics[0];
        BigDecimal faturamentoMes = (BigDecimal) metrics[1];
        Long osConcluidas = (Long) metrics[2];
        Long osAbertas = (Long) metrics[3];
        Long osCanceladas = (Long) metrics[4];
        Long osEmServico = (Long) metrics[5];
        Long osAguardando = (Long) metrics[6];
        Long osHoje = (Long) metrics[7];

        BigDecimal ticketMedio = osConcluidas > 0
                ? faturamentoMes.divide(BigDecimal.valueOf(osConcluidas), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> dash = new HashMap<>();
        dash.put("dataGeracao", hoje.toString());
        dash.put("mesReferencia", mesAtual.getMonth().name() + "/" + hoje.getYear());
        dash.put("faturamentoMes", faturamentoMes);
        dash.put("osMes", totalOS);
        dash.put("osAbertasMes", osAbertas);
        dash.put("osConcluidasMes", osConcluidas);
        dash.put("osHoje", osHoje);
        dash.put("osEmServico", osEmServico);
        dash.put("osAguardandoPeca", osAguardando);
        dash.put("osCanceladas", osCanceladas);
        dash.put("ticketMedio", ticketMedio);
        dash.put("totalClientes", totalClientes);
        dash.put("totalFuncionarios", totalFuncionarios);

        return dash;
    }
}
