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
    private val spaceAssignmentRepository: SpaceAssignmentRepository,
    private val seatReservationRepository: SeatReservationRepository
) {
    private val logger = LoggerFactory.getLogger(DataInitializer::class.java)

    @Bean
    @Transactional
    fun initData() = CommandLineRunner {
        logger.info("Initializing SpaceManager for clean start. Org Tree and Seats only (V18.17)...")
        
        try {
            // --- Reset State ---
            seatReservationRepository.deleteAll()

            // 1. Floors & Layouts
            val floor4 = floorRepository.findByName("4F") ?: floorRepository.save(Floor(name = "4F", mapImageUrl = "/src/assets/floor_4f.png"))
            val layout7 = """
                [
                    {"id": "pr08", "name": "프로젝트룸 08", "x": 244, "y": 75, "w": 57, "h": 86, "type": "workzone"},
                    {"id": "pr04", "name": "프로젝트룸 04", "x": 244, "y": 161, "w": 57, "h": 131, "type": "workzone"},
                    {"id": "pr05", "name": "프로젝트룸 05", "x": 244, "y": 292, "w": 57, "h": 158, "type": "workzone"},
                    {"id": "wh01", "name": "창고", "x": 244, "y": 450, "w": 57, "h": 40, "type": "utility"},
                    {"id": "op01", "name": "OPEN", "x": 244, "y": 490, "w": 57, "h": 120, "type": "lounge"},
                    {"id": "mr01", "name": "7.01 회의실", "x": 301, "y": 40, "w": 64, "h": 91, "type": "room"},
                    {"id": "mr02", "name": "7.02 회의실", "x": 365, "y": 40, "w": 84, "h": 91, "type": "room"}
                ]
            """.trimIndent()
            
            val floor7 = floorRepository.findByName("7F")?.apply { layoutData = layout7; floorRepository.save(this) }
                ?: floorRepository.save(Floor(name = "7F", mapImageUrl = "/src/assets/floor_7f.png", layoutData = layout7))
            
            val floor15 = floorRepository.findByName("15F") ?: floorRepository.save(Floor(name = "15F", mapImageUrl = "/src/assets/floor_15f.png"))

            // 2. Organization Tree (23 Teams Ready)
            val techHQ = orgRepository.findByName("기술본부") ?: orgRepository.save(Organization(name = "기술본부", level = 0, memberCount = 1))
            val platformDir = orgRepository.findByName("플랫폼담당") ?: orgRepository.save(Organization(name = "플랫폼담당", level = 1, parent = techHQ, memberCount = 1))
            val opDir = orgRepository.findByName("운영담당") ?: orgRepository.save(Organization(name = "운영담당", level = 1, parent = techHQ, memberCount = 1))
            val secDir = orgRepository.findByName("정보보호담당") ?: orgRepository.save(Organization(name = "정보보호담당", level = 1, parent = techHQ, memberCount = 1))
            
            val teams = listOf(
                Triple("기술전략팀", 7, platformDir), Triple("Core플랫폼팀", 9, platformDir), 
                Triple("Foundation플랫폼팀", 19, platformDir), Triple("Data플랫폼팀", 8, platformDir),
                Triple("InfraOps개발팀", 7, platformDir), Triple("IT전략팀", 11, platformDir), Triple("IT서비스팀", 9, platformDir),
                Triple("Cloud통합관제팀", 10, opDir), Triple("Cloud SW운영팀", 14, opDir), Triple("Cloud인프라운영팀", 14, opDir),
                Triple("Cloud서비스운영팀", 8, opDir), Triple("NW기술팀", 8, opDir), Triple("DC NW", 14, opDir), Triple("CloudNW", 10, opDir),
                Triple("정보보호팀", 8, secDir), Triple("보안인증진단팀", 7, secDir), Triple("침해분석대응팀", 5, secDir), Triple("보안아키텍처팀", 5, secDir)
            )

            teams.forEach { (name, count, parent) ->
                val org = orgRepository.findByName(name) ?: orgRepository.save(Organization(name = name, level = 2, parent = parent, memberCount = count))
                for (i in 1..count) {
                    val mName = if (i == 1) "${name}_팀장" else "${name}_$i"
                    if (!userRepository.findByName(mName).isPresent) {
                        userRepository.save(User(employeeId = "EMP_${name.hashCode()}_$i", name = mName, role = if (i == 1) "Leader" else "Member", organization = org))
                    }
                }
            }

            // 3. Seat Seeding (Markdown Source)
            fun seedSeats(floor: Floor, filePath: String, floorPrefix: String) {
                val file = java.io.File(filePath)
                if (!file.exists()) return
                
                val existing = seatRepository.findByFloorId(floor.id!!); if (existing.isNotEmpty()) seatRepository.deleteAll(existing)

                val dataRows = file.readLines().filter { it.contains("|") && !it.contains("---") }.drop(1)
                dataRows.forEachIndexed { rIdx, line ->
                    val cells = line.trim().removePrefix("|").removeSuffix("|").split("|").map { it.trim().lowercase() }
                    cells.forEachIndexed { cIdx, content ->
                        if (content.contains("seat")) {
                            seatRepository.save(Seat(
                                floor = floor, seatNumber = "$floorPrefix.${('A'.toInt() + cIdx).toChar()}${rIdx + 1}",
                                sectionName = "${floor.name}_ZONE", xPos = (cIdx * 40 + 40).toDouble(), yPos = (rIdx * 40 + 40).toDouble(),
                                isExecutiveSeat = content.contains("임원")
                            ))
                        }
                    }
                }
            }

            // Execute Seeding (Ready for next time)
            val assetPath = "apps/spacemanager/frontend/src/assets"
            seedSeats(floor4, "$assetPath/4f.md", "4")
            seedSeats(floor7, "$assetPath/7f.md", "7")
            seedSeats(floor15, "$assetPath/15층.md", "15")

            logger.info("Clean Seeding (V18.17) completed. 168 members ready in pool.")
        } catch (e: Exception) {
            logger.error("Seeding failed!", e)
        }
    }
}
