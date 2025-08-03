import sys
input = sys.stdin.readline

# m, n, width, height, k = map(int, input().split())
# m, n, width, height, k = (20, 5, 1, 1, 10)
m, n, width, height, k = (30, 10, 4, 2, 6)
# m ширина поля/ n - высота
figureRows = []

top_bottom = '+' + '-' * m + '+'
empty_line = '|' + ' ' * m + '|'

hex_in_row_different = bool((m // (width + height) - 1) % 2)
hex_in_row_amount = (m // (width + height) - 1) // 2

isOdd = True if hex_in_row_different else False
rows = ['|' for __ in range(n)]
rowIdx = 0
while k > 0:
    if isOdd:
        hex_in_row = hex_in_row_amount + 1
        isOdd = False
    else:
        hex_in_row = hex_in_row_amount
        isOdd = True if hex_in_row_different else False

    k -= hex_in_row

    if k < 0:
        hex_in_row = hex_in_row + k

    for hex in range(hex_in_row):

        hexHead = f'{" "*height}{"_"*width}{" "*height}{" "*width}'
        rows[rowIdx] += hexHead


        curMargin = height-1
        curDopWidth = 0

        # for __ in range(height):
            # rowIdx += 1

        # for __ in range(height):
        #     rowIdx += 1

        # for __ in range(height):
        #     row = f'{" "*curMargin}/{" "*curDopWidth}{" "*width}\\'
        #     hexRows[rowIdx] += row
        #     curFig.append(row)
        #     curMargin -= 1
        #     curDopWidth += 2

        # for __ in range(height):
        #     curDopWidth -= 2
        #     curMargin += 1
        #     row = f'{" "*curMargin}\{" "*curDopWidth}{" "*width}/'
        #     curFig.append(row)
    rowIdx += (1+1)  # head + height *2

    # row += '|'
    # rows.append(hexRows)



print(top_bottom)
for r in rows:
    print(r)

print(top_bottom)
