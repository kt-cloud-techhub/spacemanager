package com.spacemanager.web.controller

import com.spacemanager.domain.repository.FloorRepository
import com.spacemanager.domain.repository.SpaceAssignmentRepository
import com.spacemanager.web.dto.FloorDto
import com.spacemanager.web.dto.SpaceAssignmentDto
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/floors")
@CrossOrigin(origins = ["http://localhost:5173", "http://localhost:5174"])
class FloorController(
    private val floorRepository: FloorRepository,
    private val spaceAssignmentRepository: SpaceAssignmentRepository
) {

    @GetMapping
    fun getAll(): List<FloorDto> {
        return floorRepository.findAll().map {
            FloorDto(
                id = it.id,
                name = it.name,
                mapImageUrl = it.mapImageUrl,
                layoutData = it.layoutData
            )
        }
    }
}
