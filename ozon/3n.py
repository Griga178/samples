# есть экранирование!
inp_str = '''7
3 3
 _
/ \\
\\_/
4 9
 _   _
/ \\_/ \\_
\\_/ \\_/ \\
  \\_/ \\_/
12 11
     _   _
   _/ \\_/ \\
  / \\_/ \\_/
  \\_/ \\_/
 _/ \\_/ \\_
/ \\_/ \\_/ \\
\\_/ \\_/ \\_/
/ \\ / \\
\\_/ \\_/  _
/ \\_/ \\ / \\
\\_/ \\_/ \\_/
  \\_/
5 5
   _
 _/ \\
/ \\_/
\\_/ \\
  \\_/
5 5
  _
 / \\
/   \\
\\   /
 \\_/
6 7
 __
/  \\__
\\__/  \\
/  \\__/
\\__/  \\
   \\__/
12 16
 ____      ____
/    \\____/    \\
\\____/    \\____/
     \\____/
 ____      ____
/    \\    /    \\
\\____/    \\____/

 ____
/    \\____
\\____/    \\
     \\____/     '''

inp_str2 = '''1
5 5
   _
 _/ \\
/ \\_/
\\_/ \\
  \\_/'''
# алгоритм
# обобщенно:
# находим параметры 1 hex-а;
# начинаем "заполнять" всю карту (функция из 2.py не заменяет символы, а возвращает False/True);
# в цикле если все символы совпали - пропускаем, иначе рисуем на всех пробельных участках волны

def get_hex_param(map, n, m) -> tuple[int, int]:
    width = 0
    height = 0

    interest_x_idx = None
    interest_y_idx = None

    start_head_idx = None
    # Находим шапку -> width; координаты первой стенки
    y_idx = 0
    stop = False
    for row in map:
        x_idx = 0
        prev_cell = None
        for cell in row:
            if cell == "_":
                if prev_cell == " ":
                    interest_x_idx = x_idx - 1
                    interest_y_idx = y_idx + 1
                    start_head_idx = x_idx
                    width += 1
                elif prev_cell == "_":
                    width += 1
            elif cell == " ":
                if prev_cell == "_":
                    stop = True
                    break
            prev_cell = cell
            x_idx += 1
        else:
            if prev_cell == '_':
                stop = True
        if stop:
            break
        y_idx += 1

    # ищем высоту height
    height_is_uknown = True
    while height_is_uknown:
        if map[interest_y_idx][interest_x_idx] == "/":
            height += 1
            interest_x_idx -= 1
            interest_y_idx += 1
            if interest_x_idx == -1:
                # -> уперлись в стенку
                height_is_uknown = False
                break
        else:
            height_is_uknown = False
            break

    # если hex в первой строке не в четных ячейках
    isOdd = True # первая строка "нечетная"
    odd_valid_idx = [height]
    pre_index = height
    for i in range(m):
        v_idx = pre_index +  width * 2 + height * 2
        odd_valid_idx.append(v_idx)
    if start_head_idx not in odd_valid_idx:
        isOdd = False


    return width, height, isOdd

def drow_hex_v3(w, h) -> list:
    # шапка
    curFig = []
    header = ["x" for __ in range(h)]
    for __ in range(w):
        header.append("_")
    curFig.append(header)

    # body верх
    curMargin = h-1
    curDopWidth = 0
    for __ in range(h):
        row_body_top = ["x"] * curMargin
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
        row_body_bot = ["x"] * curMargin
        row_body_bot += "\\"
        row_body_bot += " " * curDopWidth
        row_body_bot += " " * w
        row_body_bot += "/"
        curFig.append(row_body_bot)
    # низ
    botom = ["x"] * (curMargin+1)
    botom += "\\"
    botom += ["_"] * (w)
    botom += "/"
    curFig.append(botom)
    return curFig

def check_hex(hex_data, map:list, w, h, x: int, y: int):
    # получаем шаблон hex
    x_start = x
    y_start = y

    it_is_hex = True
    # print(hex_data)
    for hex_row in hex_data:
        x_start = x
        for hex_cell in hex_row:
            # print(y_start, x_start, map[y_start][x_start], '==',  hex_cell)
            if hex_cell != 'x':
                if map[y_start][x_start] != hex_cell:

                    it_is_hex = False
                    break
            x_start += 1
        y_start += 1
        if not it_is_hex:
            break
    # print(it_is_hex)
    return it_is_hex

def input_hex(map:list, w, h, x: int, y: int, hex_data):
    xIds = x
    yIds = y
    for row in hex_data:
        xIds = x
        for cell in row:
            if map[yIds][xIds] == "~" and cell != 'x':

                map[yIds][xIds] = cell

            xIds += 1
        yIds += 1

def draw_map_v2(m, n, width, height, current_map, isOdd) -> list[list,...]:
    '''рисуем полную карту индексов - начало hex-ов '''
    hex_width = height+width+height
    # кол-во в нечетном ряду
    hex_in_odd_row = (m+width)//(hex_width+width)
    # отступ слева в четном ряду
    evenMargineX = width + height
    # кол-во в четном ряду
    hex_in_even_row = (m+width-evenMargineX)//(hex_width+width)
    # количество рядов
    row_amount = (n - 1 - height) // height

    index_map = [['~' for i in range(m)] for j in range(n)]

    stepX = width * 2 + height * 2
    stepY = height

    yIdx = 0
    isOdd = isOdd
    hex_data = drow_hex_v3(width, height)
    for row in range(row_amount):
        xIdx = 0
        if isOdd:
            for x in range(hex_in_odd_row):

                it_is_hex = check_hex(hex_data, current_map, width, height, xIdx, yIdx)
                if it_is_hex:
                    input_hex(index_map, width, height, xIdx, yIdx, hex_data)
                else:
                    index_map[yIdx][xIdx] = '0'
                xIdx += stepX
            isOdd = False
        else:
            xIdx += evenMargineX
            for x in range(hex_in_even_row):

                it_is_hex = check_hex(hex_data, current_map, width, height, xIdx, yIdx)
                if it_is_hex:
                    input_hex(index_map, width, height, xIdx, yIdx, hex_data)
                else:
                    index_map[yIdx][xIdx] = '0'
                xIdx += stepX
            isOdd = True
        yIdx += stepY

    return index_map


input_rows = inp_str.split('\n') # 1 заменить на stdin
case_amount = int(input_rows[0]) # 1 заменить на stdin

row_idx = 1 # убрать при stdin

for __ in range(case_amount):
    n, m = map(int, input_rows[row_idx].split()) # 2 заменить на stdin

    row_idx += 1 # убрать при stdin

    current_map = []
    for j in range(n):
        input_row = input_rows[row_idx] # 3 заменить на stdin
        # добавляем пробелы если их не было
        if len(input_row) < m:
            for __ in range(m - len(input_row)):
                input_row += ' '
        current_map.append(list(input_row))

        row_idx += 1 # убрать при stdin

    # print(current_map)
    width, height, isOdd= get_hex_param(current_map, n, m)
    water_map = draw_map_v2(m, n, width, height, current_map, isOdd)
    print(' INPUT ')
    for map_row in current_map:
        # print(map_row)
        print(''.join(map_row))
    print(' OUTPUT ')
    for map_row in water_map:

        print(''.join(map_row))

    print('w:', width, 'h:', height)
    print('\n\n')
