// Интерфес -> html.css
// Контейнер: цвет фона - и блока настроек
const bgColor = "#333"
// Все блоки: цвет фона и границ
const divColor = "#FFFFFF"
const divBordColor = "#007BFF"
// Кнопки: цвет фона и текста
const btnColor = "#28A745"
const btnTextColor = "#333333"
// Таблица: цвет фона и текста
const tblColor = "#FAFAFA"
const tblTextColor = "#333333"
// Таблица-Заголовок: цвет фона и текста
const tblThColor = "#007BFF"
const tblThTextColor = "#FFFFFF"

// Игра -> Game -> canvas
const colorSchemeCanvas = {
  crcl: {
    initial: "rgba(0, 0, 255, 0.1)",     // первая отрисовка
    hover: "#FF5733",                    // круг на который надо навести мышь
    readyToStart: "#28A745",             // навели, готов к старту
    inMotion: "grey",                    // пошло движение
    finish: "#0056B3",                   // дошли до последнего круга
    success: "green",                    // не попал в цель
    errorMiss: "red",                    // не попал в цель
    errorDeviation: "orange",            // отклонение от курса
  },
  back: {
    welcome: "#ccc",                      // фон bg перед стартом
    gameStart: "#bfbfbf",                 // фон bg во время игры
    roundEnded: "#adacac",                // фон bg закончен раунд
    gameStopped: "#4b4b4b",               // фон bg закончена игра
    exit: "#252525",           // фон bg во время выхода из игры
    exitText: "white",                     // цвет текста во время выхода из игры
  }
};

const colorSchemeTemp = [
  {
    searchBy: "selector",
    name: ".container",
    colors: {
    backgroundColor: bgColor,
    }},{
  searchBy: "selector",
  name: "#settingsWindow",
  colors: {
    backgroundColor: bgColor,
    }}, {
    searchBy: "selector",
    name: "#gameContainer",
    colors: {
      backgroundColor: divBordColor,
    }
  },  {
    searchBy: "selector",
    name: "#gameMenu",
    colors: {
      backgroundColor: divColor,
      borderTopColor: divBordColor,
    }
  },  {
    searchBy: "selector",
    name: "#scoreBoard",
    colors: {
      backgroundColor: divColor,
      borderLeftColor: divBordColor,
    }
  },  {
    searchBy: "selector",
    name: "table",
    colors: {
      backgroundColor: tblColor,
      color: tblTextColor,
    }
  },  {
    searchBy: "selector",
    name: "th",
    colors: {
      backgroundColor: tblThColor,
      color: tblThTextColor,
    }
  },  {
    searchBy: "selector",
    name: ".button",
    colors: {
      backgroundColor: btnColor,
      color: btnTextColor,
    }
  },
];

function updateStyles(element) {
  let targetElement;
  if (element.searchBy === "selector") {
    targetElement = document.querySelectorAll(`${element.name}`);
  }

  if (targetElement instanceof NodeList) {
    targetElement.forEach((nodeElement) => {

      // Проверяем, есть ли у элемента свойство colors
      if (element.colors) {
          for (const [key, value] of Object.entries(element.colors)) {
              nodeElement.style[key] = value; // Устанавливаем стиль
          }
      }
    })
  } else {
    console.log("Элемент не найден", element.name, element.searchBy);
  }
}
