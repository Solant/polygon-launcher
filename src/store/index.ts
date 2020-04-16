import { action, configure, observable } from 'mobx';
import React from 'react';
import { sync } from 'os-locale';
import { existsSync } from 'fs';
import { resolve } from 'path';

function executableExists() {
    return existsSync(resolve('WindowsNoEditor', 'Polygon.exe'));
}

function getSystemLocale() {
    return sync().split('-')[0];
}

export class AppState {
    @observable
    locale: string = getSystemLocale();

    @observable
    message: string = '';

    @observable
    progress: {
        files: { [key: string]: number },
        percentage: number,
    } | undefined = undefined;

    @observable
    progress2: number | undefined;

    @observable
    launchAvailable: boolean = executableExists();

    @action
    updateProgress2(value: number | undefined) {
        this.progress2 = value;
    }

    @action
    updateMessage(arg: string) {
        this.message = arg;
    }

    @action
    updateFinished(message: string) {
        this.launchAvailable = true;
        this.progress = undefined;
        this.message = message;
    }

    @action
    initProgress(files: { [key: string]: number }) {
        this.progress = {
            files,
            percentage: 0,
        };
    }

    @action
    updateProgress(payload: { file: string, progress: number, files: { [key: string]: number } }) {
        this.progress!.files[payload.file] = payload.progress;
        this.progress!.percentage = Object.values(this.progress!.files).reduce((c, p) => c + p, 0) / Object.values(this.progress!.files).length * 100;
    }
}

configure({ enforceActions: "always" });

export const store = new AppState();
export const storeContext = React.createContext(store);
export const useStore = () => React.useContext(storeContext);
