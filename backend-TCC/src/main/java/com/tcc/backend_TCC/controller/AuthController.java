package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.service.RateLimitingService;
import com.tcc.backend_TCC.model.Usuario;
import com.tcc.backend_TCC.security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private RateLimitingService rateLimitingService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, 
                                                      HttpServletRequest request) {
        System.out.println("[AuthController] Requisição de login recebida. IP: " + getClientIp(request));
        System.out.println("[AuthController] Body recebido: " + body);
        
        String login = body.get("login");
        String senha = body.get("senha");
        
        System.out.println("[AuthController] Login extraído: " + login);
        
        if (login == null || senha == null) {
            System.out.println("[AuthController] ERRO: login ou senha nulos!");
            return ResponseEntity.badRequest().body(Map.of("error", "Login e senha são obrigatórios"));
        }
        
        try {
            String token = authService.login(login, senha);
            
            // Login bem-sucedido! Reseta o rate limiting pra não punir usuário legítimo
            String clientIp = getClientIp(request);
            rateLimitingService.resetLoginAttempts(clientIp, login);
            
            System.out.println("[AuthController] Login bem-sucedido para: " + login);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (Exception e) {
            System.out.println("[AuthController] Login falhou para: " + login + " - " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Login ou senha incorretos"));
        }
    }

    @PostMapping("/registrar")
    public ResponseEntity<Usuario> registrar(@RequestBody Map<String, String> body) {
        String login = body.get("login");
        String senha = body.get("senha");
        String role = body.get("role");

        if (login == null || login.isBlank() || senha == null || senha.isBlank() || role == null || role.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Usuario usuario = authService.registrar(login, senha, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }
    
    /**
     * Extrai o IP real do cliente (mesma lógica do RateLimitingFilter)
     */
    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}