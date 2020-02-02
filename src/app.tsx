import { Text, Window, hot, View } from '@nodegui/react-nodegui';
import { NativeElement, QFontDatabase, QMainWindow, QMouseEvent, WindowType } from '@nodegui/nodegui';
import React from 'react';
import { resolve } from 'path';
import open from 'open';
import { Button } from './components/button';
import { SocialButton } from './components/social-button';
import { downloadUpdates, findNewRemoteFiles, getLocalFiles, getRemoteFiles, getUpdateDownloadSize } from './updater';

QFontDatabase.addApplicationFont(resolve('dist', 'Metropolis-Medium.otf'));

class App extends React.Component<any, { x: number, y: number, msg: string }> {
    private readonly windowRef: React.RefObject<QMainWindow>;

    constructor(props: any) {
        super(props);
        this.state = { x: 0, y: 0, msg: '' };
        this.windowRef = React.createRef<QMainWindow>();
    }

    start() {
        open(resolve('WindowsNoEditor', 'Polygon.exe'));
    }

    async update() {
        this.setState({ ...this.state, msg: 'Проверка обновлений' });

        const [local, remote] = await Promise.all([getLocalFiles(), getRemoteFiles()]);
        const updates = findNewRemoteFiles(local, remote);

        let text = `Найдено ${updates.length} новых файлов (${getUpdateDownloadSize(updates)})`;
        if (updates.length) {
            text += '\nВыполняется обновление';
        }
        this.setState({ ...this.state, msg: text });
        if (updates.length) {
            await downloadUpdates(updates);
            this.setState({ ...this.state, msg: `Обновление завершено`});
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
                </View>
            </Window>
        );
    }
}

export default hot(App);
