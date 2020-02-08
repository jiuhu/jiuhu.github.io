project(bm)

find_package(Benchmark REQUIRED)

file(GLOB source
   "*.cpp"
)

add_executable(${PROJECT_NAME} ${source})
target_link_libraries(${PROJECT_NAME} benchmark::benchmark)

if ("${CMAKE_SYSTEM_NAME}" MATCHES "Windows")
    target_link_libraries(${PROJECT_NAME} Shlwapi)
endif()
