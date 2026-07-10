package course.commerce.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/reservations")
    InventoryService.Reservation reserve(@RequestBody InventoryService.ReserveRequest request) {
        return inventoryService.reserve(request);
    }

    @GetMapping("/{sku}/available")
    int available(@PathVariable String sku) {
        return inventoryService.available(sku);
    }
}
