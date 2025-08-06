'''
    формирование поля из гексагонов по пяти переменным

    строим пустое поле из " "
    высчитываем места где должны стоять гексагоны,
    перерисовываем пробелы на содержимое гексагонов

'''
cases = [
    (20, 5, 1, 1, 10),
    (71, 70, 29, 21, 1),
    (71, 70, 35, 18, 1),
    (3, 3, 1, 1, 1),
    (15, 15, 1, 1, 1),
    (30, 10, 4, 2, 6),
    (5, 13, 1, 2, 3),
    (71, 70, 10, 10, 8)
]

def drow_hex_v2(w, h) -> list:
    # шапка
    curFig = []
    header = [" " for __ in range(h)]
    for __ in range(w):
        header.append("_")
    curFig.append(header)

    # body верх
    curMargin = h-1
    curDopWidth = 0
    for __ in range(h):
        row_body_top = [" "] * curMargin
        row_body_top += "/"
        row_body_top += " " * curDopWidth
        row_body_top += " " * w
        row_body_top += "\\"
        curMargin -= 1
        curDopWidth += 2
        curFig.append(row_body_top)
    # body низ
    row_body_bot = []
    for __ in range(h-1):
        curDopWidth -= 2
        curMargin += 1
        row_body_bot = [" "] * curMargin
        row_body_bot += "\\"
        row_body_bot += " " * curDopWidth
        row_body_bot += " " * w
        row_body_bot += "/"
        curFig.append(row_body_bot)
    # низ
    botom = [" "] * (curMargin+1)
    botom += "\\"
    botom += ["_"] * (w)
    botom += "/"
    curFig.append(botom)
    return curFig

def input_hex(map:list, w, h, x: int, y: int):
    hex_data = drow_hex_v2(w, h)

    xIds = x
    yIds = y
    for row in hex_data:
        xIds = x
        for cell in row:
            if map[yIds][xIds] == " ":
                map[yIds][xIds] = cell

            xIds += 1
        yIds += 1

def draw_map(m, n, width, height, k):

    fig_rows = [[' ' for i in range(m)] for j in range(n)]
    for r in fig_rows:
        r += "|"
    hex_width = height+width+height
    # hex_height = 1 + height + height
    # кол-во в нечетном ряду (m-width)//(height+width+height+width)
    hex_in_odd_row = (m+width)//(hex_width+width)
    # отступ слева в четном ряду
    evenMargineX = width + height
    # кол-во в четном ряду (m-width-evenMargine)//(height+width+height+width)
    hex_in_even_row = (m+width-evenMargineX)//(hex_width+width)
    # ищем количество рядов и количество hex в последнем ряду
    current_k = k
    ostatok_k = 0
    isOdd = True
    row_amount = 0

    # print('w:', hex_width, 'h:', hex_height, 'map_w:', m, 'k:', k)
    # print('h in odd:', hex_in_odd_row, 'h in even:',hex_in_even_row)

    while current_k != 0:
        row_amount += 1
        if isOdd:
            if current_k > hex_in_odd_row:
                current_k -= hex_in_odd_row
                isOdd = False
            else:
                ostatok_k = current_k
                current_k = 0

        else:
            if current_k > hex_in_even_row:
                current_k -= hex_in_even_row
                isOdd = True
            else:
                ostatok_k = current_k
                current_k = 0
    # print('ряды', row_amount, "в последнем", ostatok_k, "hex")

    stepX = width * 2 + height * 2
    stepY = height

    yIdx = 0
    isOdd = True
    for y in range(row_amount-1):
        xIdx = 0
        if isOdd:
            for x in range(hex_in_odd_row):
                # fig_rows[yIdx][xIdx] = 0
                input_hex(fig_rows, width, height, xIdx, yIdx)
                xIdx += stepX
            isOdd = False
        else:
            xIdx += evenMargineX
            for x in range(hex_in_even_row):
                # fig_rows[yIdx][xIdx] = 0
                input_hex(fig_rows, width, height, xIdx, yIdx)
                xIdx += stepX
            isOdd = True
        yIdx += stepY
    else:
        xIdx = 0
        if isOdd:
            for x in range(ostatok_k):
                # fig_rows[yIdx][xIdx] = 0
                input_hex(fig_rows, width, height, xIdx, yIdx)
                xIdx += stepX
            isOdd = False
        else:
            xIdx += evenMargineX
            for x in range(ostatok_k):
                # fig_rows[yIdx][xIdx] = 0
                input_hex(fig_rows, width, height, xIdx, yIdx)
                xIdx += stepX
            isOdd = True
        yIdx += stepY
    return fig_rows


for m, n, width, height, k in cases[:]:
    fig_rows = draw_map(m, n, width, height, k)
    top_bottom = '+' + '-' * m + '+'
    print(top_bottom)
    for row in fig_rows:
        # print(['|'], row)
        print("|"+''.join(row))
        # print([x for x in top_bottom])
    print(top_bottom)

    # for i in hex_data:
    #     print(''.join(i))
