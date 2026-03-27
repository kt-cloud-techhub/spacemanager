package com.spacemanager.domain.service

import com.spacemanager.domain.model.Organization
import com.spacemanager.domain.repository.OrganizationRepository
import com.spacemanager.domain.repository.UserRepository
import com.spacemanager.web.dto.OrganizationDto
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class OrganizationService(
    private val orgRepository: OrganizationRepository,
    private val userRepository: UserRepository
) {

    @Transactional(readOnly = true)
    fun getAllOrganizations(): List<OrganizationDto> {
        return orgRepository.findAll().map { it.toDto() }
    }

    @Transactional
    fun createOrganization(dto: OrganizationDto): OrganizationDto {
        val parent = dto.parentId?.let { orgRepository.findById(it).orElseThrow { RuntimeException("Parent not found") } }
        val org = Organization(
            name = dto.name,
            level = dto.level,
            parent = parent,
            isExecutiveUnit = dto.isExecutiveUnit
        )
        return orgRepository.save(org).toDto()
    }

    @Transactional(readOnly = true)
    fun getMemberCount(orgId: Long): Long {
        val orgIds = getAllDescendantOrgIds(orgId) + orgId
        return userRepository.countByOrganizationIdIn(orgIds)
    }

    private fun getAllDescendantOrgIds(parentId: Long): List<Long> {
        val children = orgRepository.findByParentId(parentId)
        return children.mapNotNull { it.id } + children.flatMap { getAllDescendantOrgIds(it.id!!) }
    }

    private fun Organization.toDto() = OrganizationDto(
        id = this.id,
        name = this.name,
        level = this.level,
        parentId = this.parent?.id,
        isExecutiveUnit = this.isExecutiveUnit
    )
}
