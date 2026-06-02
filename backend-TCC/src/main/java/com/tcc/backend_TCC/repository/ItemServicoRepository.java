package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.model.ItemServico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemServicoRepository extends JpaRepository<ItemServico, Long> {

    // Busca exata original
    List<ItemServico> findByNomeServicoContainingIgnoreCase(String nome);

    // Listagem paginada e busca geral
    org.springframework.data.domain.Page<ItemServico> findByAtivoTrue(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM ItemServico s WHERE s.ativo = true AND LOWER(s.nomeServico) LIKE LOWER(CONCAT('%', :busca, '%'))")
    org.springframework.data.domain.Page<ItemServico> pesquisarPorNome(String busca, org.springframework.data.domain.Pageable pageable);

    // Método sem paginação original (para compatibilidade, caso necessário)
    List<ItemServico> findByAtivoTrue();
}