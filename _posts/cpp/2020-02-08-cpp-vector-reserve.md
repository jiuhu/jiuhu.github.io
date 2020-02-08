---
layout: post
title:  "Reserve your vector"
date:   2020-02-08 15:11:56 +0100
categories: c++
---

A simple yet important way to increase the efficiency of adding new items into a vector is by doing a reserve correctly.

Consider the following code snippet that attempt to add 10 items into a vector,
```
std::vector<int> vec;
for (int i = 0; i < 10; i++) {
    vec.emplace_back(i);
}
```

A vector is a container class which wraps a resizable array. When the current allocated storage is full, the vector will expand its capacity to allow us insert more items. As array is a contiguous block of memory, that means it required to reallocate a new block of memory to provide more capacity.

As we all know, memory allocation is expensive, therefore we would want to avoid reallocation whenever we can.

### When reallocate?
Different compilers carries out different implementation on how the storage reallocation works. The test program targeting WSL invokes 5 reallocation when we insert 10 items to a vector.

#### WSL-Release

| No | Capacity | Reallocation |
| --- | --- | --- |
| 1 | 1 | ✓ |
| 2 | 2 | ✓ |
| 3 | 4 | ✓ |
| 4 | 4 ||
| 5 | 8 | ✓ |
| 6 | 8 ||
| 7 | 8 ||
| 8 | 8 ||
| 9 | 16 | ✓ |
| 10 | 16 ||

When we run the same program on Windows, there’s a total of 7 reallocation.

#### x64-Release

| No | Capacity | Reallocation |
| --- | --- | --- |
| 1 | 1 | ✓ |
| 2 | 2 | ✓ |
| 3 | 3 | ✓ |
| 4 | 4 | ✓ |
| 5 | 6 | ✓ |
| 6 | 6 ||
| 7 | 9 | ✓ |
| 8 | 9 ||
| 9 | 9 ||
| 10 | 13 | ✓ |

### The impact
How exactly does this capacity reallocation affect our perfromance? Take a look at the following benchmark result on x64-Release

#### Machine A
```
Run on (8 X 1800 MHz CPU s)
```

| Benchmark | Time | CPU | Iterations |
| --- | --- | --- | --- |
| BM_EmplaceWithoutReserve | 554 ns | 558 ns | 1120000 |
| BM_EmplaceWithReserve | 78.5 ns | 78.5 ns | 8960000 |

#### Machine B
```
Run on (12 X 2592 MHz CPU s)
```

| Benchmark | Time | CPU | Iterations |
| --- | --- | --- | --- |
| BM_EmplaceWithoutReserve | 396 ns | 390 ns | 1723077 |
| BM_EmplaceWithReserve | 59.9 ns | 60.9 ns | 10000000 |

By reserve the capacity, we are able to achieve an approximate **6 times** better result.

Do note that the impact is less significant when one emplacing a large number of items into the vector. The following result is based on emplacing 1000 items into the vector.

| Benchmark | Time | CPU | Iterations |
| --- | --- | --- | --- |
| BM_EmplaceLargeWithoutReserve | 1979 ns | 1995 ns | 344615 |
| BM_EmplaceLargeWithReserve | 1305 ns | 1339 ns | 560000 |

In conclusion, correctly use of reserve can help to improve performance by reducing unnecessary reallocation. However, it is also easy to misuse reserve. For example, one should not simply reserve a large capcity, which greater than what usually required, just to avoid reallocation.

A useful rule of thumb is if we know the exact number we want to insert into a vector, we should reserve it.
