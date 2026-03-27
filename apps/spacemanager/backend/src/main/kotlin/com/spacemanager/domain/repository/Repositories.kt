package com.spacemanager.domain.repository

import com.spacemanager.domain.model.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface OrganizationRepository : JpaRepository<Organization, Long> {
    fun findByParentId(parentId: Long): List<Organization>
}

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun countByOrganizationIdIn(orgIds: List<Long>): Long
}

@Repository
interface FloorRepository : JpaRepository<Floor, Int>

@Repository
interface SeatRepository : JpaRepository<Seat, Long>

@Repository
interface SpaceAssignmentRepository : JpaRepository<SpaceAssignment, Long>

@Repository
interface SeatReservationRepository : JpaRepository<SeatReservation, Long>
