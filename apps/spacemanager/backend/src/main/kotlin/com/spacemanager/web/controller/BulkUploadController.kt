package com.spacemanager.web.controller

import com.spacemanager.domain.service.BulkUploadService
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/bulk")
@CrossOrigin(origins = ["http://localhost:5173", "http://localhost:5174"])
class BulkUploadController(
    private val bulkUploadService: BulkUploadService
) {

    @PostMapping("/upload")
    fun upload(@RequestParam("file") file: MultipartFile): Map<String, Any> {
        return try {
            bulkUploadService.uploadExcel(file)
        } catch (e: Exception) {
            mapOf("status" to "Error", "message" to (e.message ?: "Unknown error"))
        }
    }
}
