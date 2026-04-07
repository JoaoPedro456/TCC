package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.model.TipoPessoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PessoaRepository extends JpaRepository<Pessoa, Long> {
    List<Pessoa> findByTipo(TipoPessoa tipo);
    List<Pessoa> findByNomeContainingIgnoreCase(String nome);
}