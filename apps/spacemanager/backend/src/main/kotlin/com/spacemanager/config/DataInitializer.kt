package com.spacemanager.config

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.spacemanager.domain.model.*
import com.spacemanager.domain.repository.*
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.transaction.annotation.Transactional
import org.slf4j.LoggerFactory
import java.io.InputStream

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
        logger.info("Initializing SpaceManager V18.20. TOTAL DATA RESTORATION (23 Teams & Full 7F Map)...")
        
        try {
            // --- Clean State (Total Restoration) ---
            seatReservationRepository.deleteAll()
            spaceAssignmentRepository.deleteAll()

            // 1. Floors & UI Layouts
            val floor4 = floorRepository.findByName("4F") ?: floorRepository.save(Floor(name = "4F", mapImageUrl = "/src/assets/floor_4f.png"))
            val layout7 = """
                [
                    {"id": "pr08", "name": "프로젝트룸 08", "x": 244, "y": 75, "w": 57, "h": 86, "type": "workzone"},
                    {"id": "pr04", "name": "프로젝트룸 04", "x": 244, "y": 161, "w": 57, "h": 131, "type": "workzone"},
                    {"id": "pr05", "name": "프로젝트룸 05", "x": 244, "y": 292, "w": 57, "h": 158, "type": "workzone"},
                    {"id": "wh01", "name": "창고", "x": 244, "y": 450, "w": 57, "h": 40, "type": "utility"},
                    {"id": "op01", "name": "OPEN", "x": 244, "y": 490, "w": 57, "h": 120, "type": "lounge"},
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
                    {"id": "st", "name": "계단실", "x": 625, "y": 440, "w": 45, "h": 160, "type": "utility"}
                ]
            """.trimIndent()
            
            val floor7 = floorRepository.findByName("7F")?.let { it.layoutData = layout7; floorRepository.save(it) } 
                ?: floorRepository.save(Floor(name = "7F", mapImageUrl = "/src/assets/floor_7f.png", layoutData = layout7))
            
            val floor15 = floorRepository.findByName("15F") ?: floorRepository.save(Floor(name = "15F", mapImageUrl = "/src/assets/floor_15f.png"))

            // 2. DATA BACKUP RESTORATION (from organizations and users backup)
            val backupFile = ClassPathResource("data_backup.json")
            if (backupFile.exists()) {
                logger.info(">>> [V18.23] Restoring Organization and User data from data_backup.json...")
                val mapper = jacksonObjectMapper()
                val inputStream: InputStream = backupFile.inputStream
                val backupData: BackupData = mapper.readValue(inputStream)

                val orgMap = mutableMapOf<Long, Organization>()

                // 2a. Organizations Seeding (Ordered by Level)
                backupData.organizations.sortedBy { it.level }.forEach { orgInfo ->
                    val parent = orgInfo.parent_id?.let { orgMap[it] }
                    val org = orgRepository.findByName(orgInfo.name)
                        ?: orgRepository.save(Organization(
                            name = orgInfo.name, 
                            level = orgInfo.level, 
                            parent = parent, 
                            memberCount = orgInfo.member_count ?: 0
                        ))
                    orgMap[orgInfo.id] = org
                }

                // 2b. Users Seeding
                backupData.users.forEach { userInfo ->
                    if (!userRepository.findByName(userInfo.name).isPresent) {
                        val org = userInfo.org_id?.let { orgMap[it] }
                        userRepository.save(User(
                            employeeId = userInfo.employee_id ?: "EMP_${userInfo.name.hashCode()}",
                            name = userInfo.name,
                            role = userInfo.role,
                            organization = org
                        ))
                    }
                }
                logger.info("+++ [V18.23] Data restoration complete: ${orgMap.size} organizations and ${backupData.users.size} users processed +++")

                // 2c. Space Assignments Restoration
                if (backupData.assignments.isNotEmpty()) {
                    logger.info(">>> [V18.25] Restoring Space Assignments (Area Polygons)...")
                    backupData.assignments.forEach { asgInfo ->
                        val floor = floorRepository.findByName(asgInfo.floor_name)
                        val org = orgRepository.findByName(asgInfo.org_name)
                        if (floor != null && org != null) {
                            spaceAssignmentRepository.save(SpaceAssignment(
                                floor = floor,
                                organization = org,
                                areaPolygon = asgInfo.area_polygon
                            ))
                        }
                    }
                    logger.info("+++ [V18.25] ${backupData.assignments.size} assignments restored +++")
                }

                // 2d. Seat Reservations Restoration
                if (backupData.reservations.isNotEmpty()) {
                    logger.info(">>> [V18.25] Restoring Seat Reservations (Member Placements)...")
                    backupData.reservations.forEach { resInfo ->
                        val seat = seatRepository.findBySeatNumber(resInfo.seat_number)
                        val user = resInfo.employee_id?.let { userRepository.findByEmployeeId(it).orElse(null) }
                            ?: userRepository.findByName(resInfo.user_name ?: "").orElse(null)
                        
                        if (seat != null && user != null) {
                            seatReservationRepository.save(SeatReservation(
                                user = user,
                                seat = seat,
                                teamName = resInfo.team_name,
                                teamColor = resInfo.team_color
                            ))
                        }
                    }
                    logger.info("+++ [V18.25] ${backupData.reservations.size} reservations restored +++")
                }
            } else {
                logger.warn("!!! data_backup.json not found. Skipping organization restoration !!!")
            }

            // 3. PRECISION 7F SEETING AUDIT (100% Visibility)
            fun auditAndSeed(floor: Floor, filePath: String, floorPrefix: String) {
                try {
                    val file = java.io.File(filePath)
                    if (!file.exists()) return

                    logger.info(">>> [V18.20] Precision Seeding for Floor ${floor.name}")
                    val allLines = file.readLines().filter { it.contains("|") && !it.contains("---") }
                    val dataRows = if (allLines.getOrNull(0)?.contains("seat") == true) allLines else allLines.drop(1)

                    val existing = seatRepository.findByFloorId(floor.id!!); if (existing.isNotEmpty()) seatRepository.deleteAll(existing)

                    var seatTotal = 0
                    val merges = mutableSetOf<String>()

                    dataRows.forEachIndexed { rIdx, line ->
                        val cells = line.trim().removePrefix("|").removeSuffix("|").split("|").map { it.trim() }
                        // Skip row index (1, 2, 3...)
                        val cleanCells = if (cells.getOrNull(0)?.replace("*", "")?.all { it.isDigit() } == true && cells.size > 15) cells.drop(1) else cells

                        cleanCells.forEachIndexed { cIdx, content ->
                            val colName = if (cIdx < 26) ('A'.toInt() + cIdx).toChar().toString() else "A" + ('A'.toInt() + (cIdx - 26)).toChar().toString()
                            val seatNum = "$floorPrefix.${colName}${rIdx+1}"
                            val clean = content.replace("*", "").lowercase()

                            val isExec = clean.contains("임원") && clean.contains("seat")
                            val isSeat = (clean == "seat" || clean.contains("seat")) && !isExec
                            val mKey = Regex("\\(병합(\\d+)\\)").find(clean)?.groupValues?.get(1) ?: ""

                            if (isExec) {
                                val uKey = "${floor.id}-$mKey"
                                if (mKey.isEmpty() || !merges.contains(uKey)) {
                                    seatRepository.save(Seat(floor=floor, seatNumber=seatNum, sectionName="${floor.name}_EXEC", xPos=(cIdx*34+60).toDouble(), yPos=(rIdx*42+60).toDouble(), isExecutiveSeat=true))
                                    if (mKey.isNotEmpty()) merges.add(uKey); seatTotal++
                                }
                            } else if (isSeat) {
                                seatRepository.save(Seat(floor=floor, seatNumber=seatNum, sectionName="${floor.name}_OPEN", xPos=(cIdx*34+60).toDouble(), yPos=(rIdx*42+60).toDouble(), isExecutiveSeat=false))
                                seatTotal++
                            }
                        }
                    }
                    logger.info("+++ [V18.20] Successfully restored Floor ${floor.name}: $seatTotal seats created +++")
                } catch (e: Exception) {
                    logger.error("Seeding audit failed for ${floor.name}: ${e.message}")
                }
            }

            val paths = listOf("../../frontend/src/assets", "apps/spacemanager/frontend/src/assets", "/Users/study/spacemanager-anti/apps/spacemanager/frontend/src/assets")
            fun findFile(name: String): String? = paths.map { java.io.File(it, name) }.firstOrNull { it.exists() }?.absolutePath

            findFile("4f.md")?.let { auditAndSeed(floor4, it, "4") }
            findFile("7f.md")?.let { auditAndSeed(floor7, it, "7") }
            findFile("15층.md")?.let { auditAndSeed(floor15, it, "15") }

            logger.info("TOTAL RESTORATION V18.20 COMPLETE.")
        } catch (e: Exception) {
            logger.error("V18.20 Restoration Failed!", e)
        }
    }
}

data class BackupData(
    val organizations: List<OrgBackup>,
    val users: List<UserBackup>,
    val assignments: List<AssignmentBackup> = emptyList(),
    val reservations: List<ReservationBackup> = emptyList()
)
data class OrgBackup(
    val id: Long,
    val name: String,
    val level: Int,
    val parent_id: Long?,
    val member_count: Int?
)
data class UserBackup(
    val id: Long,
    val employee_id: String?,
    val name: String,
    val role: String,
    val org_id: Long?
)
data class AssignmentBackup(
    val floor_name: String,
    val org_name: String,
    val area_polygon: String?
)
data class ReservationBackup(
    val seat_number: String,
    val user_name: String?,
    val employee_id: String?,
    val team_name: String?,
    val team_color: String?
)
