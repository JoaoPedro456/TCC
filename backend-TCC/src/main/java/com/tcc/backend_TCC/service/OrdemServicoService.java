package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.enuns.StatusLancamento;
import com.tcc.backend_TCC.enuns.StatusOS;
import com.tcc.backend_TCC.enuns.TipoLancamento;
import com.tcc.backend_TCC.model.*;
import com.tcc.backend_TCC.repository.ItemServicoRepository;
import com.tcc.backend_TCC.repository.LancamentoRepository;
import com.tcc.backend_TCC.repository.OrdemServicoMecanicoRepository;
import com.tcc.backend_TCC.repository.OrdemServicoRepository;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrdemServicoService {

    @Autowired
    private OrdemServicoRepository repository;

    @Autowired
    private OrdemServicoMecanicoRepository mecanicoRepository;

    @Autowired
    private PessoaRepository pessoaRepository;

    @Autowired
    private ItemServicoRepository itemServicoRepository;

    // 👇 1. Injetamos o repositório financeiro para a OS conseguir gerar faturamento
    @Autowired
    private LancamentoRepository lancamentoRepository;

    @Transactional
    public OrdemServico salvar(OrdemServico os) {
        if (os.getMecanicos() != null) {
            for (OrdemServicoMecanico m : os.getMecanicos()) {
                m.setOrdemServico(os);
            }
        }
        return repository.save(os);
    }

    @Transactional
    public OrdemServico salvarDTO(OrdemServicoDTO dto) {
        OrdemServico os = new OrdemServico();

        if (dto.getCliente() != null && dto.getCliente().getId() != null) {
            Pessoa cliente = pessoaRepository.findById(dto.getCliente().getId())
                    .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
            os.setCliente(cliente);
        }

        os.setObservacao(dto.getObservacao());
        os.setVeiculo(dto.getVeiculo());
        os.setQuilometragem(dto.getQuilometragem());

        os.setValorKm(dto.getValorKm() != null ? dto.getValorKm() : BigDecimal.ZERO);
        os.setValorTotal(dto.getValorTotal() != null ? dto.getValorTotal() : BigDecimal.ZERO);
        os.setStatus(StatusOS.ABERTA);

        if (dto.getItensServicoIds() != null && !dto.getItensServicoIds().isEmpty()) {
            List<ItemServico> itens = itemServicoRepository.findAllById(dto.getItensServicoIds());
            os.setItensServico(itens);
        }

        BigDecimal totalGeral = dto.getValorTotal();
        BigDecimal qtdKm = BigDecimal.valueOf(dto.getQuilometragem() != null ? dto.getQuilometragem() : 0);
        BigDecimal precoKm = dto.getValorKm() != null ? dto.getValorKm() : BigDecimal.ZERO;

        BigDecimal custoKm = qtdKm.multiply(precoKm);
        BigDecimal valorApenasServico = totalGeral.subtract(custoKm);

        if (dto.getMecanicos() != null) {
            List<OrdemServicoMecanico> mecanicos = new ArrayList<>();
            for (var mDto : dto.getMecanicos()) {
                OrdemServicoMecanico osm = new OrdemServicoMecanico();
                osm.setOrdemServico(os);

                Pessoa func = pessoaRepository.findById(mDto.getMecanico().getId()).orElseThrow();
                osm.setMecanico(func);

                BigDecimal porcentagem = BigDecimal.valueOf(func.getPercentualComissao() != null ? func.getPercentualComissao() : 0);

                BigDecimal valorComissao = valorApenasServico.multiply(porcentagem)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                osm.setValorAtribuido(valorComissao);
                mecanicos.add(osm);
            }
            os.setMecanicos(mecanicos);
        }

        os.setVeiculo(dto.getVeiculo());
        os.setQuilometragem(dto.getQuilometragem());
        os.setValorKm(dto.getValorKm());
        os.setValorTotal(totalGeral);

        return repository.save(os);
    }

    public List<OrdemServico> listarTodas() {
        return repository.findAll();
    }

    public OrdemServico buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("OS não encontrada"));
    }

    // 👇 2. A MÁGICA ACONTECE AQUI
    @Transactional
    public OrdemServico atualizarStatus(Long id, String status) {
        OrdemServico os = buscarPorId(id);
        StatusOS novoStatus = StatusOS.valueOf(status);

        // Se o status da OS está mudando para CONCLUÍDA e ela ainda não era CONCLUÍDA
        if (novoStatus == StatusOS.CONCLUIDA && os.getStatus() != StatusOS.CONCLUIDA) {

            Lancamento contaReceber = new Lancamento();
            contaReceber.setDescricao("OS #" + os.getId() + " - " + (os.getVeiculo() != null ? os.getVeiculo() : "Serviços"));
            contaReceber.setEnvolvido(os.getCliente() != null ? os.getCliente().getNome() : "Cliente não informado");
            contaReceber.setValor(os.getValorTotal());
            contaReceber.setVencimento(LocalDate.now()); // Coloca o vencimento para o dia de hoje
            contaReceber.setTipo(TipoLancamento.RECEBER);
            contaReceber.setStatus(StatusLancamento.PENDENTE);

            // Salva a conta na tabela de faturamento!
            lancamentoRepository.save(contaReceber);
        }

        os.setStatus(novoStatus);
        return repository.save(os);
    }

    public void excluir(Long id) {
        repository.deleteById(id);
    }

    public BigDecimal calcularTotalComissaoMecanico(Long idMecanico, LocalDate inicio, LocalDate fim) {
        return mecanicoRepository.totalComissaoPorMecanicoEPeriodo(idMecanico, inicio, fim);
    }
}