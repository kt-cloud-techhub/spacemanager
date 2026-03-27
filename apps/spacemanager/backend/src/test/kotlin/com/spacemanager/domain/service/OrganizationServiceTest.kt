package com.spacemanager.domain.service

import com.spacemanager.domain.model.Organization
import com.spacemanager.domain.repository.OrganizationRepository
import com.spacemanager.domain.repository.UserRepository
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class OrganizationServiceTest {

    private val orgRepository = mockk<OrganizationRepository>()
    private val userRepository = mockk<UserRepository>()
    private val orgService = OrganizationService(orgRepository, userRepository)

    @Test
    fun `getMemberCount should return sum of members in self and descendants`() {
        // Given: Organization Hierarchy (Division -> Team A, Team B)
        val divisionId = 1L
        val teamAId = 2L
        val teamBId = 3L

        val division = Organization(id = divisionId, name = "Division", level = 1)
        val teamA = Organization(id = teamAId, name = "Team A", level = 2, parent = division)
        val teamB = Organization(id = teamBId, name = "Team B", level = 2, parent = division)

        every { orgRepository.findByParentId(divisionId) } returns listOf(teamA, teamB)
        every { orgRepository.findByParentId(teamAId) } returns emptyList()
        every { orgRepository.findByParentId(teamBId) } returns emptyList()

        // Mock count for [1, 2, 3] (Use any() or match for list contents)
        every { userRepository.countByOrganizationIdIn(any()) } returns 15L

        // When
        val count = orgService.getMemberCount(divisionId)

        // Then
        assertEquals(15L, count)
    }
}
