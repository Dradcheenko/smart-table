// components/filtering.js
export function initFiltering(elements) {
    const updateIndexes = (indexes) => {
      // @todo: #4.1 — заполнить выпадающие списки опциями
      Object.keys(indexes) // Получаем ключи из объекта
        .forEach((elementName) => {
          // Перебираем по именам
          elements[elementName].append(
            // в каждый элемент добавляем опции
            ...Object.values(indexes[elementName]) // формируем массив имён, значений опций
              .map((name) => {
                // используйте name как значение и текстовое содержимое
                const option = document.createElement("option");
                option.value = name;
                option.textContent = name;
                return option;
              })
          );
        });
    };
  
    const applyFiltering = (query, state, action) => {
      // @todo: #4.2 — обработать очистку поля
      if (action && action.name === "clear") {
        // Находим input рядом с кнопкой
        const parent = action.parentElement;
        const input = parent.querySelector("input");
        if (input) {
          input.value = ""; // Сбрасываем значение поля
        }
        // Сбрасываем соответствующее поле в state
        const field = action.dataset.field;
        if (field) {
          state[field] = "";
        }
      }
  
      // @todo: #4.5 — формируем параметры фильтрации для сервера
      const filter = {};
      Object.keys(elements).forEach((key) => {
        if (elements[key]) {
          if (
            ["INPUT", "SELECT"].includes(elements[key].tagName) &&
            elements[key].value
          ) {
            // ищем поля ввода в фильтре с непустыми данными
            filter[`filter[${elements[key].name}]`] = elements[key].value; // чтобы сформировать в query вложенный объект фильтра
          }
        }
      });
  
      return Object.keys(filter).length
        ? Object.assign({}, query, filter)
        : query; // если в фильтре что-то добавилось, применим к запросу
    };
  
    return {
      updateIndexes,
      applyFiltering,
    };
    //ss
  }
  