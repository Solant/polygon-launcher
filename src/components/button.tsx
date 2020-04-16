import { Button as NativeButton } from '@nodegui/react-nodegui';
import React, { FunctionComponent, useState } from 'react';
import { CursorShape, QIcon, QSize } from '@nodegui/nodegui';

export const Button: FunctionComponent<{
    clicked: () => void,
    icon: string,
}> = (props) => {
    const [state] = useState({
        size: new QSize(40, 40),
        icon: new QIcon(props.icon),
    });

    const styleSheet = `
    QPushButton {
        background-color: #1e1e1e;
        height: 70px;
        width: 90px;
        margin: 0px 10px 0 10px;
    }
    QPushButton:hover {
        border: 1px solid white;
    }`;

    return (
        <NativeButton
            cursor={CursorShape.PointingHandCursor}
            icon={state.icon}
            iconSize={state.size}
            on={{ clicked: () => props.clicked() }}
            styleSheet={styleSheet}
        />
    );
};
