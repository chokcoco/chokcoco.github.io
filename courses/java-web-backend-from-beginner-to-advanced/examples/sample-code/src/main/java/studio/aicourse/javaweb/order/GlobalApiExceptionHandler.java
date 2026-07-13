package studio.aicourse.javaweb.order;

import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class GlobalApiExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ApiError handleInvalidBody(MethodArgumentNotValidException exception) {
        List<ApiError.FieldViolation> violations = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> new ApiError.FieldViolation(error.getField(), error.getDefaultMessage()))
                .toList();

        return new ApiError(
                "VALIDATION_FAILED",
                "请求参数不符合接口约定",
                violations,
                traceId(),
                Instant.now()
        );
    }

    @ExceptionHandler(OrderConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    ApiError handleConflict(OrderConflictException exception) {
        return new ApiError(
                "ORDER_CONFLICT",
                exception.getMessage(),
                List.of(),
                traceId(),
                Instant.now()
        );
    }

    private String traceId() {
        String value = MDC.get("traceId");
        return value == null ? "not-assigned" : value;
    }
}
