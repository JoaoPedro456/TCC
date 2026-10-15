package com.tcc.backend_TCC.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtService.class);

    /**
     * Segredos que já foram commitados no repositório público (histórico git).
     * Qualquer pessoa pode forjar tokens com eles, então a aplicação se recusa a subir.
     */
    private static final java.util.Set<String> SEGREDOS_VAZADOS = java.util.Set.of(
            "bazani-mecanica-tcc-2026-secret-key-min-256-bits-required",
            "dev-only-secret-key-do-not-use-in-production-bazani-2026"
    );

    private final String SECRET;
    private final long EXPIRACAO;

    @Autowired
    public JwtService(Environment env) {
        this.SECRET = env.getProperty("jwt.secret");
        if (this.SECRET == null || this.SECRET.isBlank()) {
            throw new IllegalStateException("JWT_SECRET não configurado! Configure a variável de ambiente JWT_SECRET.");
        }
        if (this.SECRET.length() < 32) {
            throw new IllegalStateException("JWT_SECRET muito curto! Mínimo de 32 caracteres.");
        }
        if (SEGREDOS_VAZADOS.contains(this.SECRET.trim())) {
            throw new IllegalStateException(
                    "JWT_SECRET comprometido! Este valor está no histórico público do repositório. " +
                    "Gere um novo segredo aleatório (ex.: openssl rand -base64 64).");
        }
        if (this.SECRET.chars().distinct().count() < 10) {
            throw new IllegalStateException("JWT_SECRET com baixa entropia! Use um valor aleatório.");
        }
        String expStr = env.getProperty("jwt.expiration", "39600000");
        this.EXPIRACAO = Long.parseLong(expStr);
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    public String gerarToken(String login, String role) {
        return Jwts.builder()
                .subject(login)
                .claim("role", role)  // Armazena a role como claim
                .claim("jti", java.util.UUID.randomUUID().toString()) // Unique token identifier to prevent session fixation / duplication
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRACAO))
                .signWith(getKey())
                .compact();
    }

    /**
     * Gera token apenas com login (backward compatibility)
     * @deprecated Use gerarToken(String login, String role)
     */
    public String gerarToken(String login) {
        return gerarToken(login, "OPERADOR");
    }

    public String extrairLogin(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * Extrai a role do token JWT
     */
    public String extrairRole(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.get("role", String.class);
    }

    public boolean tokenValido(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                return false;
            }
            extrairLogin(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Date extrairExpiracao(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
    }

    // Compatibility methods for tests
    public String generateToken(String login, String role) {
        return gerarToken(login, role);
    }
    public boolean validateToken(String token) {
        return tokenValido(token);
    }
    public String extractUsername(String token) {
        return extrairLogin(token);
    }
    public Date extractExpiration(String token) {
        return extrairExpiracao(token);
    }
    public boolean isTokenExpired(String token) {
        try {
            return extrairExpiracao(token).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
}