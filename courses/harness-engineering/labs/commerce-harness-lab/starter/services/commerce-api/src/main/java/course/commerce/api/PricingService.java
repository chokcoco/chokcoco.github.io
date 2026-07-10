package course.commerce.api;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PricingService {

    public Quote quote(QuoteRequest request) {
        long subtotal = request.lines().stream()
            .mapToLong(line -> line.unitPrice() * line.quantity())
            .sum();
        long memberDiscount = request.member()
            ? request.lines().stream()
                .filter(line -> !line.saleItem())
                .mapToLong(line -> line.unitPrice() * line.quantity() / 10)
                .sum()
            : 0;
        long afterProductDiscount = subtotal - memberDiscount;
        long orderDiscount = "ORDER50".equals(request.coupon()) && afterProductDiscount >= 50_000 ? 5_000 : 0;
        long shippingDiscount = request.freeShipping() ? request.shippingFee() : 0;
        long payable = Math.max(0, afterProductDiscount - orderDiscount + request.shippingFee() - shippingDiscount);
        return new Quote(subtotal, memberDiscount, orderDiscount, shippingDiscount, payable);
    }

    public record Line(String sku, long unitPrice, int quantity, boolean saleItem) {}
    public record QuoteRequest(boolean member, String coupon, long shippingFee, boolean freeShipping, List<Line> lines) {}
    public record Quote(long subtotal, long memberDiscount, long orderDiscount, long shippingDiscount, long payable) {}
}
