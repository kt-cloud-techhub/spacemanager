package com.spacemanager.web.controller

import com.spacemanager.domain.service.OrganizationService
import com.spacemanager.web.dto.OrganizationDto
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/organizations")
class OrganizationController(
    private val orgService: OrganizationService
) {

    @GetMapping
    fun getAll(): List<OrganizationDto> = orgService.getAllOrganizations()

    @PostMapping
    fun create(@RequestBody dto: OrganizationDto): OrganizationDto = orgService.createOrganization(dto)
}
