# Greenfield instructions

Read `docs/architecture.md` and the active task in `specs/` before generating code.

- Use React 19.2 with Vite 8.1 for browser applications.
- Use Java 21 with Spring Boot 4.1 and Maven for the service.
- Keep money as integer cents and timestamps as UTC instants.
- Keep the first version runnable without Docker or cloud services.
- Add one acceptance test before each state transition implementation.
- Stop for approval before adding infrastructure, external services, authentication, or payment credentials.
