# Estágio 1: Compilar o Java com Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -Dmaven.test.skip=true

# Estágio 2: Rodar a aplicação com usuário não-root (princípio do menor privilégio)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN addgroup --system --gid 10001 spring && adduser --system --uid 10001 --ingroup spring spring
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar
USER spring:spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]