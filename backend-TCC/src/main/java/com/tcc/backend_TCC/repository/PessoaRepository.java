package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.model.Pessoa;
import com.tcc.backend_TCC.enuns.TipoPessoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

    List<Pessoa> findByTipo(TipoPessoa tipo);

    long countByTipo(TipoPessoa tipo);

    @Query(value = "SELECT * FROM pessoa WHERE cpf = :cpf", nativeQuery = true)
    Optional<Pessoa> findByCpfIncludingDeleted(@Param("cpf") String cpf);

    @Query(value = "SELECT * FROM pessoa WHERE cnpj = :cnpj", nativeQuery = true)
    Optional<Pessoa> findByCnpjIncludingDeleted(@Param("cnpj") String cnpj);

    @Query(value = "SELECT * FROM pessoa WHERE telefone = :telefone", nativeQuery = true)
    Optional<Pessoa> findByTelefoneIncludingDeleted(@Param("telefone") String telefone);
}
