package studio.aicourse.javaweb.jvm;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JvmRuntimeProbeTest {
    @Test
    void reportsRetainedObjectsWithoutAssumingExactHeapSize() {
        JvmRuntimeProbe.Snapshot snapshot = JvmRuntimeProbe.captureAfterAllocation(128);

        assertThat(snapshot.retainedObjects()).isEqualTo(128);
        assertThat(snapshot.usedBytes()).isPositive();
        assertThat(snapshot.committedBytes()).isGreaterThanOrEqualTo(snapshot.usedBytes());
    }
}
