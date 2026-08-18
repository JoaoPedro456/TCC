package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.enuns.StatusOrcamento;
import com.tcc.backend_TCC.exception.RecursoNaoEncontradoException;
import com.tcc.backend_TCC.model.*;
import com.tcc.backend_TCC.repository.ItemServicoRepository;
import com.tcc.backend_TCC.repository.MaterialRepository;
import com.tcc.backend_TCC.repository.OrcamentoRepository;
import com.tcc.backend_TCC.repository.PessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrcamentoService {

    @Autowired
    private OrcamentoRepository repository;

    @Autowired
    private PessoaRepository pessoaRepository;

    @Autowired
    private ItemServicoRepository itemServicoRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private OrdemServicoService ordemServicoService;

    @Transactional
    public Orcamento salvar(OrcamentoDTO dto) {
        Orcamento orc = new Orcamento();
        preencherDadosBasicos(orc, dto);
        return repository.save(orc);
    }

    @Transactional
    public Orcamento atualizar(Long id, OrcamentoDTO dto) {
        Orcamento orc = buscarPorId(id);
        preencherDadosBasicos(orc, dto);
        return repository.save(orc);
    }

    private void preencherDadosBasicos(Orcamento orc, OrcamentoDTO dto) {
        if (dto.getCliente() != null && dto.getCliente().getId() != null) {
            Pessoa cliente = pessoaRepository.findById(dto.getCliente().getId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado"));
            orc.setCliente(cliente);
        }

        orc.setObservacao(dto.getObservacao());
        orc.setVeiculo(dto.getVeiculo());
        orc.setQuilometragem(dto.getQuilometragem());
        
        BigDecimal valorKm = dto.getValorKm() != null ? dto.getValorKm() : BigDecimal.ZERO;
        BigDecimal valorDesconto = dto.getValorDesconto() != null ? dto.getValorDesconto() : BigDecimal.ZERO;
        BigDecimal valorTotal = dto.getValorTotal() != null ? dto.getValorTotal() : BigDecimal.ZERO;

        orc.setValorKm(valorKm);
        orc.setValorDesconto(valorDesconto);
        orc.setValorTotal(valorTotal);

        orc.getItensServico().clear();
        if (dto.getItensServico() != null && !dto.getItensServico().isEmpty()) {
            for (var itemDto : dto.getItensServico()) {
                ItemServico catalogItem;

                if (itemDto.getItemServicoId() != null) {
                    catalogItem = itemServicoRepository.findById(itemDto.getItemServicoId())
                            .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço do catálogo não encontrado: " + itemDto.getItemServicoId()));
                } else {
                    // Criar serviço na hora
                    if (itemDto.getDescricaoServico() == null || itemDto.getDescricaoServico().isBlank()) {
                        throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException("Serviços novos exigem uma descrição.");
                    }
                    catalogItem = new ItemServico();
                    catalogItem.setNomeServico(itemDto.getDescricaoServico());
                    catalogItem.setPrecoTabela(itemDto.getPrecoCobrado());
                    catalogItem = itemServicoRepository.save(catalogItem);
                }

                OrcamentoItem orcItem = new OrcamentoItem();
                orcItem.setOrcamento(orc);
                orcItem.setItemServico(catalogItem);
                orcItem.setPrecoCobrado(itemDto.getPrecoCobrado());
                orc.getItensServico().add(orcItem);
            }
        }

        orc.getMateriais().clear();
        if (dto.getMateriais() != null && !dto.getMateriais().isEmpty()) {
            for (var mDto : dto.getMateriais()) {
                OrcamentoMaterial orcMat = new OrcamentoMaterial();
                orcMat.setOrcamento(orc);
                
                if (mDto.getMaterialId() != null) {
                    Material mat = materialRepository.findById(mDto.getMaterialId())
                            .orElseThrow(() -> new RecursoNaoEncontradoException("Material não encontrado: " + mDto.getMaterialId()));
                    orcMat.setMaterial(mat);
                } else {
                    orcMat.setNomeMaterial(mDto.getNomeMaterial());
                }
                
                orcMat.setPrecoUnitario(mDto.getPrecoUnitario());
                orcMat.setQuantidade(mDto.getQuantidade());
                orcMat.setPrecoTotal(mDto.getPrecoTotal());
                orc.getMateriais().add(orcMat);
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<Orcamento> pesquisar(StatusOrcamento status, String busca, Pageable pageable) {
        Page<Orcamento> page = repository.pesquisar(status, busca, pageable);
        page.getContent().forEach(o -> {
            o.getItensServico().size();
            o.getMateriais().size();
        });
        return page;
    }

    @Transactional(readOnly = true)
    public Orcamento buscarPorId(Long id) {
        Orcamento orc = repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Orçamento não encontrado"));
        orc.getItensServico().size();
        orc.getMateriais().size();
        return orc;
    }

    @Transactional
    public Orcamento atualizarStatus(Long id, String statusStr) {
        Orcamento orc = buscarPorId(id);
        try {
            orc.setStatus(StatusOrcamento.valueOf(statusStr));
        } catch (IllegalArgumentException e) {
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException("Status inválido.");
        }
        return repository.save(orc);
    }

    @Transactional
    public OrdemServico aprovarEGerarOS(Long id) {
        Orcamento orc = buscarPorId(id);
        if (orc.getStatus() == StatusOrcamento.APROVADO) {
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException("Orçamento já está aprovado.");
        }

        orc.setStatus(StatusOrcamento.APROVADO);
        repository.save(orc);

        if (orc.getCliente() == null) {
            throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException("Para gerar uma Ordem de Serviço, você precisa primeiro editar o orçamento e vincular um cliente válido.");
        }

        // Criar DTO para salvar a OS, garantindo as mesmas validações
        OrdemServicoDTO osDto = new OrdemServicoDTO();
        OrdemServicoDTO.ClienteDTO cliDto = new OrdemServicoDTO.ClienteDTO();
        cliDto.setId(orc.getCliente().getId());
        osDto.setCliente(cliDto);
        
        osDto.setObservacao(orc.getObservacao());
        // DataRealizacao não está no orçamento de forma exata, deixamos nulo ou atual
        osDto.setVeiculo(orc.getVeiculo());
        osDto.setQuilometragem(orc.getQuilometragem());
        osDto.setValorKm(orc.getValorKm());
        osDto.setValorTotal(orc.getValorTotal()); // Orçamento tem desconto, mas a OS armazena o valorTotal final
        
        List<OrdemServicoDTO.OrdemServicoItemDTO> itensDto = new ArrayList<>();
        for (OrcamentoItem item : orc.getItensServico()) {
            OrdemServicoDTO.OrdemServicoItemDTO iDto = new OrdemServicoDTO.OrdemServicoItemDTO();
            iDto.setItemServicoId(item.getItemServico().getId());
            iDto.setPrecoCobrado(item.getPrecoCobrado());
            itensDto.add(iDto);
        }
        osDto.setItensServico(itensDto);
        
        List<OrdemServicoDTO.OrdemServicoMaterialDTO> materiaisDto = new ArrayList<>();
        for (OrcamentoMaterial mat : orc.getMateriais()) {
            OrdemServicoDTO.OrdemServicoMaterialDTO mDto = new OrdemServicoDTO.OrdemServicoMaterialDTO();
            if (mat.getMaterial() != null) {
                mDto.setMaterialId(mat.getMaterial().getId());
            } else {
                mDto.setNomeMaterial(mat.getNomeMaterial());
            }
            mDto.setPrecoUnitario(mat.getPrecoUnitario());
            mDto.setQuantidade(mat.getQuantidade());
            mDto.setPrecoTotal(mat.getPrecoTotal());
            materiaisDto.add(mDto);
        }
        osDto.setMateriais(materiaisDto);
        // Mecanicos vao vazios
        
        return ordemServicoService.salvar(osDto);
    }

    @Transactional
    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Orçamento não encontrado com ID: " + id);
        }
        repository.deleteById(id);
    }
}
