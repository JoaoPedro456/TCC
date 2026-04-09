package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.enuns.StatusOS;
import com.tcc.backend_TCC.model.*;
import com.tcc.backend_TCC.repository.OrdemServicoMecanicoRepository;
import com.tcc.backend_TCC.repository.OrdemServicoRepository;
import com.tcc.backend_TCC.repository.PessoaRepository;
import com.tcc.backend_TCC.repository.ItemServicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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

    @Transactional
    public OrdemServico salvar(OrdemServico os) {
        // Vincula cada mecânico à OS antes de salvar
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

        // Vincula cliente
        if (dto.getCliente() != null && dto.getCliente().getId() != null) {
            Pessoa cliente = pessoaRepository.findById(dto.getCliente().getId())
                    .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
            os.setCliente(cliente);
        }

        os.setObservacao(dto.getObservacao());
        os.setQuilometragem(dto.getQuilometragem());
        os.setValorTotal(dto.getValorTotal() != null ? dto.getValorTotal() : BigDecimal.ZERO);
        os.setStatus(StatusOS.ABERTA);

        // Vincula itens de servico
        if (dto.getItensServicoIds() != null && !dto.getItensServicoIds().isEmpty()) {
            List<ItemServico> itens = itemServicoRepository.findAllById(dto.getItensServicoIds());
            os.setItensServico(itens);
        }

        // Vincula mecanicos (sem valor, comissao calculada automaticamente)
        if (dto.getMecanicos() != null && !dto.getMecanicos().isEmpty()) {
            List<OrdemServicoMecanico> mecanicos = new ArrayList<>();
            for (var mDto : dto.getMecanicos()) {
                OrdemServicoMecanico mecanico = new OrdemServicoMecanico();
                mecanico.setOrdemServico(os);
                if (mDto.getMecanico() != null && mDto.getMecanico().getId() != null) {
                    Pessoa func = pessoaRepository.findById(mDto.getMecanico().getId())
                            .orElseThrow(() -> new RuntimeException("Mecânico não encontrado"));
                    mecanico.setMecanico(func);
                    mecanicos.add(mecanico);
                }
            }
            os.setMecanicos(mecanicos);
        }

        return repository.save(os);
    }

    public List<OrdemServico> listarTodas() {
        return repository.findAll();
    }

    public OrdemServico buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("OS não encontrada"));
    }

    @Transactional
    public OrdemServico atualizarStatus(Long id, String status) {
        OrdemServico os = buscarPorId(id);
        os.setStatus(StatusOS.valueOf(status));
        return repository.save(os);
    }

    public void excluir(Long id) {
        repository.deleteById(id);
    }

    public BigDecimal calcularTotalComissaoMecanico(Long idMecanico, LocalDate inicio, LocalDate fim) {
        return mecanicoRepository.totalComissaoPorMecanicoEPeriodo(idMecanico, inicio, fim);
    }
}