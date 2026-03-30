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
        currentAssignments: Map<Long, Long> = emptyMap() // UserId -> SeatId
    ): Map<Long, Long> {
        val result = mutableMapOf<Long, Long>()
        val availableSeats = seats.toMutableList()
        val proximityWeight = request.weights["proximity"] ?: 0.5
        val stabilityWeight = request.weights["stability"] ?: 0.5

        // 1. Group users by Organization (Team)
        val orgs = users.groupBy { it.organization?.id }

        // 2. Identify Executive Units (Seed for teams)
        val execUnits = users.filter { it.role == "Executive" }
        
        // 3. Priority Placement: Assign Executives to Executive Seats
        execUnits.forEach { exec ->
            val bestSeat = availableSeats.find { it.isExecutiveSeat } ?: availableSeats.minByOrNull { it.id!! }
            if (bestSeat != null) {
                result[exec.id!!] = bestSeat.id!!
                availableSeats.remove(bestSeat)
            }
        }

        // 4. Team-based Cluster Assignment
        // Sort teams by size or hierarchy level
        val teams = orgs.keys.filterNotNull().sortedBy { orgId -> users.find { it.organization?.id == orgId }?.organization?.level }
        
        teams.forEach { teamId ->
            val teamMembers = orgs[teamId]?.filter { it.role != "Executive" } ?: emptyList()
            if (teamMembers.isNotEmpty()) {
                // Find a "Seed" for this team (e.g. nearest to their parent)
                val seedSeat = availableSeats.firstOrNull() // Simplified seed
                
                if (seedSeat != null) {
                    teamMembers.forEach { member ->
                        // Try to find the nearest seat to the seed or current seat (stability)
                        val currentSeatId = currentAssignments[member.id]
                        val targetSeat = if (stabilityWeight > 0.8 && currentSeatId != null) {
                             availableSeats.find { it.id == currentSeatId } ?: findNearest(seedSeat, availableSeats)
                        } else {
                             findNearest(seedSeat, availableSeats)
                        }

                        if (targetSeat != null) {
                            result[member.id!!] = targetSeat.id!!
                            availableSeats.remove(targetSeat)
                        }
                    }
                }
            }
        }

        return result
    }

    private fun findNearest(seed: Seat, candidates: List<Seat>): Seat? {
        return candidates.minByOrNull { distance(Point(seed.xPos, seed.yPos), Point(it.xPos, it.yPos)) }
    }

    private fun distance(p1: Point, p2: Point): Double {
        return sqrt((p1.x - p2.x).pow(2) + (p1.y - p2.y).pow(2))
    }
}
