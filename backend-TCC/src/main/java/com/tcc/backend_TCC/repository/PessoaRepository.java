package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.model.TipoPessoa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

    List<Pessoa> findByTipo(TipoPessoa tipo);

    // Novas buscas para a nossa validação:
    Optional<Pessoa> findByCpf(String cpf);
    Optional<Pessoa> findByTelefone(String telefone);
}