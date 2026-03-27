package com.spacemanager.domain.service

import com.spacemanager.domain.logic.SimulationEngine
import com.spacemanager.domain.repository.FloorRepository
import com.spacemanager.domain.repository.OrganizationRepository
import com.spacemanager.domain.repository.SeatRepository
import com.spacemanager.web.dto.SimulationRequestDto
import org.springframework.stereotype.Service

@Service
class SeatingOptimizationService(
    private val orgRepository: OrganizationRepository,
    private val floorRepository: FloorRepository,
    private val seatRepository: SeatRepository
) {
    fun runSimulation(request: SimulationRequestDto): Map<Long, Long> {
        val engine = SimulationEngine(request)
        // Fetch all necessary data
        // Run engine
        return emptyMap()
    }
}
