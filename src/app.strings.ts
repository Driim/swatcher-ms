export const MESSAGE_TOO_SHORT = 'Слишком короткий запрос, попробуйте другой';
export const MESSAGE_REMOVE_USER = 'Что ж, пока!';
export const MESSAGE_OK = 'Ok!';
export const MESSAGE_ADD_SERIAL = 'Добавить';
export const MESSAGE_NO_THANKS = 'Нет, не надо';
export const MESSAGE_SEND_ALIAS = 'Другие названия';
export const MESSAGE_SEND_COUNTRY = 'Страна';
export const MESSAGE_SEND_GENRE = 'Жанр';
export const MESSAGE_SEND_SEASONS = 'Количество сезонов';
export const MESSAGE_FIND_ALL = 'Какой добавить?';
export const MESSAGE_LIST_REMOVE = 'Удалить';
export const MESSAGE_LIST_MESSAGE = 'Вот список сериалов на которые вы подписаны!';
export const MESSAGE_SUBS_VOICEOVER = 'В озвучке';
export const MESSAGE_SUBS_MESSAGE = 'Теперь вы подписаны на сериал:';
export const MESSAGE_SUBS_ENOUTH = 'Достаточно озвучек';
export const MESSAGE_SUBS_ALL = 'В любой озвучке';
export const MESSAGE_VOICE_ADD = 'Добавили озвучку';
export const MESSAGE_SUBS_MESSAGE_PAYED = 'Выберете интересующие вас варианты озвучки сериала';
export const MESSAGE_UNSUBSCRIBE = (serial: string): string =>
  `Вы отписались от сериала: ${serial}`;
export const MESSAGE_FIND_EXT = (count: number): string =>
  `Я много нашел сериалов(${count})!
  Выдаю вам самые популярные из них. 
  Если тут нет искомого сериала, то уточните запрос.`;
export const MESSAGE_CREATE_USER = (
  username: string,
): string => `${username} вы были зарегистрированны в системе,
теперь вам нужно добавить отслеживаемые вами сериалы.
Просто введите название интересующего вас сериала.
Бот не предоставляет возможности смотреть сериалы, только оповещает о выходе серий!
Подсказку по командам можно получить так: /help
Все вопросы вы можете задать здесь: https://t.me/swatcher_group_origin`;

export const MESSAGE_HELP = `Здравствуйте! Я бот призванный помочь вам отслеживать выход новых серий любимых сериалов в русской озвучке!\n
Просто введите название сериала что бы его найти и добавить. Если есть вопросы задавайте их в группе https://t.me/swatcher_group_origin\n
/start          - начало работы, регистрация в системе
/stop            - удаление из системы
Добавить [name]  - добавить сериал в отслеживаемые
Удалить [name]  - удалить сериал из отслеживаемые
Список           - список отслеживаемых сериалов
/help           - справочник команд \n\n`;

export const MESSAGE_ERROR_USER_NOT_FOUND = `К сожалению я не нашел вас в своей базе данных, пожалуйста, отправьте боту команду /start.
После этого повторите свой запрос`;

export const MESSAGE_ERROR_BAD_REQUEST = 'К сожалению я не могу выполнить команду';
export const MESSAGE_ERROR_NOTHING_FOUND = 'Я не смог ничего найти по запросу';
export const MESSAGE_ERROR_LIMIT_EXCEED = `Вы израсходовали бесплатное количество подписок,
что бы иметь возможность подписываться на большее количество сериалов
необходимо отправить 199р(можно и больше) на Яндекс-кошелек: https://money.yandex.ru/to/410011002876744/149
 , обязательно укажите этот код в комментарии к переводу в Яндексе `;
