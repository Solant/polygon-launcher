import { ButtonRole, QMessageBox, QPushButton } from '@nodegui/nodegui';
import { preventGC } from './nodeguiUtils';

export function nativeErrorHandler(error: string, stack: string) {
    const message = new QMessageBox();
    const close = new QPushButton(message);
    close.setText('Закрыть');


    message.setText(error);
    message.setDetailedText(stack);
    message.addButton(close, ButtonRole.RejectRole);
    message.show();
    preventGC({ message });
}
