import "./fonts/ys-display/fonts.css";
import "./style.css";

import { data as sourceData } from "./data/dataset_1.js";

import { initData } from "./data.js";
import { processFormData } from "./lib/utils.js";

import { initTable } from "./components/table.js";
import { initPagination } from "./components/pagination.js";
// @todo: подключение
import { initSorting } from "./components/sorting.js"; // Добавляем импорт функции сортировки
import { initFiltering } from "./components/filtering.js"; // Раскомментировали импорт фильтрации
import { initSearching } from "./components/searching.js";

// Инициализируем API
const api = initData(sourceData);

/**
 * Сбор и обработка полей из таблицы
 * @returns {Object}
 */
function collectState() {
  const state = processFormData(new FormData(sampleTable.container));

  // Приводим значения к числам для удобства расчетов
  const rowsPerPage = parseInt(state.rowsPerPage); // приведём количество страниц к числу
  const page = parseInt(state.page ?? 1); // номер страницы по умолчанию 1 и тоже число

  return {
    // расширьте существующий return вот так
    ...state,
    rowsPerPage,
    page,
  };
}

/**
 * Перерисовка состояния таблицы при любых изменениях
 * @param {HTMLButtonElement?} action
 */
async function render(action) {
  try {
    let state = collectState(); // состояние полей из таблицы
    let query = {}; // здесь будут формироваться параметры запроса

    // Включаем поиск перед фильтрами, затем сортировка, потом пагинация
    query = applySearching(query, state, action); // ПОИСК
    query = applyFiltering(query, state, action); // ФИЛЬТРАЦИЯ
    query = applySorting(query, state, action); // СОРТИРОВКА
    query = applyPagination(query, state, action); // ПАГИНАЦИЯ

    // Получаем данные с сервера
    const { total, items } = await api.getRecords(query);

    // Нормализуем текущую страницу, если она вышла за пределы после изменения total
    const limit = query.limit ?? state.rowsPerPage;
    const lastPage = Math.max(1, Math.ceil((total ?? 0) / (limit || 1)));
    const currentPage = Math.max(1, Math.min(query.page ?? state.page ?? 1, lastPage));

    if ((query.page ?? state.page ?? 1) !== currentPage) {
      const fixed = { ...query, page: currentPage, limit };
      updatePagination(total, fixed);
      const retry = await api.getRecords(fixed);
      sampleTable.render(retry.items);
      return;
    }

    updatePagination(total, { ...query, page: currentPage, limit });
    sampleTable.render(items);
  } catch (e) {
    // Акуратный фолбэк при ошибке (сбои сети и т.п.)
    const state = collectState();
    updatePagination(0, { page: 1, limit: state.rowsPerPage });
    sampleTable.render([]);
    // Опционально: здесь можно дернуть UI-уведомление, не меняя контрактов
  }
}

const sampleTable = initTable(
  {
    tableTemplate: "table",
    rowTemplate: "row",
    before: ["search", "header", "filter"],
    after: ["pagination"],
  },
  render
);

// @todo: инициализация
const applySearching = initSearching("search");

// Изменяем инициализацию пагинации
const { applyPagination, updatePagination } = initPagination(
  sampleTable.pagination.elements, // передаём сюда элементы пагинации, найденные в шаблоне
  (el, page, isCurrent) => {
    // и колбэк, чтобы заполнять кнопки страниц данными
    const input = el.querySelector("input");
    const label = el.querySelector("span");
    input.value = page;
    input.checked = isCurrent;
    label.textContent = page;
    return el;
  }
);

// Инициализируем сортировку
const applySorting = initSorting([
  // Нам нужно передать сюда массив элементов, которые вызывают сортировку, чтобы изменять их визуальное представление
  sampleTable.header.elements.sortByDate,
  sampleTable.header.elements.sortByTotal,
]);

// @todo: инициализация фильтрации
const { applyFiltering, updateIndexes } = initFiltering(
  sampleTable.filter.elements
);

const appRoot = document.querySelector("#app");
appRoot.appendChild(sampleTable.container);

// Асинхронная функция инициализации
async function init() {
  // Получаем индексы
  const indexes = await api.getIndexes();

  // Обновляем индексы фильтрации
  updateIndexes({
    searchBySeller: indexes.sellers,
  });

  return indexes;
}

// Запускаем инициализацию и затем рендер
init().then(render);
