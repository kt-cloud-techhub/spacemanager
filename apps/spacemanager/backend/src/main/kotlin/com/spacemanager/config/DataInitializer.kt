package com.spacemanager.config

import com.spacemanager.domain.model.*
import com.spacemanager.domain.repository.*
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.transaction.annotation.Transactional
import org.slf4j.LoggerFactory

@Configuration
class DataInitializer(
    private val floorRepository: FloorRepository,
    private val seatRepository: SeatRepository,
    private val orgRepository: OrganizationRepository,
    private val userRepository: UserRepository,
    private val spaceAssignmentRepository: SpaceAssignmentRepository
) {
    private val logger = LoggerFactory.getLogger(DataInitializer::class.java)

    @Bean
    @Transactional
    fun initData() = CommandLineRunner {
        logger.info("Initializing SpaceManager data for floors 4F, 7F, 15F and Team Areas...")
        
        try {
            // 1. Floors
            val floor4 = floorRepository.findByName("4F") ?: floorRepository.save(Floor(name = "4F", mapImageUrl = "/src/assets/floor_4f.png"))
            
            val layout7 = """
                [
                    {"id": "pr08", "name": "프로젝트룸 08", "x": 244, "y": 75, "w": 57, "h": 86, "type": "workzone"},
                    {"id": "pr04", "name": "프로젝트룸 04", "x": 244, "y": 161, "w": 57, "h": 131, "type": "workzone"},
                    {"id": "pr05", "name": "프로젝트룸 05", "x": 244, "y": 292, "w": 57, "h": 158, "type": "workzone"},
                    {"id": "wh01", "name": "창고", "x": 244, "y": 450, "w": 57, "h": 40, "type": "utility"},
                    {"id": "op01", "name": "OPEN", "x": 244, "y": 490, "w": 57, "h": 120, "type": "lounge"},
                    
                    {"id": "pr06", "name": "프로젝트룸 06", "x": 315, "y": 135, "w": 55, "h": 120, "type": "workzone"},
                    {"id": "pr07", "name": "프로젝트룸 07", "x": 315, "y": 290, "w": 55, "h": 150, "type": "workzone"},
                    
                    {"id": "mr01", "name": "7.01 회의실", "x": 301, "y": 40, "w": 64, "h": 91, "type": "room"},
                    {"id": "mr02", "name": "7.02 회의실", "x": 365, "y": 40, "w": 84, "h": 91, "type": "room"},
                    {"id": "mr03", "name": "7.03 회의실", "x": 377, "y": 131, "w": 72, "h": 94, "type": "room"},
                    {"id": "mr04", "name": "7.04 회의실", "x": 377, "y": 225, "w": 72, "h": 95, "type": "room"},
                    
                    {"id": "pr01", "name": "프로젝트룸 01", "x": 483, "y": 38, "w": 102, "h": 93, "type": "workzone"},
                    {"id": "pr02", "name": "프로젝트룸 02", "x": 483, "y": 140, "w": 102, "h": 100, "type": "workzone"},
                    {"id": "pr03", "name": "프로젝트룸 03", "x": 483, "y": 248, "w": 102, "h": 120, "type": "workzone"},
                    
                    {"id": "wc_m", "name": "남자화장실", "x": 310, "y": 495, "w": 65, "h": 115, "type": "utility"},
                    {"id": "wc_f", "name": "여자화장실", "x": 310, "y": 440, "w": 65, "h": 50, "type": "utility"},
                    {"id": "ev_h", "name": "고층 E/V", "x": 470, "y": 435, "w": 40, "h": 170, "type": "utility"},
                    {"id": "ev_l", "name": "저층 E/V", "x": 553, "y": 435, "w": 40, "h": 170, "type": "utility"},
                    {"id": "ev_c", "name": "화물 E/V", "x": 595, "y": 435, "w": 35, "h": 85, "type": "utility"},
                    {"id": "st", "name": "계단실", "x": 625, "y": 440, "w": 45, "h": 160, "type": "utility"},
                    {"id": "cor", "name": "Main Corridor", "x": 240, "y": 620, "w": 1000, "h": 30, "type": "corridor"}
                ]
            """.trimIndent()
            
            val floor7 = floorRepository.findByName("7F")?.let {
                it.layoutData = layout7
                floorRepository.save(it)
            } ?: floorRepository.save(Floor(
                name = "7F", 
                mapImageUrl = "/src/assets/floor_7f.png",
                layoutData = layout7
            ))
            
            val floor15 = floorRepository.findByName("15F") ?: floorRepository.save(Floor(name = "15F", mapImageUrl = "/src/assets/floor_15f.png"))

            // 2. Organizations & Users (Shared)
            val cloudBiz = orgRepository.findByName("Cloud사업담당") ?: orgRepository.save(Organization(name = "Cloud사업담당", level = 1))
            val cloudTeam = orgRepository.findByName("클라우드사업팀") ?: orgRepository.save(Organization(name = "클라우드사업팀", level = 2, parent = cloudBiz))
            
            // 2.1 Team Areas (SpaceAssignments)
            if (spaceAssignmentRepository.count() == 0L) {
                spaceAssignmentRepository.save(SpaceAssignment(
                    floor = floor4, 
                    organization = cloudTeam, 
                    areaPolygon = "80,120;250,120;250,200;80,200"
                ))
            }
            if (userRepository.count() == 0L) {
                userRepository.save(User(employeeId = "EMP001", name = "홍팀장", role = "Manager", organization = cloudTeam))
                userRepository.save(User(employeeId = "EMP101", name = "김매니저", role = "Member", organization = cloudTeam))
                userRepository.save(User(employeeId = "EMP201", name = "이대리", role = "Member", organization = cloudTeam))
            }

            // 3. Seats for 4F
            if (seatRepository.findByFloorId(floor4.id!!).isEmpty()) {
                val seats = mutableListOf<Seat>()
                for (i in 1..4) for (j in 1..2) {
                    seats.add(Seat(
                        floor = floor4, 
                        seatNumber = "4.A${i}${j}", 
                        xPos = (50 + i * 40).toDouble(), 
                        yPos = (130 + j * 30).toDouble(), 
                        isExecutiveSeat = false
                    ))
                }
                seats.add(Seat(floor = floor4, seatNumber = "4.EXEC1", xPos = 250.0, yPos = 80.0, isExecutiveSeat = true))
                seatRepository.saveAll(seats)
            }

            // 4. Seats for 7F (Precision Grid V3: 118 General + 4 Executive)
            val existingSeats7 = seatRepository.findByFloorId(floor7.id!!)
            if (existingSeats7.size != 122) { // Target 122
                if (existingSeats7.isNotEmpty()) seatRepository.deleteAll(existingSeats7)
                
                val seats = mutableListOf<Seat>()
                val execSeatInfo = mapOf(
                    1 to "Cloud고객담당",
                    9 to "운영담당",
                    15 to "플랫폼담당",
                    20 to "기술본부장실"
                )
                
                for (col in 1..20) {
                    val isExecCol = execSeatInfo.containsKey(col)
                    val execName = execSeatInfo[col]
                    
                    // Column Constraints (Rows 1-8)
                    // Pillars: 5, 8, 11, 14, 17 (1 row missing)
                    // Pillar+Exec impact: 16 (Rows 1-3 only)
                    // Exec Office (no pillar): 2, 10, 19 (Rows 1-4 only)
                    
                    val maxRow = when (col) {
                        1, 9, 15, 20 -> 4 // Row 4 is Exec seat
                        16 -> 3            // Pillar at Row 4, Exec office below
                        2, 10, 19 -> 4   // Exec office below Row 4
                        else -> 8
                    }
                    
                    val pillarRow = when (col) {
                        5, 8, 11, 14, 17 -> 2 // Pillar example at Row 2
                        else -> -1
                    }

                    for (row in 1..maxRow) {
                        if (row == pillarRow) continue // Skip pillar

                        val isExecSeat = (isExecCol && row == 4)
                        val seatNum = if (isExecSeat) execName!! else "7.${col}.${row}"
                        val section = if (isExecSeat) "임원실" else if (col <= 10) "워크존 상단" else "워크존 하단"
                        
                        seats.add(Seat(
                            floor = floor7,
                            seatNumber = seatNum,
                            sectionName = section,
                            xPos = (100 + col * 40).toDouble(), // Grid layout coordinates
                            yPos = (100 + row * 40).toDouble(),
                            isExecutiveSeat = isExecSeat
                        ))
                    }
                }
                
                seatRepository.saveAll(seats)
            }

            // 5. Seats for 15F
            if (seatRepository.findByFloorId(floor15.id!!).isEmpty()) {
                val seats = mutableListOf<Seat>()
                for (i in 1..3) for (j in 1..3) {
                    seats.add(Seat(
                        floor = floor15, 
                        seatNumber = "15.E${i}${j}", 
                        xPos = (150 + i * 50).toDouble(), 
                        yPos = (300 + j * 40).toDouble(), 
                        isExecutiveSeat = false
                    ))
                }
                seats.add(Seat(floor = floor15, seatNumber = "15.DIR1", xPos = 400.0, yPos = 100.0, isExecutiveSeat = true))
                seatRepository.saveAll(seats)
            }
            
            logger.info("Data initialization completed successfully.")
        } catch (e: Exception) {
            logger.error("Data initialization failed!", e)
        }
    }
}
