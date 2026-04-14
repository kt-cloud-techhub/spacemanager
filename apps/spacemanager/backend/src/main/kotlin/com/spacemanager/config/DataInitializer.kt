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
        logger.info("Initializing SpaceManager data for floors 4F, 7F, 15F and Team Areas...")
        
        try {
            // --- Global Initialization (V10.7.2) ---
            logger.info("Clearing existing reservations to ensure clean seeding...")
            seatReservationRepository.deleteAll()

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

            // 2. Organizations & Users (V18.1 Tech HQ Restructuring)
            val techHQ = orgRepository.findByName("기술본부") ?: orgRepository.save(Organization(name = "기술본부", level = 0, memberCount = 1))
            val platformDir = orgRepository.findByName("플랫폼담당") ?: orgRepository.save(Organization(name = "플랫폼담당", level = 1, parent = techHQ, memberCount = 1))
            val coe = orgRepository.findByName("CoE") ?: orgRepository.save(Organization(name = "CoE", level = 1, parent = techHQ, memberCount = 1))
            
            val teamsData = listOf(
                Triple("기술전략팀", 7, platformDir),
                Triple("Core플랫폼팀", 9, platformDir),
                Triple("Foundation플랫폼팀", 19, platformDir),
                Triple("Data플랫폼팀", 8, platformDir),
                Triple("InfraOps개발팀", 7, platformDir)
            )

            val teamOrgs = teamsData.associate { (name, count, parent) ->
                name to (orgRepository.findByName(name) ?: orgRepository.save(Organization(name = name, level = 2, parent = parent, memberCount = count)))
            }

            if (spaceAssignmentRepository.count() == 0L) {
                spaceAssignmentRepository.save(SpaceAssignment(floor = floor4, organization = teamOrgs["기술전략팀"]!!, areaPolygon = "80,120 250,120 250,200 80,200"))
            }

            // Create users for specific testing (V18.3: Main user is Shin Eun-jung)
            val usersToCreate = listOf("신은정", "홍길동", "김기술", "이플랫폼")
            usersToCreate.forEach { name ->
                userRepository.findByName(name).orElseGet {
                    userRepository.save(User(employeeId = "EMP_${Math.abs(name.hashCode())}", name = name, role = "Member", organization = teamOrgs["기술전략팀"]!!))
                }
            }

            // --- V10.2 Precision Seeding Engine (Enhanced Parsing) ---
            fun parseFloorAndSaveSeats(floor: Floor, filePath: String, floorPrefix: String) {
                try {
                    val file = java.io.File(filePath)
                    if (!file.exists()) {
                        logger.warn("!!! [V10.4] File NOT found at path: ${file.absolutePath}. Skipping seat seeding for ${floor.name}.")
                        return
                    }

                    logger.info("--- [V10.4] Starting Seeding for Floor ${floor.name} from ${file.name} ---")
                    val totalLines = file.readLines().filter { it.contains("|") }
                    if (totalLines.isEmpty()) {
                        logger.warn("!!! [V10.4] No table lines found in: $filePath")
                        return
                    }

                    // 데이터 행들만 추출 (구분선 '---' 제외)
                    val allPotentialDataRows = totalLines.filter { !it.contains("---") }
                    val headerLine = allPotentialDataRows.getOrNull(0) ?: ""
                    // 헤더에 데이터(seat, 병합)가 있으면 첫 줄부터 데이터로 간주
                    val isLine1Data = headerLine.contains("seat", ignoreCase = true) || headerLine.contains("병합")
                    
                    val dataRows = if (isLine1Data) allPotentialDataRows else allPotentialDataRows.drop(1)
                    logger.info("-> Detected ${dataRows.size} data rows (isLine1Data=$isLine1Data)")

                    val existingSeats = seatRepository.findByFloorId(floor.id!!)
                    if (existingSeats.isNotEmpty()) {
                        logger.info("Cleaning up ${existingSeats.size} existing seats and reservations for ${floor.name}")
                        // 삭제 순서: Reservations -> Seats (FK 무결성 보장)
                        existingSeats.forEach { seat ->
                            seatReservationRepository.deleteBySeatId(seat.id!!)
                        }
                        seatRepository.deleteAll(existingSeats)
                    }

                    var seatCount = 0
                    val processedMerges = mutableSetOf<String>()

                    fun getColLabel(index: Int): String {
                        var n = index
                        val sb = StringBuilder()
                        while (n >= 0) {
                            sb.append(('A'.toInt() + (n % 26)).toChar())
                            n = n / 26 - 1
                        }
                        return sb.reverse().toString()
                    }

                    dataRows.forEachIndexed { rIdx, line ->
                        val rowNum = rIdx + 1
                        val rawCells = line.trim().removePrefix("|").removeSuffix("|").split("|").map { it.trim() }
                        
                        // 행 번호 컬럼 감지
                        val firstCellRaw = rawCells.getOrNull(0) ?: ""
                        val firstCellClean = firstCellRaw.replace("*", "").trim()
                        val hasRowIndicator = firstCellClean.isNotEmpty() && firstCellClean.all { it.isDigit() } && rawCells.size > 20

                        val seatsCells = if (hasRowIndicator) rawCells.drop(1) else rawCells
                        // Removed fixed 26-column limit for V12.0
                        
                        seatsCells.forEachIndexed { cIdx, content ->
                            val colLetter = getColLabel(cIdx)
                            val seatNum = "$floorPrefix.$colLetter$rowNum"
                            
                            // 마크다운 서식 제거 후 비교 (e.g. **seat** -> seat)
                            val cleanContent = content.replace("*", "").trim()
                            val lowered = cleanContent.lowercase()
                            
                            val isExec = lowered.contains("임원") && lowered.contains("seat")
                            val isSeat = (lowered == "seat" || lowered.contains("seat")) && !isExec
                            
                            val mergeMatch = Regex("\\(병합(\\d+)\\)").find(cleanContent)
                            val mergeKey = mergeMatch?.groupValues?.get(1) ?: ""

                            val savedSeat = if (isExec) {
                                val uniqueMergeKey = "${floor.id}-$mergeKey"
                                if (mergeKey.isEmpty() || !processedMerges.contains(uniqueMergeKey)) {
                                    val seat = seatRepository.save(Seat(
                                        floor = floor, seatNumber = seatNum, sectionName = "${floor.name}_EXEC",
                                        xPos = ((cIdx + 1) * 32).toDouble(), yPos = (rowNum * 32).toDouble(),
                                        isExecutiveSeat = true
                                    ))
                                    if (mergeKey.isNotEmpty()) processedMerges.add(uniqueMergeKey)
                                    seatCount++
                                    seat
                                } else null
                            } else if (isSeat) {
                                val seat = seatRepository.save(Seat(
                                    floor = floor, seatNumber = seatNum, sectionName = "${floor.name}_OPEN",
                                    xPos = ((cIdx + 1) * 32).toDouble(), yPos = (rowNum * 32).toDouble(),
                                    isExecutiveSeat = false
                                ))
                                seatCount++
                                seat
                            } else null

                            // --- Personnel Deployment (V11.0 - Multi-Floor Mapping) ---
                            savedSeat?.let { seat ->
                                val occupantMapping = mapOf(
                                    "15.A1" to "홍팀장",
                                    "15.D3" to "김매니저",
                                    "15.E3" to "이대리",
                                    "15.F3" to "김주환",
                                    "15.G3" to "김지웅",
                                    "4.O14" to "조영진",
                                    "4.P14" to "유지면"
                                )
                                occupantMapping[seat.seatNumber]?.let { name ->
                                    val user = userRepository.findByName(name).orElse(null)
                                    if (user != null) {
                                        seatReservationRepository.save(SeatReservation(user = user, seat = seat))
                                    }
                                }
                            }
                        }
                    }
                    logger.info("+++ [V11.0] Successfully seeded Floor ${floor.name}: $seatCount seats created & people assigned +++")
                } catch (e: Exception) {
                    logger.error("FAILED to seed Floor ${floor.name}: ${e.message}", e)
                }
            }

            // --- Asset Directory Discovery (V11.0) ---
            val possibleAssetDirs = listOf(
                "../frontend/src/assets",
                "apps/spacemanager/frontend/src/assets",
                "/Users/study/spacemanager-anti/apps/spacemanager/frontend/src/assets"
            )

            var assetDir: java.io.File? = null
            for (dirPath in possibleAssetDirs) {
                val dir = java.io.File(dirPath)
                if (dir.exists() && dir.isDirectory) {
                    assetDir = dir
                    break
                }
            }

            if (assetDir != null) {
                logger.info("+++ [V11.0] Unified Seeding Engine Started. Assets Found at: ${assetDir.absolutePath} +++")
                
                val floorsToSeed = listOf(
                    Triple(floor4, java.io.File(assetDir, "4f.md").absolutePath, "4"),
                    Triple(floor7, java.io.File(assetDir, "7f.md").absolutePath, "7"),
                    Triple(floor15, java.io.File(assetDir, "15층.md").absolutePath, "15")
                )

                floorsToSeed.forEach { (floor, path, prefix) ->
                    parseFloorAndSaveSeats(floor, path, prefix)
                }
            } else {
                logger.error("COULD NOT FIND ASSET DIRECTORY! All seat seeding skipped.")
            }
            
            logger.info("Data initialization completed successfully.")
        } catch (e: Exception) {
            logger.error("Data initialization failed!", e)
        }
    }
}
