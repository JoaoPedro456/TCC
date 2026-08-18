package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.exception.RecursoNaoEncontradoException;
import com.tcc.backend_TCC.model.Material;
import com.tcc.backend_TCC.model.MaterialDTO;
import com.tcc.backend_TCC.repository.MaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MaterialService {

    @Autowired
    private MaterialRepository repository;

    @Transactional
    public Material salvar(MaterialDTO dto) {
        Material mat = new Material();
        mat.setNomeMaterial(dto.getNomeMaterial());
        mat.setUnidadeMedida(dto.getUnidadeMedida());
        mat.setPrecoTabela(dto.getPrecoTabela());
        return repository.save(mat);
    }

    @Transactional
    public Material atualizar(Long id, MaterialDTO dto) {
        Material mat = repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Material não encontrado"));
        mat.setNomeMaterial(dto.getNomeMaterial());
        mat.setUnidadeMedida(dto.getUnidadeMedida());
        mat.setPrecoTabela(dto.getPrecoTabela());
        return repository.save(mat);
    }

    @Transactional(readOnly = true)
    public Page<Material> pesquisar(String busca, Pageable pageable) {
        return repository.pesquisar(busca, pageable);
    }

    @Transactional(readOnly = true)
    public Material buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Material não encontrado"));
    }

    @Transactional
    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Material não encontrado com ID: " + id);
        }
        repository.deleteById(id);
    }
}
