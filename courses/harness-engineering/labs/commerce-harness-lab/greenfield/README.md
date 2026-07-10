# Greenfield path

This directory is the starting blueprint for a new agent-first commerce repository. It does not copy the starter repository. Begin with the task contract, architecture boundary, commands, and acceptance cases before adding application code.

Recommended order:

1. Confirm `specs/inventory-reservation.md`.
2. Keep the first implementation in one Spring Boot service with an in-memory teaching repository.
3. Add a small React operations page only after the state contract is stable.
4. Add durable infrastructure when a measured failure requires it; do not begin with queues, Redis, Kubernetes, or multiple services.
