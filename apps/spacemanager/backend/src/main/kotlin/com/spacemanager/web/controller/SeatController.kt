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
}
