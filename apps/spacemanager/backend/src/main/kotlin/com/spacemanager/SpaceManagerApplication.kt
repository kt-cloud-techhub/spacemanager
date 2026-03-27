package com.spacemanager

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class SpaceManagerApplication

fun main(args: Array<String>) {
    runApplication<SpaceManagerApplication>(*args)
}
