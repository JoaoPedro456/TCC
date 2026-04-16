FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# Copia os arquivos de configuração do Maven
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# CORREÇÃO: Dá permissão de execução para o arquivo do Maven
RUN chmod +x mvnw

# Baixa as dependências
RUN ./mvnw dependency:go-offline

# Copia o código e compila
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Executa o JAR
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "target/*.jar"]