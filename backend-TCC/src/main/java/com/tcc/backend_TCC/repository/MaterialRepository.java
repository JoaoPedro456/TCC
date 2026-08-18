package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.model.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    @Query("SELECT m FROM Material m WHERE " +
           "(:busca IS NULL OR :busca = '' OR " +
           " LOWER(m.nomeMaterial) LIKE LOWER(CONCAT('%', :busca, '%')))")
    Page<Material> pesquisar(@Param("busca") String busca, Pageable pageable);
}
