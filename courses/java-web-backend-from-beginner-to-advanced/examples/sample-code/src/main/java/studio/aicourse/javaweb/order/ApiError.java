package studio.aicourse.javaweb.order;

import java.time.Instant;
import java.util.List;

public record ApiError(
        String code,
        String message,
        List<FieldViolation> violations,
        String traceId,
        Instant timestamp
) {
    public record FieldViolation(String field, String message) {
    }
}
