package com.spacemanager.web.controller

import com.spacemanager.domain.model.SeatReservation
import com.spacemanager.domain.model.SpaceAssignment
import com.spacemanager.domain.repository.*
import com.spacemanager.web.dto.SpaceAssignmentDto
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = ["http://localhost:5173", "http://localhost:5174"])
class AssignmentController(
    private val assignmentRepository: SpaceAssignmentRepository,
    private val floorRepository: FloorRepository,
    private val orgRepository: OrganizationRepository,
    private val seatRepository: SeatRepository,
    private val userRepository: UserRepository,
    private val reservationRepository: SeatReservationRepository
) {

    @GetMapping("/floors/{floorId}/assignments")
    fun getAssignments(@PathVariable floorId: Int): List<SpaceAssignmentDto> {
        // Since SpaceAssignmentRepository doesn't have custom methods yet, 
        // we'll filter here or add to repository later.
        return assignmentRepository.findAll()
            .filter { it.floor.id == floorId }
            .map { it.toDto(it.organization.id) }
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

        // --- Auto Assign Members ---
        autoAssignMembers(request, floor, org)

        return assignment.toDto(org.id)
    }

    private fun autoAssignMembers(request: AssignmentSaveRequest, floor: com.spacemanager.domain.model.Floor, org: com.spacemanager.domain.model.Organization) {
        try {
            // 1. Parse Polygon
            val points = request.areaPolygon.split(" ")
                .map { it.split(",") }
                .filter { it.size == 2 }
                .map { Pair(it[0].toDouble(), it[1].toDouble()) }
            
            if (points.size < 3) return

            // 2. Find Seats in Polygon
            val allSeats = seatRepository.findByFloorId(request.floorId)
            
            // Add a small buffer (5px) to be more permissive for seats on the boundary
            val buffer = 5.0
            val targetedSeats = allSeats.filter { seat ->
                val sx = seat.xPos ?: 0.0
                val sy = seat.yPos ?: 0.0
                
                // Check center and 4 corners with buffer
                isPointInPolygon(sx, sy, points) ||
                isPointInPolygon(sx - buffer, sy - buffer, points) ||
                isPointInPolygon(sx + buffer, sy - buffer, points) ||
                isPointInPolygon(sx - buffer, sy + buffer, points) ||
                isPointInPolygon(sx + buffer, sy + buffer, points)
            }
            
            if (targetedSeats.isEmpty()) return

            // 3. Find Users in Organization
            val orgUsers = userRepository.findAll().filter { it.organization?.id == org.id }
            
            // 4. Clear existing reservations for these seats and users
            targetedSeats.forEach { seat ->
                reservationRepository.findAll().find { it.seat.id == seat.id }?.let { reservationRepository.delete(it) }
            }
            orgUsers.forEach { user ->
                reservationRepository.findAll().find { it.user.id == user.id }?.let { reservationRepository.delete(it) }
            }

            // 5. Assign Users to Seats
            val teamColor = getTeamColor(org.id!!, org.level)
            val zipCount = minOf(targetedSeats.size, orgUsers.size)
            
            for (i in 0 until zipCount) {
                reservationRepository.save(SeatReservation(
                    user = orgUsers[i],
                    seat = targetedSeats[i],
                    teamName = org.name,
                    teamColor = teamColor
                ))
            }
        } catch (e: Exception) {
            // Log and continue (don't fail the whole request)
            println("Auto-assignment failed: ${e.message}")
        }
    }

    private fun isPointInPolygon(px: Double, py: Double, polygon: List<Pair<Double, Double>>): Boolean {
        var inside = false
        var j = polygon.size - 1
        for (i in polygon.indices) {
            if ((polygon[i].second > py) != (polygon[j].second > py) &&
                px < (polygon[j].first - polygon[i].first) * (py - polygon[i].second) / (polygon[j].second - polygon[i].second) + polygon[i].first
            ) {
                inside = !inside
            }
            j = i
        }
        return inside
    }

    private val teamPalette = listOf(
        "#6366F1", // Indigo
        "#10B981", // Emerald
        "#F59E0B", // Amber
        "#F43F5E", // Rose
        "#8B5CF6", // Violet
        "#06B6D4", // Cyan
        "#FB923C", // Orange
        "#14B8A6", // Teal
        "#EC4899", // Pink
        "#84CC16"  // Lime
    )

    private fun getTeamColor(orgId: Long, orgLevel: Int): String {
        return when (orgLevel) {
            0 -> "#6366F1" // HQ
            else -> teamPalette[(orgId % teamPalette.size).toInt()]
        }
    }
}

data class AssignmentSaveRequest(
    val floorId: Int,
    val orgId: Long,
    val areaPolygon: String
)

fun SpaceAssignment.toDto(orgIdFromRequest: Long? = null) = SpaceAssignmentDto(
    id = id,
    floorId = floor.id!!,
    orgId = organization.id!!,
    orgName = organization.name,
    areaPolygon = areaPolygon ?: "",
    color = when(organization.level) {
        0 -> "#6366F1" // HQ
        else -> {
            // Colors from the same palette for consistency
            val palette = listOf("#6366F1", "#10B981", "#F59E0B", "#F43F5E", "#8B5CF6", "#06B6D4", "#FB923C", "#14B8A6", "#EC4899", "#84CC16")
            palette[((orgIdFromRequest ?: organization.id!!).toInt() % palette.size)]
        }
    }
)
