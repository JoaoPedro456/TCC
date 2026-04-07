package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.enuns.StatusOS;
import com.tcc.backend_TCC.model.OrdemServico;
import com.tcc.backend_TCC.model.OrdemServicoMecanico;
import com.tcc.backend_TCC.repository.OrdemServicoMecanicoRepository;
import com.tcc.backend_TCC.repository.OrdemServicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class OrdemServicoService {

    @Autowired
    private OrdemServicoRepository repository;

    @Autowired
    private OrdemServicoMecanicoRepository mecanicoRepository;

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