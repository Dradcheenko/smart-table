import { makeIndex } from "./lib/utils.js";

const BASE_URL = "https://webinars.webdev.education-services.ru/sp7-api";

export function initData(sourceData) {
  // переменные для кеширования данных
  let sellers;
  let customers;
  let lastResult;
  let lastQuery;

  // функция для приведения строк в тот вид, который нужен нашей таблице
  const mapRecords = (data) =>
    data.map((item) => ({
      id: item.receipt_id,
      date: item.date,
      seller: sellers[item.seller_id],
      customer: customers[item.customer_id],
      total: item.total_amount,
    }));

  // функция получения индексов
  const getIndexes = async () => {
    if (!sellers || !customers) {
      // если индексы ещё не установлены, то делаем запросы
      [sellers, customers] = await Promise.all([
        // запрашиваем и деструктурируем в уже объявленные ранее переменные
        fetch(`${BASE_URL}/sellers`).then((res) => res.json()), // запрашиваем продавцов
        fetch(`${BASE_URL}/customers`).then((res) => res.json()), // запрашиваем покупателей
      ]);
    }

    return { sellers, customers };
  };

  // функция получения записей о продажах с сервера
  const getRecords = async (query, isUpdated = false) => {
    // Гарантируем сериализацию query в валидную строку для HTTP
    const qs = new URLSearchParams(query); // объект query преобразуем в поисковую строку [web:55][web:61]
    const nextQuery = qs.toString(); // строковое представление для кеш-ключа и запроса [web:55]

    if (lastQuery === nextQuery && !isUpdated) {
      // isUpdated параметр нужен, чтобы иметь возможность делать запрос без кеша
      return lastResult; // возвращаем кеш, если параметры не изменились [web:68][web:33]
    }

    // Выполняем запрос с query-параметрами
    const response = await fetch(`${BASE_URL}/records?${nextQuery}`); // стандартный fetch с query-строкой [web:66]
    const records = await response.json();

    lastQuery = nextQuery; // сохраняем для следующих запросов
    lastResult = {
      total: records.total,
      items: mapRecords(records.items),
    };

    return lastResult;
  };

  return {
    getIndexes,
    getRecords,
  };
}
