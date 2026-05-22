package com.tcc.backend_TCC;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BackendTccApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendTccApplication.class, args);
	}
}
