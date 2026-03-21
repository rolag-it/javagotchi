package org.javagotchi;

import static org.junit.jupiter.api.Assertions.*;



import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJson;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
@AutoConfigureJson
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class ControllerTests {

    private static final Logger logger = LoggerFactory.getLogger(ControllerTests.class);

    @Autowired
    private TestRestTemplate restTemplate;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void testCreateNewCreature() throws Exception {
        ResponseEntity<String> response = restTemplate.postForEntity("/javagotchi", null, String.class);
        
        logger.info("Create response: {}", response.getBody());
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        assertNotNull(response.getBody());        
        JsonNode jsonNode = objectMapper.readTree(response.getBody());
        assertNotNull(jsonNode.get("name"));
        assertTrue(jsonNode.get("age").asInt() >= 0);
        assertTrue(jsonNode.get("health").asInt() > 0);
    }

    @Test
    public void testCreateWhenCreatureAlreadyExists() throws Exception {
        // Create first creature
        ResponseEntity<String> response1 = restTemplate.postForEntity("/javagotchi", null, String.class);
        assertEquals(HttpStatus.OK, response1.getStatusCode());

        // Try to create another - should fail
        ResponseEntity<String> response2 = restTemplate.postForEntity("/javagotchi", null, String.class);
        assertEquals(HttpStatus.BAD_REQUEST, response2.getStatusCode());
        
        assertNotNull(response2.getBody());
        JsonNode jsonNode = objectMapper.readTree(response2.getBody());
        assertNotNull(jsonNode.get("message"));
    }

    @Test
    public void testVisitCreature() throws Exception {
        // Create a creature first
        ResponseEntity<String> createResponse = restTemplate.postForEntity("/javagotchi", null, String.class);
        assertEquals(HttpStatus.OK, createResponse.getStatusCode());

        // Visit it
        ResponseEntity<String> visitResponse = restTemplate.getForEntity("/javagotchi", String.class);
        assertEquals(HttpStatus.OK, visitResponse.getStatusCode());
        assertNotNull(visitResponse.getBody());
        
        JsonNode jsonNode = objectMapper.readTree(visitResponse.getBody());
        assertNotNull(jsonNode.get("name"));
        assertTrue(jsonNode.get("age").isNumber());
        assertTrue(jsonNode.get("health").isNumber());
    }

    @Test
    public void testVisitWithoutCreature() throws Exception {
        // Try to visit without creating a creature first
        ResponseEntity<String> response = restTemplate.getForEntity("/javagotchi", String.class);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        
        assertNotNull(response.getBody());
        JsonNode jsonNode = objectMapper.readTree(response.getBody());
        assertNotNull(jsonNode.get("message"));
    }

    @Test
    public void testFeedCreature() throws Exception {
        // Create a creature first
        ResponseEntity<String> createResponse = restTemplate.postForEntity("/javagotchi", null, String.class);
        assertEquals(HttpStatus.OK, createResponse.getStatusCode());

        // Feed it
        ResponseEntity<String> feedResponse = restTemplate.exchange("/javagotchi",
                                                       HttpMethod.PUT, 
                                                       null, 
                                                       String.class);
        assertEquals(HttpStatus.OK, feedResponse.getStatusCode());
        assertNotNull(feedResponse.getBody());
        
        JsonNode jsonNode = objectMapper.readTree(feedResponse.getBody());
        assertNotNull(jsonNode.get("name"));
        assertNotNull(jsonNode.get("health"));
    }

    @Test
    public void testFeedWithoutCreature() throws Exception {
        // Try to feed without creating a creature first
        ResponseEntity<String> response = restTemplate.exchange("/javagotchi",
                                                       HttpMethod.PUT, 
                                                       null, 
                                                       String.class);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        
        assertNotNull(response.getBody());
        JsonNode jsonNode = objectMapper.readTree(response.getBody());
        assertNotNull(jsonNode.get("message"));
    }

}
