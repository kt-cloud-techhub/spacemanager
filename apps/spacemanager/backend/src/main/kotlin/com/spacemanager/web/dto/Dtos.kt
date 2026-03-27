package com.spacemanager.web.dto

data class OrganizationDto(
    val id: Long? = null,
    val name: String,
    val level: Int,
    val parentId: Long? = null,
    val isExecutiveUnit: Boolean = false
)

data class UserDto(
    val id: Long? = null,
    val name: String,
    val role: String,
    val orgId: Long
)

data class FloorDto(
    val id: Int? = null,
    val name: String,
    val mapImageUrl: String? = null,
    val layoutData: Map<String, Any>? = null
)

data class SeatDto(
    val id: Long? = null,
    val floorId: Int,
    val seatNumber: String,
    val xPos: Double,
    val yPos: Double,
    val isExecutiveSeat: Boolean = false
)

data class SpaceAssignmentDto(
    val id: Long? = null,
    val floorId: Int,
    val orgId: Long,
    val areaPolygon: String
)

data class SimulationRequestDto(
    val weights: Map<String, Double>,
    val floorIds: List<Int>
)
