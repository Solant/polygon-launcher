import { QMessageBox } from '@nodegui/nodegui';

export function nativeErrorHandler(error: string, stack: string) {
    const message = new QMessageBox();

    message.setText(error);
    message.setDetailedText(stack);
    message.show();
}
