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

    @GetMapping("/{floorId}/assignments")
    fun getAssignments(@PathVariable floorId: Int): List<SpaceAssignmentDto> {
        return spaceAssignmentRepository.findAll().filter { it.floor.id == floorId }.map {
            SpaceAssignmentDto(
                id = it.id,
                floorId = it.floor.id!!,
                orgId = it.organization.id!!,
                orgName = it.organization.name,
                areaPolygon = it.areaPolygon ?: "",
                color = when(it.organization.name) {
                    "클라우드사업팀" -> "#6366F1" // Indigo
                    "플랫폼개발팀" -> "#10B981" // Emerald
                    else -> "#94A3B8"
                }
            )
        }
    }
}
