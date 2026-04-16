package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.enuns.StatusOS;
import com.tcc.backend_TCC.model.OrdemServico;
import com.tcc.backend_TCC.model.Pessoa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    List<OrdemServico> findByMecanicos_MecanicoId(Long mecanicoId);

    List<OrdemServico> findByCliente(Pessoa cliente);

    List<OrdemServico> findByStatus(StatusOS status);

    Page<OrdemServico> findByStatus(StatusOS status, Pageable pageable);

    List<OrdemServico> findByDataRegistoBetween(LocalDate inicio, LocalDate fim);

    // Corrigido: valorServico → valorTotal
    @Query("SELECT COALESCE(SUM(os.valorTotal), 0) FROM OrdemServico os " +
            "WHERE os.dataRegisto BETWEEN :inicio AND :fim " +
            "AND os.status = 'CONCLUIDA'")
    BigDecimal totalFaturadoPorPeriodo(
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim
    );
}