import sys
input = sys.stdin.readline

inputCaseAmount = int(input())

cases = []
for __ in range(inputCaseAmount):
    width, height = map(int, input().split())

    curFig = []
    cases.append(curFig)
    # первая и последняя строка с отступом = height
    topBotRow = f'{" "*height}{"_"*width}'
    curFig.append(topBotRow)

    curMargin = height-1
    curDopWidth = 0
    for __ in range(height):
        row = f'{" "*curMargin}/{" "*curDopWidth}{" "*width}\\'
        curFig.append(row)
        curMargin -= 1
        curDopWidth += 2

    for __ in range(height):
        curDopWidth -= 2
        curMargin += 1
        row = f'{" "*curMargin}\{" "*curDopWidth}{" "*width}/'
        curFig.append(row)

    botRow = ''
    symbIdx = 0
    for symb in curFig[-1]:
        if symb == " ":
            botRow += topBotRow[symbIdx]
        else:
            botRow += symb

        symbIdx += 1

    curFig[-1] = botRow


for fig in cases:
    for row in fig:
        sys.stdout.write(row + '\n')
    sys.stdout.write("")
