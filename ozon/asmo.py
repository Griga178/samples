import sys
input = sys.stdin.readline

inputCaseAmount = int(input())
cases = []


for _ in range(inputCaseAmount):
    mountAmount, rowAmount, clmAmount = map(int, input().split())

    currentCase = [] # тут смесь гор
    currentMount = []
    for __ in range(mountAmount):

        if not currentMount:
            for __ in range(rowAmount):
                row = input().rstrip('\n')
                currentMount.append(row)
            currentCase.append(currentMount)
        else:
            # чтение 2+ гор
            input()
            for rowI in range(rowAmount):
                row = input().rstrip('\n')

                baseRow = currentMount[rowI]
                result = ""
                for i in range(clmAmount):
                    if baseRow[i] == '.':
                        result += row[i]
                    else:
                        result += baseRow[i]
                    currentMount[rowI] = result

    cases.append(currentCase)

for case in cases:
    for mount in case:
        for row in mount:
            sys.stdout.write(row + '\n')

        sys.stdout.write('\n')
