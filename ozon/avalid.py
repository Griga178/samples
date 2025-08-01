import sys
input = sys.stdin.readline

inputCaseAmount = int(input())
cases = []

for _ in range(inputCaseAmount):
    verAmount, horAmount = map(int, input().split())

    for vI in range(verAmount):
        row = input().rstrip('\n')

        if (vI+1)%2 != 0:
            isEvenRow = False
            startRowIndex = 0
        else:
            isEvenRow = True
            startRowIndex = 1

        for point in row[startRowIndex::2]:

            hexagon = point
            print(hexagon)
            # законченные "страны кидать в множество"
            # сделать множество с возможными "странами"

            # проверка -> YES
            # 1 нет в множестве 1
            # есть в множестве 2
