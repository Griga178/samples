import time

import sys

def fast_input():
    return sys.stdin.readline().rstrip("\r\n")

inputDataAmount = int(fast_input())
cases = []
# cases = [ [fast_input() for _ in range(int(fast_input().split()[0]))] for _ in range(inputDataAmount) ]
for _ in range(inputDataAmount):
    n = int(fast_input().split()[0])
    inner_cases = tuple(fast_input() for __ in range(n))
    cases.append(inner_cases)


start = time.time()

def findCoords(case):
    coords = {"A": None, "B": None}
    for y, row in enumerate(case, 1):
        if "A" in row:
            coords['A'] = (row.index("A") + 1, y)
        if "B" in row:
            coords['B'] = (row.index("B") + 1, y)
    return coords

def buildWayV2(start, finish, stepDir):
    x, y = start
    fx, fy = finish
    path = [(x, y)]

    # Если чётная x — барьер, сделаем шаг по горизонтали
    if x % 2 == 0:
        x += stepDir
        path.append((x, y))

    # Двигаемся по вертикали (y) к цели
    while y != fy:
        y += stepDir
        path.append((x, y))

    # Двигаемся по горизонтали (x) к цели
    while x != fx:
        x += stepDir
        path.append((x, y))

    return path

def drawRows(n, m, stepsA, stepsB):
    # Создаем словарь с координатами для быстрого доступа к символам
    points = {}
    ax, ay = stepsA[0]
    points[(ax, ay)] = 'A'
    bx, by = stepsB[0]
    points[(bx, by)] = 'B'

    for x, y in stepsA[1:]:
        points[(x, y)] = 'a'
    for x, y in stepsB[1:]:
        points[(x, y)] = 'b'

    for y in range(1, n+1):
        row = ''.join(points.get((x, y),
                    '#' if x % 2 == 0 and y % 2 == 0 else '.')
                    for x in range(1, m+1))
        sys.stdout.write(row + '\n')


for case in cases:
    n = len(case)
    m = len(case[0]) if n > 0 else 0
    coords = findCoords(case)

    # Определяем куда идти — к (1,1) или (m,n)
    if sum(coords['A']) <= sum(coords['B']):
        stepsA = buildWayV2(coords['A'], (1, 1), -1)
        stepsB = buildWayV2(coords['B'], (m, n), 1)
    else:
        stepsA = buildWayV2(coords['A'], (m, n), 1)
        stepsB = buildWayV2(coords['B'], (1, 1), -1)

    drawRows(n, m, stepsA, stepsB)


end = time.time()  # записываем время конца
print(f"Время выполнения: {end - start} сек")
