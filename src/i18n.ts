const messages = {
    en: {
        help: 'Help',
        checkInProgress: 'Checking for updates',
        updatesLog: '%0 new files found (%1)',
        updateInProgress: 'Downloading updates',
        updateFinished: 'Update completed',
    },
    ru: {
        help: 'Помощь',
        checkInProgress: 'Проверка обновлений',
        updatesLog: 'Найдено %0 новых файлов (%1)',
        updateInProgress: 'Выполняется обновление',
        updateFinished: 'Обновление завершено',
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
