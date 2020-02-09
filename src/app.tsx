import { Text, Window, hot, View, ProgressBar, Button as NativeButton } from '@nodegui/react-nodegui';
import { NativeElement, QFontDatabase, QMainWindow, QMouseEvent, QProgressBar, WindowType } from '@nodegui/nodegui';
import React from 'react';
import { resolve } from 'path';
import open from 'open';
import { Button } from './components/button';
import { SocialButton } from './components/social-button';
import { downloadUpdates, findNewRemoteFiles, getLocalFiles, getRemoteFiles, getUpdateDownloadSize } from './updater';
import { nativeErrorHandler } from './errorHandler';
import { create, units } from 'nodegui-stylesheet';

QFontDatabase.addApplicationFont(resolve('dist', 'Metropolis-Medium.otf'));
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

class App extends React.Component<any, { x: number, y: number, msg: string, progress: Progress | undefined}> {
    private readonly windowRef: React.RefObject<QMainWindow>;

    constructor(props: any) {
        super(props);
        this.state = { x: 0, y: 0, msg: '', progress: undefined };
        this.windowRef = React.createRef<QMainWindow>();
    }

    start() {
        open(resolve('WindowsNoEditor', 'Polygon.exe'));
    }

    async update() {
        this.setState({...this.state, msg: 'Проверка обновлений'});

        const [local, remote] = await Promise.all([getLocalFiles(), getRemoteFiles()]);
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
            await downloadUpdates(updates, (arg) => {
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
                            <Button icon={resolve('dist', 'play.png')} clicked={() => this.start()}/>
                            <Button icon={resolve('dist', 'update.png')} clicked={() => this.update()}/>
                            <Button icon={resolve('dist', 'quit.png')} clicked={() => process.exit(0)}/>
                        </View>
                    </View>
                    <View>
                        <View style={s.socialButtons}>
                            <SocialButton icon={resolve('dist', 'tg.png')}
                                          clicked={() => open('https://t.me/polygon_online')}/>
                            <SocialButton icon={resolve('dist', 'vk.png')}
                                          clicked={() => open('https://vk.com/polygon_online')}/>
                        </View>
                    </View>
                    <NativeButton
                        text={'Помощь'}
                        flat={true}
                        style={s.help}
                        on={{'clicked': () => open('https://github.com/Solant/polygon-launcher#troubleshooting')}}
                    />
                </View>
            </Window>
        );
    }
}

export default hot(App);
