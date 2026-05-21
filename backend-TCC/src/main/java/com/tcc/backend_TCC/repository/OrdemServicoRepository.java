package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.enuns.StatusOS;
import com.tcc.backend_TCC.model.OrdemServico;
import com.tcc.backend_TCC.model.Pessoa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    @EntityGraph(attributePaths = {"cliente", "mecanicos", "mecanicos.mecanico"})
    List<OrdemServico> findByMecanicos_MecanicoId(Long mecanicoId);

    @EntityGraph(attributePaths = {"cliente", "mecanicos", "mecanicos.mecanico"})
    List<OrdemServico> findByCliente(Pessoa cliente);

    @EntityGraph(attributePaths = {"cliente", "mecanicos", "mecanicos.mecanico"})
    List<OrdemServico> findByStatus(StatusOS status);

    @EntityGraph(attributePaths = {"cliente", "mecanicos", "mecanicos.mecanico"})
    Page<OrdemServico> findByStatus(StatusOS status, Pageable pageable);

    @EntityGraph(attributePaths = {"cliente", "mecanicos", "mecanicos.mecanico"})
    List<OrdemServico> findByDataRegistoBetween(LocalDate inicio, LocalDate fim);

    // Corrigido: valorServico → valorTotal
    @Query("SELECT COALESCE(SUM(os.valorTotal), 0) FROM OrdemServico os " +
            "WHERE os.dataRegisto BETWEEN :inicio AND :fim " +
            "AND os.status = 'CONCLUIDA'")
    BigDecimal totalFaturadoPorPeriodo(
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim
    );

    // Dashboard metrics otimizado - tudo em uma query só!
    @Query("SELECT " +
           "  COUNT(os), " +
           "  COALESCE(SUM(CASE WHEN os.status = 'CONCLUIDA' THEN os.valorTotal ELSE 0 END), 0), " +
           "  COUNT(CASE WHEN os.status = 'CONCLUIDA' THEN 1 END), " +
           "  COUNT(CASE WHEN os.status = 'ABERTA' THEN 1 END), " +
           "  COUNT(CASE WHEN os.status = 'CANCELADA' THEN 1 END), " +
           "  COUNT(CASE WHEN os.status = 'EM_SERVICO' THEN 1 END), " +
           "  COUNT(CASE WHEN os.status = 'AGUARDANDO_PECA' THEN 1 END), " +
           "  COUNT(CASE WHEN os.dataRegisto = :hoje THEN 1 END) " +
           "FROM OrdemServico os " +
           "WHERE os.dataRegisto BETWEEN :inicio AND :fim")
    Object[] getDashboardMetrics(@Param("inicio") LocalDate inicio, 
                                 @Param("fim") LocalDate fim,
                                 @Param("hoje") LocalDate hoje);
}
