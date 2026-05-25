package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.model.ItemServico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemServicoRepository extends JpaRepository<ItemServico, Long> {

    // Bônus: Caso você queira buscar um serviço pelo nome exato no futuro
    List<ItemServico> findByNomeServicoContainingIgnoreCase(String nome);

    List<ItemServico> findByAtivoTrue();
}