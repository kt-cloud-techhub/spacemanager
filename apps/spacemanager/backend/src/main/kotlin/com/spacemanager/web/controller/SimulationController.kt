package com.spacemanager.web.controller

import com.spacemanager.domain.service.SeatingOptimizationService
import com.spacemanager.web.dto.SimulationRequestDto
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/simulation")
@CrossOrigin(origins = ["http://localhost:5173", "http://localhost:5174"])
class SimulationController(
    private val optimizationService: SeatingOptimizationService
) {

    @PostMapping("/recommend")
    fun recommend(@RequestBody request: SimulationRequestDto): Map<Long, Long> {
        return optimizationService.runSimulation(request)
    }

    @PostMapping("/apply")
    fun apply(@RequestBody assignments: Map<Long, Long>) {
        optimizationService.applySimulation(assignments)
    }
}
