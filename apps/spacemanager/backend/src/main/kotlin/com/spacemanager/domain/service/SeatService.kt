package com.spacemanager.domain.service

import com.spacemanager.domain.model.Seat
import com.spacemanager.domain.model.SeatReservation
import com.spacemanager.domain.model.User
import com.spacemanager.domain.repository.OrganizationRepository
import com.spacemanager.domain.repository.SeatRepository
import com.spacemanager.domain.repository.SeatReservationRepository
import com.spacemanager.domain.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.slf4j.LoggerFactory

import com.spacemanager.web.dto.SeatDto

@Service
class SeatService(
    private val seatRepository: SeatRepository,
    private val reservationRepository: SeatReservationRepository,
    private val userRepository: UserRepository,
    private val orgRepository: OrganizationRepository
) {
    private val logger = LoggerFactory.getLogger(SeatService::class.java)

    @Transactional(readOnly = true)
    fun getSeatsByFloor(floorId: Int): List<SeatDto> {
        val seats = seatRepository.findByFloorId(floorId)
        val reservations = reservationRepository.findBySeatFloorId(floorId)
        val reservationMap = reservations.associateBy { it.seat.id }

        return seats.map { seat ->
            val reservation = reservationMap[seat.id]
            SeatDto(
                id = seat.id!!,
                seatNumber = seat.seatNumber,
                xPos = seat.xPos,
                yPos = seat.yPos,
                sectionName = seat.sectionName,
                isExecutiveSeat = seat.isExecutiveSeat,
                status = if (reservation != null) "occupied" else "available",
                occupantName = reservation?.user?.name,
                teamName = reservation?.teamName,
                teamColor = reservation?.teamColor
            )
        }
    }
    
    // ... rest of methods

    @Transactional
    fun reserveSeat(userId: Long, seatId: Long): SeatReservation {
        val user = userRepository.findById(userId).orElseThrow { RuntimeException("User not found") }
        val seat = seatRepository.findById(seatId).orElseThrow { RuntimeException("Seat not found") }
        
        // 기존 예약 삭제 (1인 1좌석 가정)
        reservationRepository.deleteByUserId(userId)
        
        val reservation = SeatReservation(user = user, seat = seat)
        return reservationRepository.save(reservation)
    }

    @Transactional
    fun bulkAssignSeats(teams: List<String>, teamColors: List<String>, memberNames: List<String>, seatIds: List<Long>) {
        // Validation
        if (memberNames.size != seatIds.size) {
            throw IllegalArgumentException("Mismatch between member count (${memberNames.size}) and seat count (${seatIds.size})")
        }

        memberNames.forEachIndexed { index, name ->
            val seatId = seatIds[index]
            val teamName = if (index < teams.size) teams[index] else teams.last()
            val teamColor = if (index < teamColors.size) teamColors[index] else teamColors.last()
            
            // 1. Find or Create User
            val user = userRepository.findByName(name).orElseGet {
                val demoOrg = orgRepository.findAll().firstOrNull() ?: throw RuntimeException("No organization found to assign new user")
                userRepository.save(User(
                    employeeId = "EMP_${Math.abs(name.hashCode())}",
                    name = name,
                    role = "Member",
                    organization = demoOrg
                ))
            }

            // 2. Find Seat
            val seat = seatRepository.findById(seatId).orElseThrow { RuntimeException("Seat $seatId not found") }
            
            // Guard: Don't assign regular members to executive seats
            if (seat.isExecutiveSeat) {
                logger.warn("Skipping assignment to executive seat: ${seat.seatNumber}")
                return@forEachIndexed
            }

            // 3. Clear existing reservation
            reservationRepository.deleteByUserId(user.id!!)
            reservationRepository.deleteBySeatId(seat.id!!)

            // 4. Create new reservation with team info
            reservationRepository.save(SeatReservation(
                user = user, 
                seat = seat,
                teamName = teamName,
                teamColor = teamColor
            ))
        }
    }

    @Transactional
    fun moveSeat(fromSeatId: Long, toSeatId: Long) {
        val fromReservation = reservationRepository.findBySeatId(fromSeatId)
            .orElseThrow { RuntimeException("No reservation found at seat $fromSeatId") }
        
        val toSeat = seatRepository.findById(toSeatId)
            .orElseThrow { RuntimeException("Target seat $toSeatId not found") }

        // Clear target seat if occupied
        reservationRepository.deleteBySeatId(toSeatId)

        // Update reservation to new seat
        fromReservation.seat = toSeat
        reservationRepository.save(fromReservation)
    }

    @Transactional
    fun clearFloorReservations(floorId: Int) {
        reservationRepository.deleteBySeatFloorId(floorId)
    }

    @Transactional
    fun cancelReservation(seatId: Long) {
        reservationRepository.deleteBySeatId(seatId)
    }
}
