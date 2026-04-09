package com.tcc.backend_TCC.config;

import com.tcc.backend_TCC.model.Usuario;
import com.tcc.backend_TCC.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Inicializa dados básicos do sistema na primeira execução.
 * Cria um usuário ADMIN padrão se não houver nenhum usuário cadastrado.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Se não há nenhum usuário, cria o admin padrão
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setLogin("admin");
            admin.setSenha(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            usuarioRepository.save(admin);

            System.out.println("============================================");
            System.out.println("✅  USUÁRIO ADMIN CRIADO AUTOMATICAMENTE!");
            System.out.println("   Login: admin");
            System.out.println("   Senha: admin123");
            System.out.println("   ⚠️  ALTERE A SENHA APÓS O PRIMEIRO ACESSO!");
            System.out.println("============================================");
        }
    }
}
