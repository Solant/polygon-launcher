import { Text, Window, hot, View, ProgressBar, Button as NativeButton } from '@nodegui/react-nodegui';
import { NativeElement, QFontDatabase, QMainWindow, QMouseEvent, WindowType } from '@nodegui/nodegui';
import React from 'react';
import { resolve } from 'path';
import open from 'open';
import { Button } from './components/button';
import { SocialButton } from './components/social-button';
import { downloadUpdates, findNewRemoteFiles, getLocalFiles, getRemoteFiles, getUpdateDownloadSize } from './updater';

QFontDatabase.addApplicationFont(resolve('dist', 'Metropolis-Medium.otf'));

interface Progress {
    file: string,
    currentIndex: number,
    total: number,
    progress: number,
}
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
            await downloadUpdates(updates, (arg) => {
                this.updateProgress({
                    file: arg.file,
                    currentIndex: arg.index.current,
                    total: arg.index.all,
                    progress: arg.progress,
                });
            });
            this.setState({...this.state, msg: `Обновление завершено`});
            this.updateProgress(undefined);
        }
    }

    updateProgress(payload: Progress | undefined) {
        this.setState({ ...this.state, progress: payload });
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
                styleSheet={'background-color: #181818;'}
            >
                <View styleSheet={'flex: 1; flex-direction: column; align-items: "center";'}>
                    <Text
                        styleSheet={'font-family: "Metropolis Medium"; font-size: 50px; color: white; margin-top: 20px;'}>
                        POLYGON
                    </Text>

                    <Text styleSheet={'height: 50px; color: white;'}>
                        {this.state.msg}
                    </Text>

                    {this.state.progress ? (
                        <View>
                            <Text styleSheet={'color: white;'}>{this.state.progress.file}</Text>
                            <Text styleSheet={'color: white;'}>
                                {`${this.state.progress.currentIndex} / ${this.state.progress.total}`}
                            </Text>
                            <ProgressBar value={this.state.progress.progress * 100}/>
                        </View>
                    ): (
                        <View/>
                    )}

                    <View styleSheet={'flex: 1; flex-direction: row;'}>
                        <Button icon={resolve('dist', 'play.png')} clicked={() => this.start()}/>
                        <Button icon={resolve('dist', 'update.png')} clicked={() => this.update()}/>
                        <Button icon={resolve('dist', 'quit.png')} clicked={() => process.exit(0)}/>
                    </View>

                    <View styleSheet={'flex: 1; flex-direction: row;'}>
                        <SocialButton icon={resolve('dist', 'tg.png')}
                                      clicked={() => open('https://t.me/polygon_online')}/>
                        <SocialButton icon={resolve('dist', 'vk.png')}
                                      clicked={() => open('https://vk.com/polygon_online')}/>
                    </View>

                    <NativeButton
                        text={'Все сломалось'}
                        flat={true}
                        styleSheet={'color: white; background-color: transparent;'}
                        on={{'clicked': () => open('https://github.com/Solant/polygon-launcher#troubleshooting')}}
                    />
                </View>
            </Window>
        );
    }
}

export default hot(App);
