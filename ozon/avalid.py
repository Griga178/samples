import sys
input = sys.stdin.readline

inputCaseAmount = int(input())

def getRegionBorderCoords(hexCoord):
    nC = []
    # в своём ряду
    nC.append((hexCoord[0]-2, hexCoord[1])) # слева
    nC.append((hexCoord[0]+2, hexCoord[1])) # справа
    # сверху
    nC.append((hexCoord[0]-1, hexCoord[1]-1)) # слева
    nC.append((hexCoord[0]+1, hexCoord[1]-1)) # справа
    # снизу
    nC.append((hexCoord[0]-1, hexCoord[1]+1)) # слева
    nC.append((hexCoord[0]+1, hexCoord[1]+1)) # справа
    return nC

def updateArea(curHex, area):
    # добавляем новые границы в area
    coords = getRegionBorderCoords(curHex)
    area.remove(curHex)
    for newCoord in coords:
        area.add(newCoord)

def isValid(regions):

    for regName, regCoords in regions.items():

        # lenght = len(regCoords)
        rIndex = 0
        #
        regionBorderCoords = [set()]

        for curHex in regCoords:
            # если координаты еще не определены
            if not regionBorderCoords[0]:
                for rbg in getRegionBorderCoords(curHex):
                    regionBorderCoords[0].add(rbg)

            else:
                # ищем в каждой области координаты совпадающие с curHex
                interestAreasIndex = []
                areaIndex = 0

                for area in regionBorderCoords:
                    # выбираем области, к которым принадлежит curHex

                    if curHex in area:
                        interestAreasIndex.append(areaIndex)
                        updateArea(curHex, area)
                    areaIndex += 1

                if len(interestAreasIndex) == 1:
                    # найдена area где сидит hex
                    pass
                elif len(interestAreasIndex) > 1:
                    # объединяем координаты областей
                    unionSet = set()
                    # print(interestAreasIndex, regionBorderCoords)
                    for i in sorted(interestAreasIndex, reverse=True):
                        areaSet = regionBorderCoords.pop(i)
                        unionSet.update(areaSet)
                    regionBorderCoords.append(unionSet)

                else:
                    # Новая area
                    rgbNew = getRegionBorderCoords(curHex)
                    regionBorderCoords.append(set(rgbNew))



        if len(regionBorderCoords) > 1:
            return "NO"

    else:
        return "YES"

cases = []
for _ in range(inputCaseAmount):
    verAmount, horAmount = map(int, input().split())
    regions = {}

    for vI in range(verAmount):
        row = input().rstrip('\n')

        if (vI + 1) % 2 != 0:
            startRowIndex = 0
        else:
            startRowIndex = 1

        lIndex = 0

        for letter in row:
            if letter != '.':
                hexName = letter

                if not hexName in regions:
                    regions[hexName] = []

                regions[hexName].append((lIndex, vI))

            lIndex += 1
    cases.append(f'{isValid(regions)}\n')

for c in cases:
    sys.stdout.write(c)
