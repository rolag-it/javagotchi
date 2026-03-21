package org.javagotchi;

import java.time.Duration;
import java.time.Instant;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class Creature {

    private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

    private final Random fortune = new Random();

    private final String name;
    private final Instant birthInstant;

    private final AtomicInteger health;

    private final AtomicInteger meals;

    public static Creature newBorn(String name) {
        Creature creature = new Creature(name);
        creature.executor.scheduleAtFixedRate(creature::degrade, 2, 20, TimeUnit.MINUTES);
        return creature;
    }

    private Creature(String name) {
        this.name = name;
        this.health = new AtomicInteger(fortune.nextInt(64, 128));
        this.meals = new AtomicInteger(0);
        this.birthInstant = Instant.now();
    }

    public String getName() {
        return name;
    }

    public int getHealth() {
        return health.get();
    }

    public boolean isHungry() {
        return meals.get() < 3;
    }

    public boolean isAlive() {
        return health.get() > 0;
    }

    public long getAge() {
        return Duration.between(birthInstant, Instant.now()).getSeconds();
    }

    public void feed() {
        if (!isAlive()) {
            throw new IllegalStateException("%s is no more among us".formatted(name));
        }
        if (!isHungry()) {
            throw new IllegalStateException("%s is sated and does not want to eat".formatted(name));
            
        }
        int food = fortune.nextInt(8, 32);
        health.addAndGet(food);
        meals.incrementAndGet();
    }

    private void degrade() {
        int damage = fortune.nextInt(-32, -8);
        meals.set(0);

        if (health.addAndGet(damage) < 0) {
            executor.shutdownNow();
        }

    }

    @Override
    public int hashCode() {
        return name.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof Creature && ((Creature) obj).name.equals(this.name);
    }

}