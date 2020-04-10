import { Button as NativeButton, hot, ProgressBar, Text, View, Window } from '@nodegui/react-nodegui';
import {
    ButtonRole,
    NativeElement,
    QFontDatabase,
    QMainWindow,
    QMessageBox,
    QMouseEvent,
    QPushButton,
    WindowType
} from '@nodegui/nodegui';
import React, { FunctionComponent, MutableRefObject, RefObject, useRef, useState } from 'react';
import { resolve } from 'path';
import open from 'open';
import { Button } from './components/button';
import { SocialButton } from './components/social-button';
import { downloadUpdates, findNewRemoteFiles, getLocalFiles, getRemoteFiles, getUpdateDownloadSize } from './updater';
import { nativeErrorHandler } from './errorHandler';
import { create, units } from 'nodegui-stylesheet';
import fetch from 'node-fetch';
import semver from 'semver';
import os from 'os';
import font from '../assets/Metropolis-Medium.otf';
import playIcon from '../assets/play.png';
import updateIcon from '../assets/update.png';
import quitIcon from '../assets/quit.png';
import vkIcon from '../assets/vk.png';
import tgIcon from '../assets/tg.png';
import discordIcon from '../assets/discord.png';
import useDrag from './useDrag';

const cpus = os.cpus().length;

