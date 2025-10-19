import "./fonts/ys-display/fonts.css";
import "./style.css";

import { initData } from "./data.js";
import { processFormData } from "./lib/utils.js";

import { initTable } from "./components/table.js";
import { initSearching } from "./components/searching.js";
import { initFiltering } from "./components/filtering.js";
import { initSorting } from "./components/sorting.js";
import { initPagination } from "./components/pagination.js";

// Исходные данные используемые в render()
const api = initData();

// инициализация таблицы с пагинацией
const sampleTable = initTable(
    {
        tableTemplate: "table",
        rowTemplate: "row",
        before: ["search", "header", "filter"],
        after: ["pagination"], // подключаем шаблон пагинации
    },
    render,
);

const applySearching = initSearching(
    sampleTable.search.elements.search, // элемент поиска (имя из шаблона search)
    "search", // имя поля в state (оно должно совпадать с атрибутом name у input)
);

const { applyFiltering, updateIndexes } = initFiltering(
    sampleTable.filter.elements,
);

const applySorting = initSorting([
    sampleTable.header.elements.sortByDate,
    sampleTable.header.elements.sortByTotal,
]);

// инициализация модуля пагинации
const { applyPagination, updatePagination } = initPagination(
    sampleTable.pagination.elements,
    (el, page, isCurrent) => {
        const input = el.querySelector("input");
        const label = el.querySelector("span");
        input.value = page;
        input.checked = isCurrent;
        label.textContent = page;
        return el;
    },
);

/**
 * Сбор и обработка полей из таблицы
 * @returns {Object}
 */
function collectState() {
    const state = processFormData(new FormData(sampleTable.container));

    const rowsPerPage = parseInt(state.rowsPerPage); // количество строк на страницу
    const page = parseInt(state.page ?? 1); // текущая страница

    return {
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
    let state = collectState(); // состояние полей из таблицы
    let query = {}; // здесь будут формироваться параметры запроса

    query = applySearching(query, state, action); // result заменяем на query
    query = applyFiltering(query, state, action); // result заменяем на query
    query = applySorting(query, state, action); // result заменяем на query
    query = applyPagination(query, state, action); // обновляем query

    const { total, items } = await api.getRecords(query); // запрашиваем данные с собранными параметрами

    updatePagination(total, query); // перерисовываем пагинатор
    sampleTable.render(items);
}

async function init() {
    const indexes = await api.getIndexes();

    updateIndexes(sampleTable.filter.elements, {
        searchBySeller: indexes.sellers,
    });
}

const appRoot = document.querySelector("#app");
appRoot.appendChild(sampleTable.container);

init().then(render);