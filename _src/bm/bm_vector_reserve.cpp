#include <benchmark/benchmark.h>

#include <vector>

namespace {
  constexpr int SmallCount = 10;
  constexpr int LargeCount = 1000;
}

static void BM_EmplaceWithoutReserve(benchmark::State& state) {
  for (auto _ : state) {
    std::vector<int> vec;
    for (int i = 0; i < SmallCount; i++) {
        vec.emplace_back(i);
    }
  }
}

static void BM_EmplaceWithReserve(benchmark::State& state) {
  for (auto _ : state) {
    std::vector<int> vec;
    vec.reserve(SmallCount);
    for (int i = 0; i < SmallCount; i++) {
        vec.emplace_back(i);
    }
  }
}

static void BM_EmplaceLargeWithoutReserve(benchmark::State& state) {
  for (auto _ : state) {
    std::vector<int> vec;
    for (int i = 0; i < LargeCount; i++) {
        vec.emplace_back(i);
    }
  }
}

static void BM_EmplaceLargeWithReserve(benchmark::State& state) {
  for (auto _ : state) {
    std::vector<int> vec;
    vec.reserve(LargeCount);
    for (int i = 0; i < LargeCount; i++) {
        vec.emplace_back(i);
    }
  }
}

BENCHMARK(BM_EmplaceWithoutReserve);
BENCHMARK(BM_EmplaceWithReserve);
BENCHMARK(BM_EmplaceLargeWithoutReserve);
BENCHMARK(BM_EmplaceLargeWithReserve);

BENCHMARK_MAIN();