QFontDatabase.addApplicationFont(font);
process.on('uncaughtException', error => nativeErrorHandler(error.message, error.stack || ''));
process.on('unhandledRejection', (reason, promise) => {
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

interface Progress {
    percentage: number,
    files: {
        [key: string]: number,
    },
}

const s = create({
    root: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    logo: {
        fontFamily: 'Metropolis Medium',
        fontSize: units(50, 'px'),
        fontWeight: 'bold',
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
    help: {
        backgroundColor: 'transparent',
        color: 'white',
    }
});

const app: FunctionComponent = () => {
    const [state, setState] = useState<{ msg: string, progress: Progress | undefined }>({ msg: '', progress: undefined });
    const windowRef = useRef(undefined);
    // @ts-ignore
    const handleMouseEvent = useDrag(windowRef);

    function start() {
        open(resolve('WindowsNoEditor', 'Polygon.exe'));
    }

    function updateProgress(payload: { file: string, progress: number, files: { [key: string]: number } } | undefined) {
        if (payload) {
            const n = {
                ...(state.progress?.files ?? payload.files),
                [payload.file]: payload.progress
            };
            setState({
                ...state,
                progress: {
                    files: n,
                    percentage: Object.values(n).reduce((c, p) => c + p, 0) / Object.values(n).length * 100,
                },
            });
        } else {
            setState({ ...state, progress: undefined });
        }
    }

    async function update() {
        setState({...state, msg: 'Проверка обновлений'});

        const [local, remote] = await Promise.all([getLocalFiles(cpus), getRemoteFiles(cpus)]);
        const updates = findNewRemoteFiles(local, remote);

        let text = `Найдено ${updates.length} новых файлов (${getUpdateDownloadSize(updates)})`;
        if (updates.length) {
            text += '\nВыполняется обновление';
        }
        setState({...state, msg: text});
        if (updates.length) {
            function last<T>(a: Array<T>): T {
                return a[a.length - 1];
            }

            const files = updates
                .map(v => last(v.path.split('/')))
                // @ts-ignore
                .reduce((p, c) => { p[c] = 0; return p; }, {});

            setState({
                ...state,
                progress: {
                    files,
                    percentage: 0,
                }
            });
            await downloadUpdates(updates, cpus, (arg) => {
                updateProgress({
                    file: arg.file,
                    progress: arg.progress,
                    files,
                });
            });
            setState({...state, msg: `Обновление завершено`});
            updateProgress(undefined);
        }
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
                {state.progress &&
                <ProgressBar
                    styleSheet={stylesheet}
                    value={state.progress!.percentage}
                />
                }
                <Text
                    style={s.logo}
                >
                    POLYGON
                </Text>
                <Text style={s.message}>
                    {state.msg}
                </Text>
                <View>
                    <View style={s.actionButtons}>
                        <Button icon={playIcon} clicked={() => start()}/>
                        <Button icon={updateIcon} clicked={() => update()}/>
                        <Button icon={quitIcon} clicked={() => process.exit(0)}/>
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
                    text={`Помощь (v${VERSION})`}
                    flat={true}
                    style={s.help}
                    on={{'clicked': () => open('https://github.com/Solant/polygon-launcher#troubleshooting')}}
                />
            </View>
        </Window>
    );
}

class App extends React.Component<any, { x: number, y: number, msg: string, progress: Progress | undefined}> {
    private readonly windowRef: React.RefObject<QMainWindow>;

    constructor(props: any) {
        super(props);
        this.state = { x: 0, y: 0, msg: '', progress: undefined };
        this.windowRef = React.createRef<QMainWindow>();

        function newVersionAvailable(remoteVersion: string): boolean {
            return semver.gt(remoteVersion, VERSION);
        }

        fetch('https://api.github.com/repos/Solant/polygon-launcher/releases/latest', {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
            }
        })
            .then(r => r.json())
            .then(data => {
                if (data.tag_name && newVersionAvailable(data.tag_name)) {
                    const dialog = new QMessageBox();

                    const downloadButton = new QPushButton(dialog);
                    downloadButton.setText('Обновить сейчас');
                    downloadButton.addEventListener('clicked', () => {
                        const installer = data.assets.find((a: any) => a.name === 'installer.exe');
                        if (installer) {
                            open(installer.browser_download_url);
                        } else {
                            nativeErrorHandler(`Релиз ${data.tag_name} оказался без инсталлера, сообщите об этой проблеме по кнопке "Помощь"`, '');
                        }
                    });

                    const closeButton = new QPushButton(dialog);
                    closeButton.setText('Закрыть');
                    closeButton.addEventListener('clicked', () => {
                        dialog.close();
                    });

                    dialog.setWindowTitle('Доступно обновление');
                    dialog.setText(`Доступна новая версия ${data.tag_name}`);
                    dialog.addButton(downloadButton, ButtonRole.AcceptRole);
                    dialog.addButton(closeButton, ButtonRole.RejectRole);
                    dialog.show();
                }
            });
    }

    start() {
        open(resolve('WindowsNoEditor', 'Polygon.exe'));
    }

    async update() {
        this.setState({...this.state, msg: 'Проверка обновлений'});

        const [local, remote] = await Promise.all([getLocalFiles(cpus), getRemoteFiles(cpus)]);
        const updates = findNewRemoteFiles(local, remote);

        let text = `Найдено ${updates.length} новых файлов (${getUpdateDownloadSize(updates)})`;
        if (updates.length) {
            text += '\nВыполняется обновление';
        }
        this.setState({...this.state, msg: text});
        if (updates.length) {
            function last<T>(a: Array<T>): T {
                return a[a.length - 1];
            }

            this.setState({
                ...this.state,
                progress: {
                    files: updates
                        .map(v => last(v.path.split('/')))
                        // @ts-ignore
                        .reduce((p, c) => { p[c] = 0; return p; }, {}),
                    percentage: 0,
                }
            });
            await downloadUpdates(updates, cpus, (arg) => {
                this.updateProgress({
                    file: arg.file,
                    progress: arg.progress,
                });
            });
            this.setState({...this.state, msg: `Обновление завершено`});
            this.updateProgress(undefined);
        }
    }

    updateProgress(payload: { file: string, progress: number } | undefined) {
        if (payload) {
            const n = {
                ...this.state.progress!.files,
                [payload!.file]: payload!.progress
            };
            this.setState({
                progress: {
                    files: n,
                    percentage: Object.values(n).reduce((c, p) => c + p, 0) / Object.values(n).length * 100,
                },
            });
        } else {
            this.setState({ progress: undefined });
        }
    }

    handleMove(e?: NativeElement) {
        if (!e) {
            return;
        }
        const event = new QMouseEvent(e);
        this.windowRef.current!.move(event.globalX() - this.state.x, event.globalY() - this.state.y);

    }

    handleClick(e?: NativeElement) {
        if (!e) {
            return;
        }
        const event = new QMouseEvent(e);
        this.setState({ x: event.x(), y: event.y() });
    }

    render() {
        return (
            <Window
                ref={this.windowRef}
                windowFlags={{ [WindowType.FramelessWindowHint]: true }}
                on={{ 'MouseMove': e => this.handleMove(e), 'MouseButtonPress': e => this.handleClick(e) }}
                windowTitle="Polygon Launcher"
                size={{ width: 400, height: 400, fixed: true }}
                style={'background-color: #181818;'}
            >
                <View style={s.root}>
                    {this.state.progress &&
                        <ProgressBar
                            styleSheet={stylesheet}
                            value={this.state.progress!.percentage}
                        />
                    }
                    <Text
                        style={s.logo}
                    >
                        POLYGON
                    </Text>
                    <Text style={s.message}>
                        {this.state.msg}
                    </Text>
                    <View>
                        <View style={s.actionButtons}>
                            <Button icon={playIcon} clicked={() => this.start()}/>
                            <Button icon={updateIcon} clicked={() => this.update()}/>
                            <Button icon={quitIcon} clicked={() => process.exit(0)}/>
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
                        text={`Помощь (v${VERSION})`}
                        flat={true}
                        style={s.help}
                        on={{'clicked': () => open('https://github.com/Solant/polygon-launcher#troubleshooting')}}
                    />
                </View>
            </Window>
        );
    }
}

export default hot(app);
