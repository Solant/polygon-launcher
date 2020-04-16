import { useEffect } from 'react';
import semver from 'semver';
import fetch from 'node-fetch';
import { ButtonRole, QMessageBox, QPushButton } from '@nodegui/nodegui';
import open from 'open';
import { nativeErrorHandler } from './errorHandler';
import { preventGC } from './nodeguiUtils';

/**
 * Hook to check for launcher update check on mount
 */
export function useCheckUpdates() {
    useEffect(() => {
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
                    preventGC({ dialog });
                }
            });
    }, []);
}
