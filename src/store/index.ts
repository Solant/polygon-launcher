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
    progress: number | undefined;

    @observable
    launchAvailable: boolean = executableExists();

    @action
    updateProgress(value: number | undefined) {
        this.progress = value;
    }

    @action
    updateMessage(arg: string) {
        this.message = arg;
    }

    @action
    updateFinished(message: string) {
        this.launchAvailable = true;
        this.message = message;
    }
}

configure({ enforceActions: "always" });

export const store = new AppState();
export const storeContext = React.createContext(store);
export const useStore = () => React.useContext(storeContext);
