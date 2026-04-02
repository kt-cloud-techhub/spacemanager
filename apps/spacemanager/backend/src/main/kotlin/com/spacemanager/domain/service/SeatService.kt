package com.spacemanager.domain.service

import com.spacemanager.domain.model.Seat
import com.spacemanager.domain.model.SeatReservation
import com.spacemanager.domain.model.User
import com.spacemanager.domain.repository.SeatRepository
import com.spacemanager.domain.repository.SeatReservationRepository
import com.spacemanager.domain.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

import com.spacemanager.web.dto.SeatDto

@Service
class SeatService(
    private val seatRepository: SeatRepository,
    private val reservationRepository: SeatReservationRepository,
    private val userRepository: UserRepository
) {

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
                teamName = null, // To be implemented with SpaceAssignment
                teamColor = null
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
}
