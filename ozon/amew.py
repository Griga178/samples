'''
    Кто мяукает?!
    логика + подсчет очков
'''

import sys

def fast_input():
	return sys.stdin.readline().rstrip("\r\n")

def fast_output(x):
    sys.stdout.write(str(x))

paragraphs = int(fast_input())
cases = []
for i in range(paragraphs):
    rows = int(fast_input())
    tempCase = []
    for row in range(rows):
        tempCase.append(fast_input())
    cases.append(tempCase)

def count_points(phrases: list) -> dict:
    """Считаем очки"""
    points = dict()

    for phrase in phrases:
        condition = phrase.split()
        lenght = len(condition)
        isAuthor = False
        authorName = None

        if condition[2] == 'am':
            heroName = condition[0][:-1] # удаляем двоеточее
            isAuthor = True # говорит про себя

            authorName = heroName
        else:
            heroName = condition[1]

            authorName = condition[0][:-1] # удаляем двоеточее

        if heroName not in points:
            points[heroName] = 0

        if authorName not in points:
            # про него никто не говорит, у него 0, а если 0 это макс -> выводим
            points[authorName] = 0

        if lenght == 4:
            # добавляем очко
            points[heroName] += 1
            if isAuthor:
                points[heroName] += 1
        elif lenght == 5:
            # отнимаем очко
            points[heroName] -= 1
        else:
            raise ValueError("Недопустимое значение length")

    return points

def analyze(points: dict, action: str) -> None:
    max_value = max(points.values())  # находим максимальное значение
    max_keys = [k for k, v in points.items() if v == max_value]  # выбираем ключи с этим значением
    max_keys.sort() # сортируем лексикографически

    for name in max_keys:
        row = f'{name} is {action}.\n'
        fast_output(row)

for case in cases:
    points = count_points(case)
    analyze(points, case[0].split()[-1][:-1])
