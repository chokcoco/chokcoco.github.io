package course.commerce.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class InventoryServiceTest {
    @Test
    void repeatedIdempotencyKeyShouldNotReserveTwice() {
        var service = new InventoryService();
        var request = new InventoryService.ReserveRequest("checkout-781", "SKU-RED-CHAIR", 1);

        var first = service.reserve(request);
        var second = service.reserve(request);

        // 这条测试刻意暴露存量实现缺口，完成库存 Harness 后应通过。
        assertThat(second.id()).isEqualTo(first.id());
        assertThat(service.available("SKU-RED-CHAIR")).isEqualTo(1);
    }
}
