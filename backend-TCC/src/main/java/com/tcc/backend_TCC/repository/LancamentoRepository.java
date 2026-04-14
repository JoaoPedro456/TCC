package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.enuns.TipoLancamento;
import com.tcc.backend_TCC.model.Lancamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LancamentoRepository extends JpaRepository<Lancamento, Long> {
    List<Lancamento> findByTipoOrderByVencimentoAsc(TipoLancamento tipo);
}