package com.spacemanager.domain.logic

import com.spacemanager.domain.model.Organization
import com.spacemanager.domain.model.Seat
import com.spacemanager.domain.model.User
import com.spacemanager.web.dto.SimulationRequestDto
import kotlin.math.sqrt
import kotlin.math.pow

data class Point(val x: Double, val y: Double)

class SimulationEngine(
    private val request: SimulationRequestDto
) {
    fun optimize(
        users: List<User>,
        seats: List<Seat>,
        currentAssignments: Map<Long, Long> = emptyMap()
    ): Map<Long, Long> {
        val result = mutableMapOf<Long, Long>()
        val availableSeats = seats.toMutableList()

        // 1. Assign Executives to Executive Seats
        val executives = users.filter { it.role == "Executive" }
        executives.forEach { exec ->
            val bestSeat = availableSeats.find { it.isExecutiveSeat } ?: availableSeats.firstOrNull()
            if (bestSeat != null) {
                result[exec.id!!] = bestSeat.id!!
                availableSeats.remove(bestSeat)
            }
        }

        // 2. Greedy assignment for others based on remaining available seats
        val others = users.filter { it.role != "Executive" }
        others.forEach { user ->
            val seat = availableSeats.firstOrNull()
            if (seat != null) {
                result[user.id!!] = seat.id!!
                availableSeats.remove(seat)
            }
        }
        
        return result
    }

    private fun distance(p1: Point, p2: Point): Double {
        return sqrt((p1.x - p2.x).pow(2) + (p1.y - p2.y).pow(2))
    }
}
