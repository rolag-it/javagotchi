FROM registry.access.redhat.com/ubi10/openjdk-25:1.24-2 as builder

# Build dependency offline to streamline build
RUN mkdir project
WORKDIR /home/jboss/project
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src src
RUN mvn package

FROM registry.access.redhat.com/ubi10/openjdk-25-runtime:1.24-2
COPY --from=builder /home/jboss/project/target/javagotchi.jar /deployments/export-run-artifact.jar
EXPOSE 8080
ENTRYPOINT ["/opt/jboss/container/java/run/run-java.sh", "--server.port=8080"]