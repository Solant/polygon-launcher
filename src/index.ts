import {
    FlexLayout, NodeWidget,
    QFontDatabase,
    QIcon,
    QLabel,
    QMainWindow,
    QPushButton,
    QSize,
    QWidget,
    WindowType,
} from '@nodegui/nodegui';
import { downloadUpdates, findNewRemoteFiles, getLocalFiles, getRemoteFiles, getUpdateDownloadSize } from './updater';
import open from 'open';
import { resolve } from 'path';

function asset(name: string) {
    return resolve('dist', name);
}

QFontDatabase.addApplicationFont(asset('Metropolis-Medium.otf'));

const win = new QMainWindow();
win.setFixedSize(400, 400);
win.setWindowTitle('Polygon Launcher');
// win.setWindowFlag(WindowType.FramelessWindowHint, true);

const centralWidget = new QWidget();
centralWidget.setObjectName('myroot');
const rootLayout = new FlexLayout();
centralWidget.setLayout(rootLayout);

const logo = new QLabel();
logo.setText('POLYGON');
logo.setObjectName('logo');
logo.setInlineStyle('font-family: "Metropolis Medium"; font-size: 50px; color: white; margin-top: 20px;');

const label = new QLabel();
label.setInlineStyle('font-family: "Metropolis Medium"; font-size: 15px; color: white; text-align: center;');
updateText();

function updateText(value: string = '') {
    label.setText(value);
}

rootLayout.addWidget(logo);
rootLayout.addWidget(label);

function createSocialButton(icon: string, url: string) {
    const tgIcon = new QIcon(icon);
    const telegramIcon = new QPushButton();
    telegramIcon.setIcon(tgIcon);
    telegramIcon.setIconSize(new QSize(40, 40));
    telegramIcon.setInlineStyle('background-color: transparent;');
    telegramIcon.addEventListener('clicked', () => {
        open(url);
    });

    return telegramIcon;
}

function createMainButton(iconPath: string, callback: () => void) {
    const button = new QPushButton();
    const icon = new QIcon(iconPath);

    button.setIcon(icon);
    button.setIconSize(new QSize(40, 40));
    button.setInlineStyle('background-color: #1e1e1e;');
    button.addEventListener('clicked', callback);

    return button;
}

function createRow(widgets: NodeWidget<any>[]) {
    const row = new QWidget();
    const rowLayout = new FlexLayout();
    rowLayout.setFlexNode(row.getFlexNode());
    row.setLayout(rowLayout);
    row.setInlineStyle('flex: 1; flex-direction: row;');

    widgets.forEach(w => rowLayout.addWidget(w));

    return row;
}

rootLayout.addWidget(createRow([
    createMainButton(asset('play-button.png'), () => {
        open(resolve('WindowsNoEditor', 'Polygon.exe'));
    }),
    createMainButton(asset('T_Icon_Update.png'), async () => {
        updateText('Проверка обновлений');

        const [local, remote] = await Promise.all([getLocalFiles(), getRemoteFiles()]);
        const updates = findNewRemoteFiles(local, remote);

        let text = `Найдено ${updates.length} новых файлов (${getUpdateDownloadSize(updates)})`;
        if (updates.length) {
            text += '\nВыполняется обновление';
        }
        updateText(text);
        if (updates.length) {
            await downloadUpdates(updates);
            updateText(`Обновление завершено`);
        }
    }),
    createMainButton(asset('T_Icon_Quit.png'), () => process.exit(0)),
]));

rootLayout.addWidget(createRow([
    createSocialButton(asset('T_Icons_Telegram.png'), 'https://t.me/polygon_online'),
    createSocialButton(asset('T_Icon_VK.png'), 'https://vk.com/polygon_online'),
]));

win.setCentralWidget(centralWidget);
win.setStyleSheet(
  `
    #myroot {
      background-color: #181818;
      height: '100%';
      align-items: 'center';
      justify-content: 'center';
    }
  `
);
win.show();

(global as any).win = win;
