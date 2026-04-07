package com.tcc.backend_TCC.controller;

import com.tcc.backend_TCC.model.Usuario;
import com.tcc.backend_TCC.security.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> body) {
        String token = authService.login(body.get("login"), body.get("senha"));
        return Map.of("token", token);
    }

    @PostMapping("/registrar")
    public Usuario registrar(@RequestBody Map<String, String> body) {
        return authService.registrar(
                body.get("login"),
                body.get("senha"),
                body.get("role")
        );
    }
}