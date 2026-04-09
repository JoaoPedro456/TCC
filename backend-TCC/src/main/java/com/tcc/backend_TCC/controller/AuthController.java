package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.Usuario;
import com.tcc.backend_TCC.security.AuthService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> body) {
        String token = authService.login(body.get("login"), body.get("senha"));
        return ResponseEntity.ok(Map.of("token", token));
    }

    /**
     * Cria novo usuário (apenas ADMIN pode acessar este endpoint)
     * POST /api/auth/registrar
     * Body: { "login": "...", "senha": "...", "role": "ADMIN|OPERADOR" }
     */
    @PostMapping("/registrar")
    public ResponseEntity<Usuario> registrar(
            @RequestBody Map<String, String> body) {
        String login = body.get("login");
        String senha = body.get("senha");
        String role = body.get("role");

        // Validação manual dos campos obrigatórios
        if (login == null || login.isBlank()) {
            throw new IllegalArgumentException("Login é obrigatório");
        }
        if (senha == null || senha.isBlank()) {
            throw new IllegalArgumentException("Senha é obrigatória");
        }
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("Role é obrigatória");
        }

        Usuario usuario = authService.registrar(login, senha, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }
}