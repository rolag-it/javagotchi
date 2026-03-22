# Javagotchi

A digital creature to care for — built with Spring Boot and vanilla HTML/CSS/JS.

Javagotchi is a web application where a small creature lives on a server and slowly degrades over time. Feed it before its health runs out, or watch it perish.

---

## About this project

**Goals**
- Have fun with programming
- Serve as an educational reference for Java, Spring Boot, and web application basics
- Demonstrate effective human–AI collaboration: the UI was developed with the help of [Claude](https://claude.ai)

**Stack**
- Java 25
- Spring Boot 4
- Vanilla HTML / CSS / JS — no build step, no frameworks

---

## How it works

A `Creature` is born with a random health value between 64 and 128. Every 20 minutes its health degrades by a random amount and its meal counter resets to zero, making it hungry again. Feed it up to 3 times per cycle to restore health. If health reaches zero, the creature dies and cannot be revived — only a new one can be created.

The REST API is intentionally minimal:

| Method | Path          | Description                          |
|--------|---------------|--------------------------------------|
| `POST` | `/javagotchi` | Create a new creature (one at a time) |
| `GET`  | `/javagotchi` | Visit the current creature            |
| `PUT`  | `/javagotchi` | Feed the creature                     |

---

## Quickstart

**Prerequisites**
- JDK 25+
- Apache Maven 3.9+

**Run**

```bash
git clone https://github.com/rolag-it/javagotchi.git
cd javagotchi
mvn spring-boot:run
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

---

## Project structure

```
src/
├── main/
│   ├── java/org/javagotchi/
│   │   ├── Application.java     # Spring Boot entry point
│   │   ├── Controller.java      # REST endpoints
│   │   └── Creature.java        # Game logic and lifecycle
│   └── resources/
│       ├── application.properties
│       └── static/              # Frontend (served by Spring Boot)
│           ├── index.html
│           ├── styles/
│           │   └── main.css
│           └── scripts/
│               ├── app.js       # Game state, API calls, UI
│               └── sprites.js   # Sprite rendering (isolated context)
└── test/
    └── java/org/javagotchi/
        ├── ApplicationTests.java
        └── ControllerTests.java
```

---

## License

GNU General Public License v2.0 — see [LICENSE](LICENSE).
