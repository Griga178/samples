'''
    ASCII-роботы
    переместить роботов по углам 1,1 и n,m
    ** робот двигается сначала по вертикали, потом по горизонтали!
    если повертикали есть барьер то 1 шаг по горизонтали и дальше по ver->hor
'''

# import sys
#
# def fast_input():
# 	return sys.stdin.readline().rstrip("\r\n")
#
# def fast_output(x):
#     sys.stdout.write(str(x))
#
# inputDataAmount = int(fast_input())
# for i in range(inputDataAmount):
#     n, m = map(int, fast_input().split())
#     print([n, m])

#
# ВРЕМЕННОЕ ЧТЕНИЕ ИЗ ПЕРЕМЕННОЙ
#
inputData0 = '''2
5 5
.....
.#A#.
...B.
.#.#.
.....
7 9
.........
.#.#.#.#.
..AB.....
.#.#.#.#.
.........
.#.#.#.#.
.........'''

data = inputData0.split('\n')

inputDataAmount = data[0]
some = 0
cases = []
for row in data[1:]:
    if some == 0:
        n, m = map(int, row.split())
        some = n
        tempCase = []
        cases.append(tempCase)
    else:
        some -= 1
        tempCase.append(row)
        # print(row)
#
# ВРЕМЕННОЕ ЧТЕНИЕ ИЗ ПЕРЕМЕННОЙ
#

def findCoords(case: list) -> dict:
    coordY = 0 # по вертикали
    coords = {"A": None, "B": None}

    for row in case:
        coordY += 1
        if "A" in row:
            coords['A'] = (row.index("A")+1, coordY)

        if "B" in row:
            coords['B'] = (row.index("B")+1, coordY)

    return coords

def buildWayV2(start: tuple, finish: tuple, stepDirection: int) -> list:
    steps = [start]
    currentX = start[0]
    currentY = start[1]
    stopY = finish[1]
    stopX = finish[0]
    # проверяем m/x координату на нечетность
    # если четная (то есть барьеры по вертикали) двигаем в бок
    if currentX % 2 == 0:
        currentX += stepDirection
        steps.append((currentX, currentY))

    # двигаем по вертикали до края
    while currentY != stopY:
        currentY += stepDirection
        steps.append((currentX, currentY))

    # двигаем по горизонтали до края
    while currentX != stopX:
        currentX += stepDirection
        steps.append((currentX, currentY))

    return steps


def drawRows(n: int, m: int, stepsA: list, stepsB: list) -> None:
    map = []
    for y in range(n):
        hRow = []
        map.append(hRow)
        for x in range(m):
            elem = '#' if (x+1)%2==0 and (y+1)%2==0 else '.'
            hRow.append(elem)

    map[stepsA[0][1]-1][stepsA[0][0]-1] = 'A'
    for coord in stepsA[1:]:
        x, y = coord
        map[y-1][x-1] = 'a'

    map[stepsB[0][1]-1][stepsB[0][0]-1] = 'B'
    for coord in stepsB[1:]:
        x, y = coord
        map[y-1][x-1] = 'b'


    for r in map:
        row = ''.join(r)
        print(row)

for case in cases:
    n = len(case)
    m = len(case[0])
    coords = findCoords(case)

    # определяем кто в какой угол идет и строим путь
    if sum(coords['A']) <= sum(coords['B']):
        stepsA = buildWayV2(coords['A'], (1, 1), -1)
        stepsB = buildWayV2(coords['B'], (m, n), 1)
    else:
        stepsA = buildWayV2(coords['A'], (m, n), 1)
        stepsB = buildWayV2(coords['B'], (1, 1), -1)

    drawRows(n, m, stepsA, stepsB)
