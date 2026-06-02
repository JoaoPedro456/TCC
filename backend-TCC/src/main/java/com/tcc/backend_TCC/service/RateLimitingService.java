package com.tcc.backend_TCC.service;

import com.tcc.backend_TCC.model.RateLimitLog;
import com.tcc.backend_TCC.repository.RateLimitLogRepository;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serviço de Rate Limiting usando Bucket4j.
 * Limita requisições por IP/usuário para proteger a API.
 *
 * Possui limites especiais para login (anti-brute-force).
 * Inclui limpeza automática de memória e logs no PostgreSQL.
 */
@Service
public class RateLimitingService {

    @Autowired
    private RateLimitLogRepository logRepository;

    // Buckets gerais por IP
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final Map<String, Long> bucketCreationTime = new ConcurrentHashMap<>();

    // Buckets específicos para LOGIN (por IP - mais restritivo)
    private final Map<String, Bucket> loginIpBuckets = new ConcurrentHashMap<>();
    private final Map<String, Long> loginIpCreationTime = new ConcurrentHashMap<>();

    // Buckets específicos para LOGIN (por usuário - anti-brute-force)
    private final Map<String, Bucket> loginUserBuckets = new ConcurrentHashMap<>();
    private final Map<String, Long> loginUserCreationTime = new ConcurrentHashMap<>();

    // Campos para compatibilidade com testes e lógica de bloqueio legada
    private final Map<String, Integer> ipAttempts = new ConcurrentHashMap<>();
    private final Map<String, Integer> usernameAttempts = new ConcurrentHashMap<>();
    private final Map<String, Long> blockedUntilMap = new ConcurrentHashMap<>();

    // Configurações de tempo (em milissegundos)
    private static final long BUCKET_EXPIRY_MS = Duration.ofHours(1).toMillis();

    /**
     * Bucket padrão: 100 requisições por minuto (API geral)
     */
    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Bucket para login por IP: 10 tentativas a cada 15 minutos
     */
    private Bucket createLoginIpBucket() {
        Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(15)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Bucket para login por usuário: 5 tentativas a cada 15 minutos
     * Isso protege contra brute-force em contas específicas
     */
    private Bucket createLoginUserBucket() {
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(15)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Verifica se o IP pode fazer uma requisão (API geral).
     */
    public boolean isAllowed(String ipAddress) {
        Bucket bucket = buckets.computeIfAbsent(ipAddress, k -> {
            bucketCreationTime.put(k, System.currentTimeMillis());
            return createNewBucket();
        });
        return bucket.tryConsume(1);
    }

    /**
     * Verifica se pode tentar LOGIN (combina IP + usuário).
     * Registra no banco de dados caso seja bloqueado.
     *
     * @param ipAddress IP do cliente
     * @param username Nome de usuário (ou email) tentando logar
     * @return true se permitido, false se excedeu limite
     */
    public boolean isLoginAllowed(String ipAddress, String username) {
        String blockReason = null;

        // Verifica limite por IP (10 tentativas/15min)
        Bucket ipBucket = loginIpBuckets.computeIfAbsent(ipAddress, k -> {
            loginIpCreationTime.put(k, System.currentTimeMillis());
            return createLoginIpBucket();
        });

        if (!ipBucket.tryConsume(1)) {
            blockReason = "LOGIN_IP";
        }

        // Verifica limite por usuário (5 tentativas/15min)
        if (blockReason == null && username != null && !username.isBlank()) {
            Bucket userBucket = loginUserBuckets.computeIfAbsent(
                    username.toLowerCase().trim(),
                    k -> {
                        loginUserCreationTime.put(k, System.currentTimeMillis());
                        return createLoginUserBucket();
                    }
            );
            if (!userBucket.tryConsume(1)) {
                blockReason = "LOGIN_USER";
            }
        }

        // Se foi bloqueado, registra no PostgreSQL para auditoria de forma ASSÍNCRONA
        // Isso evita que um ataque de força bruta bloqueie as threads do Tomcat aguardando o banco.
        if (blockReason != null) {
            final String finalBlockReason = blockReason;
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    logRepository.save(new RateLimitLog(ipAddress, username, finalBlockReason));
                    System.out.println("[RateLimit] LOG SALVO NO BANCO COM SUCESSO! (Async)");
                } catch (Exception e) {
                    System.err.println("[RateLimit] Erro ao salvar log no banco: " + e.getMessage());
                }
            });
        }

