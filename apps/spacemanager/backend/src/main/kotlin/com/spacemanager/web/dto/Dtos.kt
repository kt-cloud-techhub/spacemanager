package com.spacemanager.web.dto

import com.fasterxml.jackson.annotation.JsonProperty

data class OrganizationDto(
    val id: Long? = null,
    val name: String,
    val level: Int,
    val parentId: Long? = null,
    val isExecutiveUnit: Boolean = false
)

data class OrganizationTreeDto(
    val id: Long,
    val name: String,
    val level: Int,
    val isExecutiveUnit: Boolean,
    val memberCount: Long,
    val children: List<OrganizationTreeDto> = emptyList()
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
    val layoutData: String? = null
)

data class SeatDto(
    val id: Long,
    val seatNumber: String,
    @get:JsonProperty("xPos") val xPos: Double,
    @get:JsonProperty("yPos") val yPos: Double,
    val sectionName: String? = null,
    val isExecutiveSeat: Boolean,
    val status: String,
    val occupantName: String? = null,
    val teamName: String? = null,
    val teamColor: String? = null
)

data class SpaceAssignmentDto(
    val id: Long? = null,
    val floorId: Int,
    val orgId: Long,
    val orgName: String,
    val areaPolygon: String, // format: "x1,y1;x2,y2;..."
    val color: String
)

data class SimulationRequestDto(
    val weights: Map<String, Double>,
    val floorIds: List<Int>
)
