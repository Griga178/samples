import sys
input = sys.stdin.readline

inputDataAmount = int(input())
cases = []

for _ in range(inputDataAmount):
    n, m = map(int, input().split())
    inner_cases = [(n, m)] + [input().rstrip('\n') for __ in range(n)]
    cases.append(inner_cases)

def buildWayV2(start, finish, stepDir):
    x, y = start
    fx, fy = finish

    path = [(x, y)]
    if x % 2 == 0:
        x += stepDir
        path.append((x, y))

    # Горизонтальное и вертикальное перемещение — через range
    y_range = range(y + stepDir, fy + stepDir, stepDir)
    path.extend((x, yy) for yy in y_range)

    x_range = range(x + stepDir, fx + stepDir, stepDir)
    path.extend((xx, fy) for xx in x_range)
    return path

def drawRows(n, m, stepsA, stepsB):
    points = {}
    points[stepsA[0]] = 'A'
    points[stepsB[0]] = 'B'

    for p in stepsA[1:]:
        points[p] = 'a'
    for p in stepsB[1:]:
        points[p] = 'b'

    rows = []
    for y in range(1, n + 1):
        row = ''.join(points.get((x, y), '#' if x % 2 == 0 and y % 2 == 0 else '.') for x in range(1, m + 1))
        rows.append(row)
    sys.stdout.write('\n'.join(rows) + '\n')

import time
start = time.time()

for case in cases:
    (n, m), *grid = case
    c = [None, None]

    for y, row in enumerate(grid, 1):
        for x, ch in enumerate(row, 1):
            if ch == "A":
                c[0] = (x, y)
            elif ch == "B":
                c[1] = (x, y)

    if sum(c[0]) <= sum(c[1]):
        stepsA = buildWayV2(c[0], (1, 1), -1)
        stepsB = buildWayV2(c[1], (m, n), 1)
    else:
        stepsA = buildWayV2(c[0], (m, n), 1)
        stepsB = buildWayV2(c[1], (1, 1), -1)

    drawRows(n, m, stepsA, stepsB)