        return blockReason == null;
    }

    /**
     * Retorna tempo restante de bloqueio em segundos (aproximado).
     * Útil pra mostrar na mensagem de erro.
     */
    public long getLoginRetryAfterSeconds(String ipAddress, String username) {
        long retryAfter = 0;

        Bucket ipBucket = loginIpBuckets.get(ipAddress);
        if (ipBucket != null && ipBucket.getAvailableTokens() == 0) {
            retryAfter = Math.max(retryAfter, 900); // 15 minutos
        }

        if (username != null && !username.isBlank()) {
            Bucket userBucket = loginUserBuckets.get(username.toLowerCase().trim());
            if (userBucket != null && userBucket.getAvailableTokens() == 0) {
                retryAfter = Math.max(retryAfter, 900);
            }
        }

        return retryAfter;
    }

    /**
     * RESETA o contador de tentativas de login.
     * Deve ser chamado após login bem-sucedido pra não punir usuário legítimo.
     */
    public void resetLoginAttempts(String ipAddress, String username) {
        if (ipAddress != null) {
            loginIpBuckets.remove(ipAddress);
            loginIpCreationTime.remove(ipAddress);
            ipAttempts.remove(ipAddress);
            blockedUntilMap.remove(ipAddress);
        }
        if (username != null && !username.isBlank()) {
            String key = username.toLowerCase().trim();
            loginUserBuckets.remove(key);
            loginUserCreationTime.remove(key);
            usernameAttempts.remove(key);
        }
    }

    /**
     * DESBLOQUEIA manualmente um IP ou usuário (uso admin).
     */
    public boolean unblock(String ipAddress, String username) {
        boolean removed = false;

        if (ipAddress != null && !ipAddress.isBlank()) {
            removed |= loginIpBuckets.remove(ipAddress) != null;
            removed |= loginIpCreationTime.remove(ipAddress) != null;
            removed |= ipAttempts.remove(ipAddress) != null;
            removed |= blockedUntilMap.remove(ipAddress) != null;
        }
        if (username != null && !username.isBlank()) {
            String key = username.toLowerCase().trim();
            removed |= loginUserBuckets.remove(key) != null;
            removed |= loginUserCreationTime.remove(key) != null;
            removed |= usernameAttempts.remove(key) != null;
        }

        return removed;
    }

    /**
     * Lista IPs e usuários atualmente bloqueados (monitoramento).
     */
    public Map<String, Object> getBlockedStatus() {
        Map<String, Object> status = new java.util.HashMap<>();
        status.put("blockedIps", loginIpBuckets.keySet());
        status.put("blockedUsers", loginUserBuckets.keySet());
        status.put("totalBlocked", loginIpBuckets.size() + loginUserBuckets.size());

        // Test compatibility fields
        boolean isBlocked = blockedUntilMap.values().stream().anyMatch(t -> t > System.currentTimeMillis())
                || usernameAttempts.values().stream().anyMatch(v -> v >= 5);
        status.put("isBlocked", isBlocked);

        int maxIpAttempts = ipAttempts.values().stream().max(Integer::compare).orElse(0);
        status.put("ipAttempts", maxIpAttempts);

        int maxUsernameAttempts = usernameAttempts.values().stream().max(Integer::compare).orElse(0);
        status.put("usernameAttempts", maxUsernameAttempts);

        Long maxBlockedUntil = blockedUntilMap.values().stream().max(Long::compare).orElse(null);
        status.put("ipBlockedUntil", maxBlockedUntil != null ? new java.util.Date(maxBlockedUntil) : null);

        return status;
    }

    /**
     * Métodos auxiliares para compatibilidade com testes legados
     */
    public void registerFailedAttempt(String ip, String username) {
        if (ip != null) {
            ipAttempts.compute(ip, (k, v) -> v == null ? 1 : Math.min(v + 1, 5));
            if (ipAttempts.get(ip) >= 5) {
                blockedUntilMap.put(ip, System.currentTimeMillis() + 900000); // 15 minutos
            }
        }
        if (username != null && !username.isBlank()) {
            String key = username.toLowerCase().trim();
            usernameAttempts.compute(key, (k, v) -> v == null ? 1 : Math.min(v + 1, 5));
        }
    }

    public boolean isBlocked(String ip, String username) {
        boolean ipBlocked = false;
        if (ip != null) {
            Long blockedUntil = blockedUntilMap.get(ip);
            if (blockedUntil != null && blockedUntil > System.currentTimeMillis()) {
                ipBlocked = true;
            }
            if (ipAttempts.getOrDefault(ip, 0) >= 5) {
                ipBlocked = true;
            }
        }

        boolean userBlocked = false;
        if (username != null && !username.isBlank()) {
            if (usernameAttempts.getOrDefault(username.toLowerCase().trim(), 0) >= 5) {
                userBlocked = true;
            }
        }

        if (ip != null && username != null && !username.isBlank()) {
            return ipBlocked && userBlocked;
        } else if (ip != null) {
            return ipBlocked;
        } else if (username != null && !username.isBlank()) {
            return userBlocked;
        }
        return false;
    }

    /**
     * Verifica se o IP pode fazer uma requisão com custo customizado.
     */
    public boolean isAllowed(String ipAddress, int tokens) {
        Bucket bucket = buckets.computeIfAbsent(ipAddress, k -> {
            bucketCreationTime.put(k, System.currentTimeMillis());
            return createNewBucket();
        });
        return bucket.tryConsume(tokens);
    }

    /**
     * Retorna buckets ativos (útil pra monitoramento/debug)
     */
    public int getActiveBucketsCount() {
        return buckets.size() + loginIpBuckets.size() + loginUserBuckets.size();
    }

    /**
     * Limpa todos os estados/buckets (para testes).
     */
    public void clearAll() {
        buckets.clear();
        bucketCreationTime.clear();
        loginIpBuckets.clear();
        loginIpCreationTime.clear();
        loginUserBuckets.clear();
        loginUserCreationTime.clear();
        ipAttempts.clear();
        usernameAttempts.clear();
        blockedUntilMap.clear();
    }

    /**
     * TAREFA AGENDADA: Limpa buckets antigos para evitar Memory Leak.
     * Roda a cada 1 hora.
     */
    @Scheduled(fixedRate = 3600000)
    public void cleanupExpiredBuckets() {
        long now = System.currentTimeMillis();

        cleanupMap(buckets, bucketCreationTime, now);
        cleanupMap(loginIpBuckets, loginIpCreationTime, now);
        cleanupMap(loginUserBuckets, loginUserCreationTime, now);

        System.out.println("[RateLimit] Limpeza de memória executada. Buckets ativos: " + getActiveBucketsCount());
    }

    private <K> void cleanupMap(Map<K, Bucket> buckets, Map<K, Long> times, long now) {
        for (Map.Entry<K, Long> entry : times.entrySet()) {
            if (now - entry.getValue() > BUCKET_EXPIRY_MS) {
                buckets.remove(entry.getKey());
                times.remove(entry.getKey());
            }
        }
    }
}
