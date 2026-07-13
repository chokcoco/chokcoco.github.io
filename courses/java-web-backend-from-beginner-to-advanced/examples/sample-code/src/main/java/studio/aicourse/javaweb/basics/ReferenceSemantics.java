package studio.aicourse.javaweb.basics;

import java.util.Objects;

public final class ReferenceSemantics {
    private ReferenceSemantics() {
    }

    public static void rename(OrderDraft draft, String newCustomerName) {
        draft.setCustomerName(newCustomerName);
    }

    public static void replace(OrderDraft draft) {
        // 这里只改变形参 draft 保存的引用值，不会改变调用方变量。
        draft = new OrderDraft("replacement");
    }

    public static final class OrderDraft {
        private String customerName;

        public OrderDraft(String customerName) {
            this.customerName = Objects.requireNonNull(customerName);
        }

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = Objects.requireNonNull(customerName);
        }
    }
}
