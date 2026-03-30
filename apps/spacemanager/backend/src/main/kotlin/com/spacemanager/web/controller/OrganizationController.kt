package com.spacemanager.web.controller

import com.spacemanager.domain.service.OrganizationService
import com.spacemanager.web.dto.OrganizationDto
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/organizations")
@CrossOrigin(origins = ["http://localhost:5173", "http://localhost:5174"])
class OrganizationController(
    private val orgService: OrganizationService
) {

    @GetMapping
    fun getAll(): List<OrganizationDto> = orgService.getAllOrganizations()

    @GetMapping("/tree")
    fun getTree(): List<com.spacemanager.web.dto.OrganizationTreeDto> = orgService.getOrganizationTree()

    @PostMapping
    fun create(@RequestBody dto: OrganizationDto): OrganizationDto = orgService.createOrganization(dto)
}
