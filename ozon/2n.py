m, n, width, height, k = (30, 10, 4, 2, 6)
m, n, width, height, k = (20, 5, 1, 1, 10)


fig_rows = [[' ' for i in range(m)] for j in range(n)]




# поиск координат для вставки
# 1 фигура 0,0, вторая (+ width + spase)
# 2 ряд 0,0 + space вторая (+ width + spase)
# 3 ряд 0,0  (+ height -1)


def drow_hex(w, h):

    curFig = [f'{" "*h}{"_"*w}']
    # body верх
    curMargin = h-1
    curDopWidth = 0
    for __ in range(h):
        row = f'{" "*curMargin}/{" "*curDopWidth}{" "*w}\\'
        curFig.append(row)
        curMargin -= 1
        curDopWidth += 2
    # body низ
    for __ in range(h-1):
        curDopWidth -= 2
        curMargin += 1
        row = f'{" "*curMargin}\{" "*curDopWidth}{" "*w}/'
        curFig.append(row)

    curFig.append(f'{" "*(curMargin+1)}\{"_"*w}/')
    return curFig


def drow_row(map:list, figure:list, amount: int, leftMargin: int):
    pass


top_bottom = '+' + '-' * m + '+'
# print([x for x in top_bottom])
for row in fig_rows:
    # print(['|'], row)
    print(row)
# print([x for x in top_bottom])

curFig = drow_hex(width, height)
# print(curFig)
for e in curFig:
    print(e)

# проставить координаты
# 0,0 + x
# space, 0.0

# + width
# height * 2 + width
# max_hex_in_row = m // ( - width)
max_hex_in_odd_row = int((m + width) / ((height * 2 + width) + width))
