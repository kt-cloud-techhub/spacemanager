package com.spacemanager.domain.repository

import com.spacemanager.domain.model.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.stereotype.Repository

@Repository
interface OrganizationRepository : JpaRepository<Organization, Long> {
    fun findByParentId(parentId: Long): List<Organization>
    fun findByName(name: String): Organization?
}

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun countByOrganizationIdIn(orgIds: List<Long>): Long
}

@Repository
interface FloorRepository : JpaRepository<Floor, Int> {
    fun findByName(name: String): Floor?
}

@Repository
interface SeatRepository : JpaRepository<Seat, Long> {
    fun findByFloorId(floorId: Int): List<Seat>
    fun findByFloorIdIn(floorIds: List<Int>): List<Seat>
}

@Repository
interface SpaceAssignmentRepository : JpaRepository<SpaceAssignment, Long>

@Repository
interface SeatReservationRepository : JpaRepository<SeatReservation, Long> {
    fun findBySeatFloorId(floorId: Int): List<SeatReservation>
    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM SeatReservation r WHERE r.user.id = :userId")
    fun deleteByUserId(@org.springframework.data.repository.query.Param("userId") userId: Long)

    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM SeatReservation r WHERE r.seat.id = :seatId")
    fun deleteBySeatId(@org.springframework.data.repository.query.Param("seatId") seatId: Long)
}
