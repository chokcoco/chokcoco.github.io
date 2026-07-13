package studio.aicourse.javaweb.jvm;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.util.ArrayList;
import java.util.List;

public final class JvmRuntimeProbe {
    private JvmRuntimeProbe() {
    }

    public static Snapshot captureAfterAllocation(int objectCount) {
        List<byte[]> retained = new ArrayList<>();
        for (int i = 0; i < objectCount; i++) {
            retained.add(new byte[1024]);
        }

        MemoryMXBean memory = ManagementFactory.getMemoryMXBean();
        MemoryUsage heap = memory.getHeapMemoryUsage();
        return new Snapshot(heap.getUsed(), heap.getCommitted(), retained.size());
    }

    public record Snapshot(long usedBytes, long committedBytes, int retainedObjects) {
    }
}
