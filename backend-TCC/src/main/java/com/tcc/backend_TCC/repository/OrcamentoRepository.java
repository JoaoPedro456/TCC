package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.enuns.StatusOrcamento;
import com.tcc.backend_TCC.model.Orcamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {

    @EntityGraph(attributePaths = {"cliente"})
    Page<Orcamento> findByStatus(StatusOrcamento status, Pageable pageable);

    @EntityGraph(attributePaths = {"cliente"})
    @Query("SELECT o FROM Orcamento o LEFT JOIN o.cliente c WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:busca IS NULL OR :busca = '' OR " +
           " LOWER(c.nome) LIKE LOWER(CONCAT('%', :busca, '%')) OR " +
           " LOWER(o.veiculo) LIKE LOWER(CONCAT('%', :busca, '%')) OR " +
           " CAST(o.id AS string) LIKE CONCAT('%', :busca, '%'))")
    Page<Orcamento> pesquisar(
            @Param("status") StatusOrcamento status,
            @Param("busca") String busca,
            Pageable pageable
    );
}
