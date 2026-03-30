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
    private val seatRepository: SeatRepository,
    private val userRepository: com.spacemanager.domain.repository.UserRepository,
    private val reservationRepository: com.spacemanager.domain.repository.SeatReservationRepository
) {
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    fun runSimulation(request: SimulationRequestDto): Map<Long, Long> {
        val users = userRepository.findAll()
        val allSeats = if (request.floorIds.isEmpty()) {
            seatRepository.findAll()
        } else {
            seatRepository.findByFloorIdIn(request.floorIds)
        }
        val currentReservations = reservationRepository.findAll().associate { it.user.id!! to it.seat.id!! }
        
        val engine = SimulationEngine(request)
        return engine.optimize(users, allSeats, currentReservations)
    }

    @org.springframework.transaction.annotation.Transactional
    fun applySimulation(assignments: Map<Long, Long>) {
        assignments.forEach { (userId, seatId) ->
            val user = userRepository.findById(userId).orElse(null)
            val seat = seatRepository.findById(seatId).orElse(null)
            
            if (user != null && seat != null) {
                // Delete existing reservation for user
                reservationRepository.deleteByUserId(userId)
                // Delete existing reservation for seat (to be safe)
                reservationRepository.deleteBySeatId(seatId)
                
                // Create new
                val reservation = com.spacemanager.domain.model.SeatReservation(
                    user = user,
                    seat = seat
                )
                reservationRepository.save(reservation)
            }
        }
    }
}
