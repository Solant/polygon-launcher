import { action, configure, observable } from 'mobx';
import React from 'react';

export class AppState {
    @observable
    progress: {
        files: { [key: string]: number },
        percentage: number,
    } | undefined = undefined;

    @action
    initProgress(files: { [key: string]: number }) {
        this.progress = {
            files,
            percentage: 0,
        };
    }

    @action
    updateProgress(payload: { file: string, progress: number, files: { [key: string]: number } } | undefined) {
        if (payload) {
            this.progress!.files[payload.file] = payload.progress;
            this.progress!.percentage = Object.values(this.progress!.files).reduce((c, p) => c + p, 0) / Object.values(this.progress!.files).length * 100;
        } else {
            this.progress = undefined;
        }
    }
}

configure({ enforceActions: "always" });

export const store = new AppState();
export const storeContext = React.createContext(store);
export const useStore = () => React.useContext(storeContext);
