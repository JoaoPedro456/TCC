package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.exception.RecursoNaoEncontradoException;
import com.tcc.backend_TCC.model.ItemServico;
import com.tcc.backend_TCC.repository.ItemServicoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemServicoService {

    @Autowired
    private ItemServicoRepository repository;

    public org.springframework.data.domain.Page<ItemServico> listarTodos(String busca, org.springframework.data.domain.Pageable pageable) {
        if (busca != null && !busca.trim().isEmpty()) {
            return repository.pesquisarPorNome(busca, pageable);
        }
        return repository.findByAtivoTrue(pageable);
    }

    public List<ItemServico> listarTodos() {
        return repository.findByAtivoTrue();
    }

    public ItemServico salvar(ItemServico s) {
        s.setId(null);
        s.setAtivo(true);
        if (s.getNomeServico() != null && !s.getNomeServico().trim().isEmpty()) {
            repository.findByNomeServicoIgnoreCaseAndAtivoTrue(s.getNomeServico().trim()).ifPresent(existente -> {
                throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                        "Já existe um serviço ativo cadastrado com o nome '" + s.getNomeServico().trim() + "'.");
            });
        }
        return repository.save(s);
    }

    public void excluir(Long id) {
        repository.deleteById(id);
    }

    public ItemServico atualizar(Long id, @Valid ItemServico dados) {
        ItemServico servico = repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado"));
        if (dados.getNomeServico() != null && !dados.getNomeServico().trim().isEmpty()) {
            repository.findByNomeServicoIgnoreCaseAndAtivoTrue(dados.getNomeServico().trim()).ifPresent(existente -> {
                if (!existente.getId().equals(id)) {
                    throw new com.tcc.backend_TCC.exception.OperacaoInvalidaException(
                            "Já existe outro serviço ativo cadastrado com o nome '" + dados.getNomeServico().trim() + "'.");
                }
            });
        }
        servico.setNomeServico(dados.getNomeServico());
        servico.setPrecoTabela(dados.getPrecoTabela());
        return repository.save(servico);
    }
}