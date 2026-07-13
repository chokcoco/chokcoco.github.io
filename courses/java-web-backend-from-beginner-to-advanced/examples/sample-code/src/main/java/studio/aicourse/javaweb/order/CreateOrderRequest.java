package studio.aicourse.javaweb.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record CreateOrderRequest(
        @NotBlank(message = "客户编号不能为空") String customerId,
        @NotEmpty(message = "订单至少包含一个商品") List<@Valid OrderLineRequest> lines
) {
    public record OrderLineRequest(
            @NotBlank(message = "商品编号不能为空") String productId,
            @Positive(message = "数量必须大于 0") int quantity
    ) {
    }
}
