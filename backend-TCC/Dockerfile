# Estágio de Build
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY . .
# Usamos 'mvn' direto em vez do './mvnw' para evitar problemas de permissão/wrapper
RUN mvn clean package -DskipTests

# Estágio de Execução
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]