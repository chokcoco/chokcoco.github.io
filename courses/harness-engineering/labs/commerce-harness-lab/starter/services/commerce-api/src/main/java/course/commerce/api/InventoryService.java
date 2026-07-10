package course.commerce.api;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class InventoryService {
    private final Map<String, Integer> available = new ConcurrentHashMap<>(Map.of("SKU-RED-CHAIR", 2));
    private final Map<String, Reservation> reservations = new ConcurrentHashMap<>();
    private final Clock clock;

    public InventoryService() {
        this(Clock.systemUTC());
    }

    InventoryService(Clock clock) {
        this.clock = clock;
    }

    public synchronized Reservation reserve(ReserveRequest request) {
        int current = available.getOrDefault(request.sku(), 0);
        if (current < request.quantity()) throw new IllegalStateException("INSUFFICIENT_STOCK");

        // 历史缺陷：没有按 idempotencyKey 查询旧结果，也没有检查同键异义。
        available.put(request.sku(), current - request.quantity());
        Reservation reservation = new Reservation(
            UUID.randomUUID().toString(), request.idempotencyKey(), request.sku(), request.quantity(),
            Status.RESERVED, Instant.now(clock).plus(15, ChronoUnit.MINUTES)
        );
        reservations.put(reservation.id(), reservation);
        return reservation;
    }

    public int available(String sku) {
        return available.getOrDefault(sku, 0);
    }

    public record ReserveRequest(String idempotencyKey, String sku, int quantity) {}
    public record Reservation(String id, String idempotencyKey, String sku, int quantity, Status status, Instant expiresAt) {}
    public enum Status { RESERVED, CLAIMED, RELEASED }
}
