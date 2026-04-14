package com.tcc.backend_TCC.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final String SECRET;
    private final long EXPIRACAO;

    @Autowired
    public JwtService(Environment env) {
        // L� do application.properties (ou vari�vel de ambiente JWT_SECRET)
        this.SECRET = env.getProperty("jwt.secret", "bazani-mecanica-tcc-secret-key-2024-default");
        String expStr = env.getProperty("jwt.expiration", "39600000");
        this.EXPIRACAO = Long.parseLong(expStr);
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    /**
     * Gera token JWT com login e role (armazenados como claims)
     */
    public String gerarToken(String login, String role) {
        return Jwts.builder()
                .subject(login)
                .claim("role", role)  // Armazena a role como claim
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
            extrairLogin(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}