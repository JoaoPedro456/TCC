package com.tcc.backend_TCC.config;

import com.tcc.backend_TCC.model.Usuario;
import com.tcc.backend_TCC.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${admin.default-password:#{null}}")
    private String defaultAdminPassword;

    @Override
    public void run(String... args) {
        // Renomeia o usuário "admin" antigo para "Andressa" automaticamente para facilitar pro cliente
        usuarioRepository.findByLogin("admin").ifPresent(usuario -> {
            usuario.setLogin("Andressa");
            usuarioRepository.save(usuario);
            log.info("Login atualizado de 'admin' para 'Andressa' com sucesso!");
        });

        if (usuarioRepository.count() == 0) {
            String senha = defaultAdminPassword;
            if (senha == null || senha.trim().isEmpty()) {
                senha = java.util.UUID.randomUUID().toString().substring(0, 8);
                log.warn("Nenhuma senha padrao fornecida via variavel de ambiente.");
                log.warn("Senha gerada aleatoriamente para o primeiro acesso: " + senha);
            }
            
            Usuario admin = new Usuario();
            admin.setLogin("Andressa");
            admin.setSenha(passwordEncoder.encode(senha));
            admin.setRole("ADMIN");
            usuarioRepository.save(admin);
        }
    }
}
