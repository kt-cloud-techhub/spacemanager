package com.spacemanager.domain.model

import jakarta.persistence.*
import java.time.OffsetDateTime

@Entity
@Table(name = "organizations")
class Organization(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var level: Int,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    var parent: Organization? = null,

    @Column(name = "is_executive_unit")
    var isExecutiveUnit: Boolean = false,

    @Column(name = "created_at")
    val createdAt: OffsetDateTime = OffsetDateTime.now()
)

@Entity
@Table(name = "users")
class User(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var role: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id")
    var organization: Organization,

    @Column(unique = true)
    var email: String? = null,

    @Column(name = "created_at")
    val createdAt: OffsetDateTime = OffsetDateTime.now()
)

@Entity
@Table(name = "floors")
class Floor(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @Column(nullable = false)
    var name: String,

    @Column(name = "map_image_url")
    var mapImageUrl: String? = null,

    @Column(name = "layout_data", columnDefinition = "jsonb")
    var layoutData: String? = null,

    @Column(name = "created_at")
    val createdAt: OffsetDateTime = OffsetDateTime.now()
)

@Entity
@Table(name = "seats")
class Seat(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id")
    var floor: Floor,

    @Column(name = "seat_number", nullable = false)
    var seatNumber: String,

    @Column(name = "x_pos", nullable = false)
    var xPos: Double,

    @Column(name = "y_pos", nullable = false)
    var yPos: Double,

    @Column(name = "is_executive_seat")
    var isExecutiveSeat: Boolean = false
)

@Entity
@Table(name = "space_assignments")
class SpaceAssignment(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id")
    var floor: Floor,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id")
    var organization: Organization,

    @Column(name = "area_polygon")
    var areaPolygon: String? = null,

    @Column(name = "created_at")
    val createdAt: OffsetDateTime = OffsetDateTime.now()
)

@Entity
@Table(name = "seat_reservations")
class SeatReservation(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    var user: User,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id")
    var seat: Seat,

    @Column(name = "reserved_at")
    val reserved_at: OffsetDateTime = OffsetDateTime.now()
)
