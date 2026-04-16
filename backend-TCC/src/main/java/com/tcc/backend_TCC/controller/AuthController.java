package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.Usuario;
import com.tcc.backend_TCC.security.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Libera para qualquer um chamar esse controller
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> body) {
        String token = authService.login(body.get("login"), body.get("senha"));
        return ResponseEntity.ok(Map.of("token", token));
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
}