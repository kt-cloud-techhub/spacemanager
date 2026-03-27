package com.spacemanager.domain.logic

import com.spacemanager.domain.model.User
import com.spacemanager.domain.model.Organization
import com.spacemanager.domain.model.Seat
import com.spacemanager.domain.model.Floor
import com.spacemanager.web.dto.SimulationRequestDto
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Assertions.assertEquals

class SimulationEngineTest {

    @Test
    fun `engine should assign executives to executive seats`() {
        val request = SimulationRequestDto(
            weights = mapOf("proximity" to 0.7, "stability" to 0.3),
            floorIds = listOf(1)
        )
        val engine = SimulationEngine(request)
        
        val org = Organization(id = 1, name = "HQ", level = 0)
        val exec = User(id = 10, name = "CEO", role = "Executive", organization = org)
        val floor = Floor(id = 1, name = "1F")
        val execSeat = Seat(id = 100, floor = floor, seatNumber = "E01", xPos = 0.0, yPos = 0.0, isExecutiveSeat = true)
        val normalSeat = Seat(id = 101, floor = floor, seatNumber = "N01", xPos = 1.0, yPos = 1.0, isExecutiveSeat = false)

        val result = engine.optimize(listOf(exec), listOf(execSeat, normalSeat))
        
        assertEquals(100L, result[10L])
    }
}
