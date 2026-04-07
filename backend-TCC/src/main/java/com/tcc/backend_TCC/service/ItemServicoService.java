package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.model.ItemServico;
import com.tcc.backend_TCC.repository.ItemServicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemServicoService {

    @Autowired
    private ItemServicoRepository repository;

    public List<ItemServico> listarTodos() {
        return repository.findAll();
    }

    public ItemServico salvar(ItemServico s) {
        return repository.save(s);
    }

    public void excluir(Long id) {
        repository.deleteById(id);
    }
}