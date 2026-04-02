package com.spacemanager.domain.service

import com.spacemanager.domain.model.Organization
import com.spacemanager.domain.model.User
import com.spacemanager.domain.repository.OrganizationRepository
import com.spacemanager.domain.repository.UserRepository
import org.apache.poi.ss.usermodel.WorkbookFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.InputStream

@Service
class BulkUploadService(
    private val orgRepository: OrganizationRepository,
    private val userRepository: UserRepository
) {

    @Transactional
    fun uploadExcel(file: MultipartFile): Map<String, Any> {
        val inputStream: InputStream = file.inputStream
        val workbook = WorkbookFactory.create(inputStream)
        val sheet = workbook.getSheetAt(0)

        // Clear existing data (As requested for full refresh)
        // Note: Reservations might be lost if User IDs change, 
        // but for now, we follow the "bulk input every time" policy.
        userRepository.deleteAll()
        orgRepository.deleteAll()

        val orgMap = mutableMapOf<String, Organization>() // Key: "ParentName>ChildName"
        var usersImported = 0
        var orgsCreated = 0

        val headerRow = sheet.getRow(0)
        // Expected columns: 0: Division, 1: Dept, 2: Team, 3: EmpID, 4: Name, 5: Role

        for (i in 1..sheet.lastRowNum) {
            val row = sheet.getRow(i) ?: continue
            
            val divisionName = row.getCell(0)?.toString()?.trim() ?: ""
            val deptName = row.getCell(1)?.toString()?.trim() ?: ""
            val teamName = row.getCell(2)?.toString()?.trim() ?: ""
            val empId = row.getCell(3)?.toString()?.trim() ?: ""
            val name = row.getCell(4)?.toString()?.trim() ?: ""
            val role = row.getCell(5)?.toString()?.trim() ?: "팀원"

            if (divisionName.isEmpty()) continue

            // 1. Division (Level 1)
            val division = orgMap.getOrPut(divisionName) {
                orgRepository.save(Organization(name = divisionName, level = 1)).also { orgsCreated++ }
            }

            // 2. Department (Level 2)
            var lastOrg = division
            if (deptName.isNotEmpty()) {
                val deptKey = "$divisionName>$deptName"
                lastOrg = orgMap.getOrPut(deptKey) {
                    orgRepository.save(Organization(name = deptName, level = 2, parent = division)).also { orgsCreated++ }
                }
            }

            // 3. Team (Level 3)
            if (teamName.isNotEmpty()) {
                val teamKey = "$divisionName>$deptName>$teamName"
                lastOrg = orgMap.getOrPut(teamKey) {
                    orgRepository.save(Organization(name = teamName, level = 3, parent = lastOrg)).also { orgsCreated++ }
                }
            }

            // 4. User
            if (empId.isNotEmpty() && name.isNotEmpty()) {
                userRepository.save(User(
                    employeeId = empId,
                    name = name,
                    organization = lastOrg,
                    role = if (role.contains("임원") || role.contains("상무") || role.contains("전무")) "Executive" else "User"
                ))
                usersImported++
            }
        }

        workbook.close()
        return mapOf(
            "orgsCreated" to orgsCreated,
            "usersImported" to usersImported,
            "status" to "Success"
        )
    }
}
