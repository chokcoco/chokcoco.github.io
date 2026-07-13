package studio.aicourse.javaweb.basics;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ReferenceSemanticsTest {
    @Test
    void methodReceivesACopyOfTheReferenceValue() {
        ReferenceSemantics.OrderDraft draft = new ReferenceSemantics.OrderDraft("old");

        ReferenceSemantics.rename(draft, "new");
        assertThat(draft.getCustomerName()).isEqualTo("new");

        ReferenceSemantics.replace(draft);
        assertThat(draft.getCustomerName()).isEqualTo("new");
    }
}
