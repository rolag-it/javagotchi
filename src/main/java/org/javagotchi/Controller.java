package org.javagotchi;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/javagochi")
public class Controller {
    
    private final ConcurrentHashMap<String, Creature> farm = new ConcurrentHashMap<>();

    private final Set<String> names = Set.of(
        "Fluffy", "Sparky", "Buddy", "Mittens", "Charlie",
        "Max", "Luna", "Rocky", "Bella", "Daisy", "Bort"
    );

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)    
    public Creature create() {

        farm.entrySet().removeIf(entry -> !entry.getValue().isAlive());

        if (farm.isEmpty()) {
            var nameList = new java.util.ArrayList<>(names);
            Collections.shuffle(nameList);
            var name = nameList.stream().findFirst().orElseThrow();
            var creature = Creature.newBorn(name);
            farm.put(name, creature);
            return creature;
        } else {
           var creature = visit(); 
           throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "You already have %s. Please take care of it.".formatted(creature.getName()));
        }
    }

    @PutMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Creature feed() {
        var creature = visit();        
        creature.feed();
        return creature;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Creature visit() {
        var creature = farm.entrySet()
                           .stream()
                           .findFirst()
                           .orElseThrow(() -> new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "No creature found. Please create one first."));
        if (creature.getValue() == null || !creature.getValue().isAlive()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.GONE, "%s is no more among us".formatted(creature.getKey()));
        }
        return creature.getValue();
    }

}