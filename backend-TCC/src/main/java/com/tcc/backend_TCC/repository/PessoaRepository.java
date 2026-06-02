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

    // Métodos para paginação e busca geral
    org.springframework.data.domain.Page<Pessoa> findByAtivoTrue(org.springframework.data.domain.Pageable pageable);
    
    @Query("SELECT p FROM Pessoa p WHERE p.ativo = true AND LOWER(p.nome) LIKE LOWER(CONCAT('%', :busca, '%'))")
    org.springframework.data.domain.Page<Pessoa> pesquisarPorNome(String busca, org.springframework.data.domain.Pageable pageable);

    // Métodos para paginação e busca por tipo
    org.springframework.data.domain.Page<Pessoa> findByTipoAndAtivoTrue(TipoPessoa tipo, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT p FROM Pessoa p WHERE p.ativo = true AND p.tipo = :tipo AND LOWER(p.nome) LIKE LOWER(CONCAT('%', :busca, '%'))")
    org.springframework.data.domain.Page<Pessoa> pesquisarPorNomeETipo(String busca, TipoPessoa tipo, org.springframework.data.domain.Pageable pageable);

    // Métodos sem paginação (mantidos caso algo precise, ou podem ser removidos futuramente se não usados)
    List<Pessoa> findByAtivoTrue();
    List<Pessoa> findByTipoAndAtivoTrue(TipoPessoa tipo);

    long countByTipoAndAtivoTrue(TipoPessoa tipo);

    @Query(value = "SELECT * FROM pessoa WHERE cpf = :cpf", nativeQuery = true)
    Optional<Pessoa> findByCpfIncludingDeleted(@Param("cpf") String cpf);

    @Query(value = "SELECT * FROM pessoa WHERE cnpj = :cnpj", nativeQuery = true)
    Optional<Pessoa> findByCnpjIncludingDeleted(@Param("cnpj") String cnpj);

    @Query(value = "SELECT * FROM pessoa WHERE telefone = :telefone", nativeQuery = true)
    Optional<Pessoa> findByTelefoneIncludingDeleted(@Param("telefone") String telefone);

    Optional<Pessoa> findByCpfAndAtivoTrue(String cpf);
    Optional<Pessoa> findByCnpjAndAtivoTrue(String cnpj);
    Optional<Pessoa> findByTelefoneAndAtivoTrue(String telefone);
}
