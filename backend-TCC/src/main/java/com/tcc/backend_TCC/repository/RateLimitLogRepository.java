package com.tcc.backend_TCC.repository;

import com.tcc.backend_TCC.model.RateLimitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RateLimitLogRepository extends JpaRepository<RateLimitLog, Long> {
    // Busca logs nas últimas 24 horas para monitoramento
    List<RateLimitLog> findByBlockedAtAfter(LocalDateTime date);
}
