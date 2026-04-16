FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# Copia os arquivos de configuração do Maven primeiro
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline

# Copia o código e compila
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Executa o JAR
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "target/*.jar"]