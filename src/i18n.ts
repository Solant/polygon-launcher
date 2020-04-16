enum Locales {
    en = 'en',
    ru = 'ru',
}

interface Messages {
    help: string,
    checkInProgress: string,
    updatesLog: string,
    updateInProgress: string,
    updateFinished: string,
    checkRemoteFiles: string,
    checkLocalFiles: string,
}

const messages: { [key in Locales]: Messages } = {
    [Locales.en]: {
        help: 'Help',
        checkInProgress: 'Checking for updates',
        updatesLog: '%0 new files found (%1)',
        updateInProgress: 'Downloading updates',
        updateFinished: 'Update completed',
        checkRemoteFiles: 'Checking new updates',
        checkLocalFiles: 'Checking local files',
    },
    [Locales.ru]: {
        help: 'Помощь',
        checkInProgress: 'Проверка обновлений',
        updatesLog: 'Найдено %0 новых файлов (%1)',
        updateInProgress: 'Выполняется обновление',
        updateFinished: 'Обновление завершено',
        checkRemoteFiles: 'Проверка обновлений',
        checkLocalFiles: 'Проверка файлов',
    },
};

export function useTranslation(lang: string) {
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
