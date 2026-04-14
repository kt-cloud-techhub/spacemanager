package com.spacemanager.web.controller

import com.spacemanager.domain.model.Seat
import com.spacemanager.domain.service.SeatService
import com.spacemanager.web.dto.SeatDto
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = ["http://localhost:5173", "http://localhost:5174"])
class SeatController(
    private val seatService: SeatService
) {

    @GetMapping("/floor/{floorId}")
    fun getByFloor(@PathVariable floorId: Int): List<SeatDto> {
        return seatService.getSeatsByFloor(floorId)
    }

    @PostMapping("/{seatId}/reserve")
    fun reserve(@PathVariable seatId: Long, @RequestParam userId: Long) {
        seatService.reserveSeat(userId, seatId)
    }

    @PostMapping("/bulk-assign")
    fun bulkAssign(@RequestBody request: BulkAssignRequest) {
        seatService.bulkAssignSeats(request.teams, request.teamColors, request.memberNames, request.seatIds)
    }

    @PostMapping("/move")
    fun moveSeat(@RequestBody request: MoveSeatRequest) {
        seatService.moveSeat(request.fromSeatId, request.toSeatId)
    }

    @DeleteMapping("/floor/{floorId}")
    fun clearFloor(@PathVariable floorId: Int) {
        seatService.clearFloorReservations(floorId)
    }

    @DeleteMapping("/reservations/seat/{seatId}")
    fun deleteReservation(@PathVariable seatId: Long) {
        seatService.cancelReservation(seatId)
    }
}

data class BulkAssignRequest(
    val teams: List<String>,
    val teamColors: List<String>,
    val memberNames: List<String>,
    val seatIds: List<Long>
)

data class MoveSeatRequest(
    val fromSeatId: Long,
    val toSeatId: Long
)
