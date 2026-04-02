package com.spacemanager.web.controller

import com.spacemanager.domain.model.SpaceAssignment
import com.spacemanager.domain.repository.FloorRepository
import com.spacemanager.domain.repository.OrganizationRepository
import com.spacemanager.domain.repository.SpaceAssignmentRepository
import com.spacemanager.web.dto.SpaceAssignmentDto
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = ["http://localhost:5173", "http://localhost:5174"])
class AssignmentController(
    private val assignmentRepository: SpaceAssignmentRepository,
    private val floorRepository: FloorRepository,
    private val orgRepository: OrganizationRepository
) {

    @GetMapping("/floors/{floorId}/assignments")
    fun getAssignments(@PathVariable floorId: Int): List<SpaceAssignmentDto> {
        // Since SpaceAssignmentRepository doesn't have custom methods yet, 
        // we'll filter here or add to repository later.
        return assignmentRepository.findAll()
            .filter { it.floor.id == floorId }
            .map { it.toDto() }
    }

    @PostMapping("/assignments")
    fun saveAssignment(@RequestBody request: AssignmentSaveRequest): SpaceAssignmentDto {
        val floor = floorRepository.findById(request.floorId).orElseThrow()
        val org = orgRepository.findById(request.orgId).orElseThrow()

        // Find existing or create new
        val existing = assignmentRepository.findAll().find { 
            it.floor.id == request.floorId && it.organization.id == request.orgId 
        }

        val assignment = if (existing != null) {
            existing.areaPolygon = request.areaPolygon
            assignmentRepository.save(existing)
        } else {
            assignmentRepository.save(SpaceAssignment(
                floor = floor,
                organization = org,
                areaPolygon = request.areaPolygon
            ))
        }

        return assignment.toDto()
    }
}

data class AssignmentSaveRequest(
    val floorId: Int,
    val orgId: Long,
    val areaPolygon: String
)

fun SpaceAssignment.toDto() = SpaceAssignmentDto(
    id = id,
    floorId = floor.id!!,
    orgId = organization.id!!,
    orgName = organization.name,
    areaPolygon = areaPolygon ?: "",
    color = when(organization.level) {
        0 -> "#6366F1" // Indigo
        1 -> "#3B82F6" // Blue
        2 -> "#10B981" // Emerald
        else -> "#94A3B8" // Slate
    }
)
