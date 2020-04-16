import { Button as NativeButton, hot, ProgressBar, Text, View, Window } from '@nodegui/react-nodegui';
import {
    CursorShape,
    QFontDatabase, QMainWindow, WindowState,
    WindowType,
} from '@nodegui/nodegui';
import React, { FunctionComponent, MutableRefObject, useRef } from 'react';
import { observer } from 'mobx-react';
import 'mobx-react/batchingOptOut';
import { resolve } from 'path';
import open from 'open';
import { ToolbarButton } from './components/toolbarButton';
import { Button } from './components/button';
import { SocialButton } from './components/social-button';
import {
    getRemoteFilesNew,
    downloadUpdates,
    findNewRemoteFiles,
    getLocalFiles,
    getRemoteFiles,
    getUpdateDownloadSize,
    getLocalFiles2, downloadUpdates2,
} from './updater';
import { nativeErrorHandler } from './errorHandler';
import { create } from 'nodegui-stylesheet';
import os from 'os';
import font from '../assets/Metropolis-Medium.otf';
import playIcon from '../assets/play.png';
import updateIcon from '../assets/update.png';
import vkIcon from '../assets/vk.png';
import tgIcon from '../assets/tg.png';
import discordIcon from '../assets/discord.png';
import closeIcon from '../assets/close-outline.svg';
import minimizeIcon from '../assets/remove-outline.svg';
import useDrag from './useDrag';
import { store, storeContext, useStore } from './store';
import { useCheckUpdates } from './useCheckUpdates';
import { useTranslation } from './i18n';

const cpus = os.cpus().length;

QFontDatabase.addApplicationFont(font);
process.on('uncaughtException', error => nativeErrorHandler(error.message, error.stack || ''));
process.on('unhandledRejection', (reason) => {
    if (reason instanceof Error) {
        nativeErrorHandler(reason.message, reason.stack || '');
    } else {
        nativeErrorHandler('Unhandled promise rejection', JSON.stringify(reason));
    }
});

const stylesheet = `
QProgressBar {
    background-color: transparent;
    border: 0;
    width: 400px;
    height: 2px;
    color: white;
    font-size: 1px;
    position: absolute;
    top: 0;
}
QProgressBar::chunk {
    background-color: white;
}
`;

const s = create({
    root: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    logo: {
        fontFamily: 'Metropolis Medium',
        fontSize: 50,
        color: 'white',
        marginTop: 20,
    },
    message: {
        color: 'white',
        height: 50,
    },
    actionButtons: {
        flex: 1,
        flexDirection: 'row',
    },
    socialButtons: {
        flex: 1,
        flexDirection: 'row',
    },
    toolbar: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    help: {
        backgroundColor: 'transparent',
        color: 'white',
    }
});

const App: FunctionComponent = observer(() => {
    const store = useStore();
    useCheckUpdates();
    const windowRef = useRef<QMainWindow | undefined>(undefined);
    const handleMouseEvent = useDrag(windowRef as MutableRefObject<QMainWindow>);
    const { t } = useTranslation(store.locale);

    function start() {
        open(resolve('WindowsNoEditor', 'Polygon.exe'));
    }

    async function update() {
        store.updateMessage(t('checkInProgress'));

        const [local, remote] = await Promise.all([getLocalFiles(cpus), getRemoteFiles(cpus)]);
        const updates = findNewRemoteFiles(local, remote);

        let text = t('updatesLog', [updates.length.toString(), getUpdateDownloadSize(updates)]);
        if (updates.length) {
            text += '\n' + t('updateInProgress');
        }
        store.updateMessage(text);
        if (updates.length) {
            function last<T>(a: Array<T>): T {
                return a[a.length - 1];
            }

            const files = updates
                .map(v => last(v.path.split('/')))
                // @ts-ignore
                .reduce((p, c) => { p[c] = 0; return p; }, {});

            store.initProgress(files);
            await downloadUpdates(updates, cpus, (arg) => {
                store.updateProgress({
                    file: arg.file,
                    progress: arg.progress,
                    files,
                });
            });
            store.updateFinished(t('updateFinished'));
        }
    }

    async function update2() {
        const updateProgress = (value: number) => store.updateProgress2(value);

        store.updateMessage(t('checkRemoteFiles'));
        const remote = await getRemoteFilesNew(updateProgress, cpus);

        store.updateMessage(t('checkLocalFiles'));
        const local = await getLocalFiles2(updateProgress, cpus);

        const updates = findNewRemoteFiles(local, remote);
        let text = t('updatesLog', [updates.length.toString(), getUpdateDownloadSize(updates)]);
        if (updates.length) {
            text += '\n' + t('updateInProgress');
        }
        store.updateMessage(text);

        await downloadUpdates2(updates, updateProgress, cpus);
        store.updateFinished(t('updateFinished'));
    }

    return (
        <Window
            ref={windowRef}
            windowFlags={{ [WindowType.FramelessWindowHint]: true }}
            on={{ 'MouseMove': handleMouseEvent, 'MouseButtonPress': handleMouseEvent }}
            windowTitle="Polygon Launcher"
            size={{ width: 400, height: 400, fixed: true }}
            style={'background-color: #181818;'}
        >
            <View style={s.root}>
                {(store.progress2 && store.progress2 !== 1) &&
                <ProgressBar
                    styleSheet={stylesheet}
                    value={store.progress2 * 100}
                />
                }
                <View style={'width: 388px;'}>
                    <View style={s.toolbar}>
                        <ToolbarButton
                            clicked={() => windowRef.current!.setWindowState(WindowState.WindowMinimized)}
                            icon={minimizeIcon} styleSheet={'margin-right: 8px;'}
                        />
                        <ToolbarButton clicked={() => process.exit(0)} icon={closeIcon}/>
                    </View>
                </View>
                <Text
                    style={s.logo}
                >
                    POLYGON
                </Text>
                <Text style={s.message}>
                    {store.message}
                </Text>
                <View>
                    <View style={s.actionButtons}>
                        {store.launchAvailable && <Button icon={playIcon} clicked={() => start()}/>}
                        <Button icon={updateIcon} clicked={() => update2()}/>
                    </View>
                </View>
                <View>
                    <View style={s.socialButtons}>
                        <SocialButton icon={tgIcon}
                                      clicked={() => open('https://t.me/polygon_online')}/>
                        <SocialButton icon={discordIcon}
                                      clicked={() => open('https://discordapp.com/invite/tc9ayWK')}/>
                        <SocialButton icon={vkIcon}
                                      clicked={() => open('https://vk.com/polygon_online')}/>
                    </View>
                </View>
                <NativeButton
                    cursor={CursorShape.PointingHandCursor}
                    text={`${t('help')} (v${VERSION})`}
                    flat={true}
                    style={s.help}
                    on={{'clicked': () => open('https://github.com/Solant/polygon-launcher#troubleshooting')}}
                />
            </View>
        </Window>
    );
});

const wrapped: FunctionComponent = () => {
    return (
        <storeContext.Provider value={store}>
            <App/>
        </storeContext.Provider>
    );
};

export default hot(wrapped);
