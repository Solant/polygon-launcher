import { ButtonRole, QMessageBox, QPushButton } from '@nodegui/nodegui';

export function nativeErrorHandler(error: string, stack: string) {
    const message = new QMessageBox();
    const close = new QPushButton(message);
    close.setText('Закрыть');


    message.setText(error);
    message.setDetailedText(stack);
    message.addButton(close, ButtonRole.RejectRole);
    message.show();
}
