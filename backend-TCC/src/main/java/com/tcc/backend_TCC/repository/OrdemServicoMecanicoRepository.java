package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.model.OrdemServicoMecanico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrdemServicoMecanicoRepository extends JpaRepository<OrdemServicoMecanico, Long> {

    List<OrdemServicoMecanico> findByMecanicoId(Long mecanicoId);

    @Query("SELECT COUNT(m) FROM OrdemServicoMecanico m " +
            "WHERE m.mecanico.id = :mecanicoId " +
            "AND m.ordemServico.dataRegisto BETWEEN :inicio AND :fim")
    long contarOSPormecanicoEPeriodo(
            @Param("mecanicoId") Long mecanicoId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim
    );

    @Query("SELECT COALESCE(SUM(m.valorComissao), 0) FROM OrdemServicoMecanico m " +
            "WHERE m.mecanico.id = :mecanicoId " +
            "AND m.ordemServico.dataRegisto BETWEEN :inicio AND :fim")
    BigDecimal totalComissaoPorMecanicoEPeriodo(
            @Param("mecanicoId") Long mecanicoId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim
    );

    @Query("SELECT osm FROM OrdemServicoMecanico osm " +
            "WHERE osm.mecanico.id = :mecanicoId " +
            "AND osm.ordemServico.status = 'CONCLUIDA' " +
            "AND osm.ordemServico.dataRegisto BETWEEN :inicio AND :fim")
    List<OrdemServicoMecanico> buscarComissoesMes(Long mecanicoId, LocalDate inicio, LocalDate fim);
}