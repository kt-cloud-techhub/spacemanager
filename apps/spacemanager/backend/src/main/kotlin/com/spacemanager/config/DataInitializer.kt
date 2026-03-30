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
            val floor7 = floorRepository.findByName("7F") ?: floorRepository.save(Floor(name = "7F", mapImageUrl = "/src/assets/floor_7f.png"))
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
                userRepository.save(User(name = "홍팀장", role = "Manager", organization = cloudTeam))
                userRepository.save(User(name = "김매니저", role = "Member", organization = cloudTeam))
                userRepository.save(User(name = "이대리", role = "Member", organization = cloudTeam))
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

            // 4. Seats for 7F
            if (seatRepository.findByFloorId(floor7.id!!).isEmpty()) {
                val seats = mutableListOf<Seat>()
                for (i in 1..5) for (j in 1..2) {
                    seats.add(Seat(
                        floor = floor7, 
                        seatNumber = "7.C${i}${j}", 
                        xPos = (100 + i * 45).toDouble(), 
                        yPos = (200 + j * 35).toDouble(), 
                        isExecutiveSeat = false
                    ))
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
