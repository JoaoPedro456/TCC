package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.exception.RecursoNaoEncontradoException;
import com.tcc.backend_TCC.enuns.StatusLancamento;
import com.tcc.backend_TCC.enuns.StatusOS;
import com.tcc.backend_TCC.enuns.TipoLancamento;
import com.tcc.backend_TCC.model.*;
import com.tcc.backend_TCC.repository.ItemServicoRepository;
import com.tcc.backend_TCC.repository.LancamentoRepository;
import com.tcc.backend_TCC.repository.MaterialRepository;

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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    @Autowired
    private MaterialRepository materialRepository;


    // 👇 1. Injetamos o repositório financeiro para a OS conseguir gerar faturamento
    @Autowired
    private LancamentoRepository lancamentoRepository;

    @Transactional
    public OrdemServico salvar(OrdemServicoDTO dto) {
        OrdemServico os = new OrdemServico();

        // --- Dados básicos ---
        if (dto.getCliente() != null && dto.getCliente().getId() != null) {
            Pessoa cliente = pessoaRepository.findById(dto.getCliente().getId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado"));
            os.setCliente(cliente);
        }

        os.setObservacao(dto.getObservacao());
        os.setDataRealizacao(dto.getDataRealizacao());
        os.setVeiculo(dto.getVeiculo());
        os.setQuilometragem(dto.getQuilometragem());

        BigDecimal valorKm = dto.getValorKm() != null ? dto.getValorKm() : BigDecimal.ZERO;
        BigDecimal valorTotal = dto.getValorTotal() != null ? dto.getValorTotal() : BigDecimal.ZERO;

        // --- Validação de consistência do valor total se houver itens no catálogo ---
        if (dto.getItensServico() != null && !dto.getItensServico().isEmpty()) {
            BigDecimal totalCalculado = BigDecimal.ZERO;
            for (var itemDto : dto.getItensServico()) {
                BigDecimal preco = itemDto.getPrecoCobrado() != null ? itemDto.getPrecoCobrado() : BigDecimal.ZERO;
                totalCalculado = totalCalculado.add(preco);
            }
            BigDecimal qtdKm = BigDecimal.valueOf(dto.getQuilometragem() != null ? dto.getQuilometragem() : 0);
            BigDecimal custoKm = qtdKm.multiply(valorKm);
            totalCalculado = totalCalculado.add(custoKm);

            BigDecimal diferenca = valorTotal.subtract(totalCalculado).abs();
            if (diferenca.compareTo(new BigDecimal("0.02")) > 0) {
                throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                        "O valor total enviado (R$ " + valorTotal + ") diverge da soma dos serviços e deslocamento (R$ " + totalCalculado + ").");
            }
        }

        os.setValorKm(valorKm);
        os.setValorTotal(valorTotal);
        os.setStatus(StatusOS.ABERTA);

        // --- Itens do catálogo ---
        if (dto.getItensServico() != null && !dto.getItensServico().isEmpty()) {
            List<OrdemServicoItem> itens = new ArrayList<>();
            for (var itemDto : dto.getItensServico()) {
                ItemServico catalogItem = itemServicoRepository.findById(itemDto.getItemServicoId())
                        .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço do catálogo não encontrado: " + itemDto.getItemServicoId()));

                OrdemServicoItem osItem = new OrdemServicoItem();
                osItem.setOrdemServico(os);
                osItem.setItemServico(catalogItem);
                osItem.setPrecoCobrado(itemDto.getPrecoCobrado());
                itens.add(osItem);
            }
            os.setItensServico(itens);
        }

        // --- Materiais ---
        BigDecimal valorTotalMateriais = BigDecimal.ZERO;
        if (dto.getMateriais() != null && !dto.getMateriais().isEmpty()) {
            List<OrdemServicoMaterial> materiais = new ArrayList<>();
            for (var mDto : dto.getMateriais()) {
                OrdemServicoMaterial osMat = new OrdemServicoMaterial();
                osMat.setOrdemServico(os);
                
                if (mDto.getMaterialId() != null) {
                    Material mat = materialRepository.findById(mDto.getMaterialId())
                            .orElseThrow(() -> new RecursoNaoEncontradoException("Material não encontrado: " + mDto.getMaterialId()));
                    osMat.setMaterial(mat);
                } else {
                    osMat.setNomeMaterial(mDto.getNomeMaterial());
                }
                
                osMat.setPrecoUnitario(mDto.getPrecoUnitario());
                osMat.setQuantidade(mDto.getQuantidade());
                osMat.setPrecoTotal(mDto.getPrecoTotal());
                materiais.add(osMat);
                valorTotalMateriais = valorTotalMateriais.add(osMat.getPrecoTotal());
            }
            os.setMateriais(materiais);
        }

        // --- Mecânicos e cálculo de comissão ---
        if (dto.getMecanicos() != null && !dto.getMecanicos().isEmpty()) {
            BigDecimal qtdKm = BigDecimal.valueOf(dto.getQuilometragem() != null ? dto.getQuilometragem() : 0);
            BigDecimal custoKm = qtdKm.multiply(valorKm);
            BigDecimal valorApenasServico = valorTotal.subtract(custoKm).subtract(valorTotalMateriais);

            List<OrdemServicoMecanico> mecanicos = new ArrayList<>();
            for (var mDto : dto.getMecanicos()) {
                Pessoa func = pessoaRepository.findById(mDto.getMecanico().getId())
                        .orElseThrow(() -> new RecursoNaoEncontradoException("Mecânico não encontrado"));

                OrdemServicoMecanico osm = new OrdemServicoMecanico();
                osm.setOrdemServico(os);
                osm.setMecanico(func);

                BigDecimal porcentagem = BigDecimal.valueOf(
                        func.getPercentualComissao() != null ? func.getPercentualComissao() : 0);

                BigDecimal valorComissao = valorApenasServico.multiply(porcentagem)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                osm.setValorAtribuido(valorComissao);
                mecanicos.add(osm);
            }
            os.setMecanicos(mecanicos);
        }

        return repository.save(os);
    }

    @Transactional
    public OrdemServico atualizar(Long id, OrdemServicoDTO dto) {
        OrdemServico os = buscarPorId(id);

        // --- Dados básicos ---
        if (dto.getCliente() != null && dto.getCliente().getId() != null) {
            Pessoa cliente = pessoaRepository.findById(dto.getCliente().getId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado"));
            os.setCliente(cliente);
        }

        os.setObservacao(dto.getObservacao());
        os.setDataRealizacao(dto.getDataRealizacao());
        os.setVeiculo(dto.getVeiculo());
        os.setQuilometragem(dto.getQuilometragem());

        BigDecimal valorKm = dto.getValorKm() != null ? dto.getValorKm() : BigDecimal.ZERO;
        BigDecimal valorTotal = dto.getValorTotal() != null ? dto.getValorTotal() : BigDecimal.ZERO;

        // --- Validação de consistência do valor total ---
        BigDecimal totalCalculado = BigDecimal.ZERO;
        if (dto.getItensServico() != null && !dto.getItensServico().isEmpty()) {
            for (var itemDto : dto.getItensServico()) {
                BigDecimal preco = itemDto.getPrecoCobrado() != null ? itemDto.getPrecoCobrado() : BigDecimal.ZERO;
                totalCalculado = totalCalculado.add(preco);
            }
        }
        
        if (dto.getMateriais() != null && !dto.getMateriais().isEmpty()) {
            for (var mDto : dto.getMateriais()) {
                BigDecimal preco = mDto.getPrecoTotal() != null ? mDto.getPrecoTotal() : BigDecimal.ZERO;
                totalCalculado = totalCalculado.add(preco);
            }
        }
        
        BigDecimal qtdKm = BigDecimal.valueOf(dto.getQuilometragem() != null ? dto.getQuilometragem() : 0);
        BigDecimal custoKm = qtdKm.multiply(valorKm);
        totalCalculado = totalCalculado.add(custoKm);

        BigDecimal diferenca = valorTotal.subtract(totalCalculado).abs();
        if (diferenca.compareTo(new BigDecimal("0.02")) > 0) {
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                    "O valor total enviado (R$ " + valorTotal + ") diverge da soma dos serviços, materiais e deslocamento (R$ " + totalCalculado + ").");
        }

        os.setValorKm(valorKm);
        os.setValorTotal(valorTotal);

        // --- Itens do catálogo ---
        os.getItensServico().clear();
        if (dto.getItensServico() != null && !dto.getItensServico().isEmpty()) {
            for (var itemDto : dto.getItensServico()) {
                ItemServico catalogItem = itemServicoRepository.findById(itemDto.getItemServicoId())
                        .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço do catálogo não encontrado: " + itemDto.getItemServicoId()));

                OrdemServicoItem osItem = new OrdemServicoItem();
                osItem.setOrdemServico(os);
                osItem.setItemServico(catalogItem);
                osItem.setPrecoCobrado(itemDto.getPrecoCobrado());
                os.getItensServico().add(osItem);
            }
        }

        // --- Materiais ---
        os.getMateriais().clear();
        BigDecimal valorTotalMateriais = BigDecimal.ZERO;
        if (dto.getMateriais() != null && !dto.getMateriais().isEmpty()) {
            for (var mDto : dto.getMateriais()) {
                OrdemServicoMaterial osMat = new OrdemServicoMaterial();
                osMat.setOrdemServico(os);
                
                if (mDto.getMaterialId() != null) {
                    Material mat = materialRepository.findById(mDto.getMaterialId())
                            .orElseThrow(() -> new RecursoNaoEncontradoException("Material não encontrado: " + mDto.getMaterialId()));
                    osMat.setMaterial(mat);
                } else {
                    osMat.setNomeMaterial(mDto.getNomeMaterial());
                }
                
                osMat.setPrecoUnitario(mDto.getPrecoUnitario());
                osMat.setQuantidade(mDto.getQuantidade());
                osMat.setPrecoTotal(mDto.getPrecoTotal());
                os.getMateriais().add(osMat);
                valorTotalMateriais = valorTotalMateriais.add(osMat.getPrecoTotal());
            }
        }

        // --- Mecânicos e cálculo de comissão ---
        os.getMecanicos().clear();
        if (dto.getMecanicos() != null && !dto.getMecanicos().isEmpty()) {
            BigDecimal qtdKmParaCalculo = BigDecimal.valueOf(dto.getQuilometragem() != null ? dto.getQuilometragem() : 0);
            BigDecimal custoKmParaCalculo = qtdKmParaCalculo.multiply(valorKm);
            BigDecimal valorApenasServico = valorTotal.subtract(custoKmParaCalculo).subtract(valorTotalMateriais);

            for (var mDto : dto.getMecanicos()) {
                Pessoa func = pessoaRepository.findById(mDto.getMecanico().getId())
                        .orElseThrow(() -> new RecursoNaoEncontradoException("Mecânico não encontrado"));

                OrdemServicoMecanico osm = new OrdemServicoMecanico();
                osm.setOrdemServico(os);
                osm.setMecanico(func);

                BigDecimal porcentagem = BigDecimal.valueOf(
                        func.getPercentualComissao() != null ? func.getPercentualComissao() : 0);

                BigDecimal valorComissao = valorApenasServico.multiply(porcentagem)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                osm.setValorAtribuido(valorComissao);
                os.getMecanicos().add(osm);
            }
        }

        // Atualizar Lançamento Financeiro se existir
        lancamentoRepository.findByOrdemServicoId(os.getId()).ifPresent(lancamento -> {
            lancamento.setDescricao("OS #" + os.getId() + " - " + (os.getVeiculo() != null ? os.getVeiculo() : "Serviços"));
            lancamento.setEnvolvido(os.getCliente() != null ? os.getCliente().getNome() : "Cliente não informado");
            lancamento.setValor(os.getValorTotal());
            lancamentoRepository.save(lancamento);
        });

        return repository.save(os);
    }

    @Transactional(readOnly = true)
    public Page<OrdemServico> listarTodas(Pageable pageable) {
        Page<OrdemServico> page = repository.findAll(pageable);
        page.getContent().forEach(os -> {
            os.getItensServico().size();
            os.getMecanicos().size();
        });
        return page;
    }

    @Transactional(readOnly = true)
    public Page<OrdemServico> listarPorStatus(StatusOS status, Pageable pageable) {
        Page<OrdemServico> page = repository.findByStatus(status, pageable);
        page.getContent().forEach(os -> {
            os.getItensServico().size();
            os.getMecanicos().size();
            os.getMateriais().size();
        });
        return page;
    }

    @Transactional(readOnly = true)
    public Page<OrdemServico> pesquisar(StatusOS status, String busca, Pageable pageable) {
        Page<OrdemServico> page = repository.pesquisar(status, busca, pageable);
        page.getContent().forEach(os -> {
            os.getItensServico().size();
            os.getMecanicos().size();
            os.getMateriais().size();
        });
        return page;
    }

    @Transactional(readOnly = true)
    public OrdemServico buscarPorId(Long id) {
        OrdemServico os = repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("OS não encontrada"));
        os.getItensServico().size();
        os.getMecanicos().size();
        os.getMateriais().size();
        return os;
    }

    // 👇 2. A MÁGICA ACONTECE AQUI
    @Transactional
    public OrdemServico atualizarStatus(Long id, String status) {
        OrdemServico os = buscarPorId(id);
        StatusOS novoStatus;
        try {
            novoStatus = StatusOS.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                    "Status inválido: " + status + ". Valores aceitos: ABERTA, CONCLUIDA, CANCELADA");
        }

        // Se o status da OS está mudando para CONCLUÍDA
        if (novoStatus == StatusOS.CONCLUIDA) {
            // Busca se já existe um lançamento para esta OS
            Lancamento contaReceber = lancamentoRepository.findByOrdemServicoId(os.getId())
                    .orElse(new Lancamento());

            contaReceber.setDescricao("OS #" + os.getId() + " - " + (os.getVeiculo() != null ? os.getVeiculo() : "Serviços"));
            contaReceber.setEnvolvido(os.getCliente() != null ? os.getCliente().getNome() : "Cliente não informado");
            contaReceber.setValor(os.getValorTotal());
            if (contaReceber.getId() == null) {
                contaReceber.setVencimento(LocalDate.now()); // Apenas define vencimento hoje se for novo
                contaReceber.setTipo(TipoLancamento.RECEBER);
                contaReceber.setStatus(StatusLancamento.PENDENTE);
                contaReceber.setOrdemServicoId(os.getId());
            }

            // Salva ou atualiza a conta na tabela de faturamento!
            lancamentoRepository.save(contaReceber);
        } else {
            // Se o novo status NÃO é CONCLUÍDA (ex: reabriu ou cancelou), remove o lançamento se ainda estiver pendente
            lancamentoRepository.findByOrdemServicoId(os.getId()).ifPresent(lancamento -> {
                if (lancamento.getStatus() == StatusLancamento.PENDENTE) {
                    lancamentoRepository.delete(lancamento);
                }
            });
        }

        os.setStatus(novoStatus);
        return repository.save(os);
    }

    @Transactional
    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new RecursoNaoEncontradoException("OS não encontrada com ID: " + id);
        }
        // Remove lançamentos vinculados se existirem
        lancamentoRepository.findByOrdemServicoId(id).ifPresent(lancamento -> {
            lancamentoRepository.delete(lancamento);
        });
        repository.deleteById(id);
    }

    public BigDecimal calcularTotalComissaoMecanico(Long idMecanico, LocalDate inicio, LocalDate fim) {
        return mecanicoRepository.totalComissaoPorMecanicoEPeriodo(idMecanico, inicio, fim);
    }
}