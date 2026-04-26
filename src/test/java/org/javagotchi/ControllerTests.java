package org.javagotchi;

import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.web.servlet.client.RestTestClient;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
public class ControllerTests {

    private static final Logger logger = LoggerFactory.getLogger(ControllerTests.class);

    @Autowired
    private RestTestClient restClient;
      
    @Test
    public void testGame() throws Exception {
        
        // Try to visit without creating a creature first
        restClient.get().uri("/javagotchi").exchange()
                  .expectStatus().isNotFound()
                  .expectBody().jsonPath("$.message").exists();
        
        // Try to feed without creating a creature first
        restClient.put().uri("/javagotchi").exchange()
                  .expectStatus().isNotFound()
                  .expectBody().jsonPath("$.message").exists();

        // Create first creature
        restClient.post().uri("/javagotchi").exchange()
                  .expectStatus().isOk()
                  .expectBody().jsonPath("$.name").exists()
                  .jsonPath("$.age").isNumber()
                  .jsonPath("$.health").isNumber();
       
        // Try to create another - should fail
        restClient.post().uri("/javagotchi").exchange()
                  .expectStatus().isBadRequest()
                  .expectBody().jsonPath("$.message").exists();
        
        // Visit the creature
        restClient.get().uri("/javagotchi").exchange()
                  .expectStatus().isOk()
                  .expectBody().jsonPath("$.name").exists()
                  .jsonPath("$.age").isNumber()
                  .jsonPath("$.health").isNumber();
        
        // Feed the creature
        restClient.put().uri("/javagotchi").exchange()
                  .expectStatus().isOk()
                  .expectBody().jsonPath("$.name").exists()
                  .jsonPath("$.health").isNumber();

    }

}