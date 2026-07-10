package course.commerce.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class PricingServiceTest {
    private final PricingService service = new PricingService();

    @Test
    void returnsBreakdownInCents() {
        var request = new PricingService.QuoteRequest(
            true, "ORDER50", 1_200, true,
            List.of(new PricingService.Line("SKU-RED-CHAIR", 39_900, 2, false))
        );

        var quote = service.quote(request);

        assertThat(quote.subtotal()).isEqualTo(79_800);
        assertThat(quote.payable()).isEqualTo(66_820);
    }
}
