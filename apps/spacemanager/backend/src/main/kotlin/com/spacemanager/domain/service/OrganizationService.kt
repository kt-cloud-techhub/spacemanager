package com.spacemanager.domain.service

import com.spacemanager.domain.model.Organization
import com.spacemanager.domain.repository.OrganizationRepository
import com.spacemanager.domain.repository.UserRepository
import com.spacemanager.web.dto.OrganizationDto
import com.spacemanager.web.dto.OrganizationTreeDto
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

    @Transactional(readOnly = true)
    fun getOrganizationTree(): List<com.spacemanager.web.dto.OrganizationTreeDto> {
        val allOrgs = orgRepository.findAll()
        val rootOrgs = allOrgs.filter { it.parent == null }
        
        return rootOrgs.map { buildTree(it, allOrgs) }
    }

    private fun buildTree(org: Organization, allOrgs: List<Organization>): com.spacemanager.web.dto.OrganizationTreeDto {
        val children = allOrgs.filter { it.parent?.id == org.id }
        
        return OrganizationTreeDto(
            id = org.id!!,
            name = org.name,
            level = org.level,
            parentId = org.parent?.id,
            isExecutiveUnit = org.isExecutiveUnit,
            memberCount = getRecursiveMemberCount(org, allOrgs),
            directMemberCount = org.memberCount.toLong(),
            children = children.map { buildTree(it, allOrgs) }
        )
    }

    private fun getRecursiveMemberCount(org: Organization, allOrgs: List<Organization>): Long {
        val direct = org.memberCount.toLong()
        val children = allOrgs.filter { it.parent?.id == org.id }
        return direct + children.sumOf { getRecursiveMemberCount(it, allOrgs) }
    }

    @Transactional
    fun createOrganization(dto: OrganizationDto): OrganizationDto {
        val parent = dto.parentId?.let { orgRepository.findById(it).orElseThrow { RuntimeException("Parent not found") } }
        val org = Organization(
            name = dto.name,
            level = dto.level,
            parent = parent,
            isExecutiveUnit = dto.isExecutiveUnit,
            memberCount = dto.memberCount
        )
        return orgRepository.save(org).toDto()
    }

    @Transactional
    fun updateOrganization(id: Long, dto: OrganizationDto): OrganizationDto {
        val org = orgRepository.findById(id).orElseThrow { RuntimeException("Organization not found") }
        val parent = dto.parentId?.let { orgRepository.findById(it).orElseThrow { RuntimeException("Parent not found") } }
        
        org.name = dto.name
        org.level = dto.level
        org.parent = parent
        org.isExecutiveUnit = dto.isExecutiveUnit
        org.memberCount = dto.memberCount
        
        return orgRepository.save(org).toDto()
    }

    @Transactional
    fun deleteOrganization(id: Long) {
        val children = orgRepository.findByParentId(id)
        if (children.isNotEmpty()) {
            throw RuntimeException("Cannot delete organization with children. Please delete/move children first.")
        }
        
        val memberCount = userRepository.countByOrganizationId(id)
        if (memberCount > 0) {
            throw RuntimeException("Cannot delete organization with members. Please move members first.")
        }

        orgRepository.deleteById(id)
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
        isExecutiveUnit = this.isExecutiveUnit,
        memberCount = this.memberCount
    )
}
