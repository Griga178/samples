```markdown
# Управление виртуальным окружением Python

## Создание виртуального окружения

Убедитесь, что Python установлен (версии 3.7+). В терминале (командной строке) перейдите
в папку проекта и выполните:

```bash
python -m venv venv
```

- `venv` — стандартный модуль Python для создания виртуальных окружений.
- Второй `venv` — имя папки, в которой будет создано окружение. Обычно называют `venv` или `.venv`.

---

## Активация окружения

После создания окружение нужно активировать. Команды отличаются в зависимости от ОС.

### Windows (CMD)
```cmd
venv\Scripts\activate
```

### Windows (PowerShell)
```powershell
.\venv\Scripts\Activate.ps1
```
*Если возникает ошибка выполнения сценариев, выполните:*
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Linux / macOS (bash/zsh)
```bash
source venv/bin/activate
```

После активации в начале строки терминала появится `(venv)` — признак того, что вы внутри виртуальной среды.

---

## Установка зависимостей из requirements.txt

Если в проекте есть файл `requirements.txt` со списком необходимых пакетов, установите их одной командой:

```bash
pip install -r requirements.txt
```

**Создание requirements.txt** (если его нет):  
```bash
pip freeze > requirements.txt
```

---

## Проверка установленных пакетов

```bash
pip list
```

## Удаление всех установленных пакетов

```bash
pip freeze > requirements.txt
pip uninstall -y -r requirements.txt
```

---

## Деактивация окружения

Чтобы выйти из виртуального окружения:

```bash
deactivate
```

---

## Пример полного цикла

```bash
cd my_project
python -m venv venv
source venv/bin/activate        # Linux/macOS
# или venv\Scripts\activate      # Windows
pip install -r requirements.txt
# ... работа с проектом
deactivate
```

---

## Дополнительные советы

- Не включайте папку `venv` в систему контроля версий (Git). Добавьте `venv/` в `.gitignore`.
- Если у вас несколько версий Python, укажите конкретную: `python3.9 -m venv venv`.
- Для работы с Jupyter: установите `ipykernel` и создайте ядро:
  ```bash
  pip install ipykernel
  python -m ipykernel install --user --name=myenv
  ```


```
