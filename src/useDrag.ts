import { useState, MutableRefObject } from 'react';
import { NativeElement, QMainWindow, QMouseEvent } from '@nodegui/nodegui';

/**
 * Handle drag of frameless window using window background
 * @param ref
 */
export default function useDrag(ref: MutableRefObject<QMainWindow>) {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    function handleMouseEvent(e?: NativeElement) {
        if (!e) {
            return;
        }
        const event = new QMouseEvent(e);
        const button = event.button();

        if (button == '0') {
            // drag
            ref.current!.move(event.globalX() - position.x, event.globalY() - position.y);
        } else if (button == '1') {
            // left click
            setPosition({ x: event.x(), y: event.y() });
        }
    }

    return handleMouseEvent;
}
