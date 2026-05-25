package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.enuns.TipoLancamento;
import com.tcc.backend_TCC.model.Lancamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LancamentoRepository extends JpaRepository<Lancamento, Long> {
    List<Lancamento> findByTipoOrderByVencimentoAsc(TipoLancamento tipo);
    org.springframework.data.domain.Page<Lancamento> findByTipoOrderByVencimentoAsc(com.tcc.backend_TCC.enuns.TipoLancamento tipo, org.springframework.data.domain.Pageable pageable);
    java.util.Optional<Lancamento> findByOrdemServicoId(Long ordemServicoId);
    void deleteByOrdemServicoId(Long ordemServicoId);

    @org.springframework.data.jpa.repository.Query("SELECT l FROM Lancamento l " +
           "WHERE l.tipo = :tipo " +
           "AND (:status IS NULL OR l.status = :status) " +
           "AND (:busca IS NULL OR :busca = '' OR LOWER(l.descricao) LIKE LOWER(CONCAT('%', :busca, '%')) OR LOWER(l.envolvido) LIKE LOWER(CONCAT('%', :busca, '%')))")
    org.springframework.data.domain.Page<Lancamento> pesquisar(
            @org.springframework.data.repository.query.Param("tipo") com.tcc.backend_TCC.enuns.TipoLancamento tipo,
            @org.springframework.data.repository.query.Param("status") com.tcc.backend_TCC.enuns.StatusLancamento status,
            @org.springframework.data.repository.query.Param("busca") String busca,
            org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(l.valor), 0) FROM Lancamento l WHERE l.tipo = :tipo AND l.status <> 'PAGO'")
    java.math.BigDecimal sumPendenteByTipo(@org.springframework.data.repository.query.Param("tipo") com.tcc.backend_TCC.enuns.TipoLancamento tipo);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(CASE WHEN l.tipo = 'RECEBER' THEN l.valor ELSE -l.valor END), 0) FROM Lancamento l WHERE l.status = 'PAGO'")
    java.math.BigDecimal getSaldoAtual();
}