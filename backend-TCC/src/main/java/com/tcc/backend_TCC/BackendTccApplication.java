package com.tcc.backend_TCC;

import com.tcc.backend_TCC.model.Usuario;
import com.tcc.backend_TCC.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class BackendTccApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendTccApplication.class, args);
	}

    @Bean
    CommandLineRunner initDatabase(UsuarioRepository repository, PasswordEncoder encoder) {
        return args -> {
            if (repository.findByLogin("admin").isEmpty()) {
                Usuario admin = new Usuario();
                admin.setLogin("admin");
                admin.setSenha(encoder.encode("admin123"));
                admin.setRole("ADMIN");
                repository.save(admin);
                System.out.println("✅ USUÁRIO ADMIN CRIADO!");
            }
        };
    }
}
