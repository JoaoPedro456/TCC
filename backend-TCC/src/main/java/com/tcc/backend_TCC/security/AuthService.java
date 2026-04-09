package com.tcc.backend_TCC.security;

import com.tcc.backend_TCC.model.Usuario;
import com.tcc.backend_TCC.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public String login(String login, String senha) {
        Usuario usuario = usuarioRepository.findByLogin(login)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (!passwordEncoder.matches(senha, usuario.getSenha())) {
            throw new RuntimeException("Senha incorreta");
        }

        // Passa a role do usuário para incluir no token
        return jwtService.gerarToken(login, usuario.getRole());
    }

    public Usuario registrar(String login, String senha, String role) {
        if (usuarioRepository.findByLogin(login).isPresent()) {
            throw new RuntimeException("Login já existe");
        }
        Usuario u = new Usuario();
        u.setLogin(login);
        u.setSenha(passwordEncoder.encode(senha));
        u.setRole(role != null ? role : "OPERADOR");
        return usuarioRepository.save(u);
    }
}