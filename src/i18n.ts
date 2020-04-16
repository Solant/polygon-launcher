enum Locales {
    en = 'en',
    ru = 'ru',
}

interface Messages {
    help: string,
    updatesLog: string,
    updateInProgress: string,
    updateFinished: string,
    checkRemoteFiles: string,
    checkLocalFiles: string,
}

const messages: { [key in Locales]: Messages } = {
    [Locales.en]: {
        help: 'Help',
        updatesLog: '%0 new files found (%1)',
        updateInProgress: 'Downloading updates',
        updateFinished: 'Update completed',
        checkRemoteFiles: 'Checking new updates',
        checkLocalFiles: 'Checking local files',
    },
    [Locales.ru]: {
        help: 'Помощь',
        updatesLog: 'Найдено %0 новых файлов (%1)',
        updateInProgress: 'Выполняется обновление',
        updateFinished: 'Обновление завершено',
        checkRemoteFiles: 'Проверка обновлений',
        checkLocalFiles: 'Проверка файлов',
    },
};

function getLocale(a: string): Locales {
    const defaultLocale = Locales.en;

    switch (a) {
        case Locales.en:
            return Locales.en;
        case Locales.ru:
            return Locales.ru;
        default:
            return defaultLocale;
    }
}

export function useTranslation(langArg: string) {
    let lang = getLocale(langArg);

    function t(key: string, args?: string[]) {
        // @ts-ignore
        let msg = messages[lang][key];
        if (args) {
            args.forEach((value, index) => {
                msg = msg.replace(`%${index}`, value);
            });
        }
        return msg;
    }

    return {
        t,
    }
}
