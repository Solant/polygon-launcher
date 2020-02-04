import { Button as NativeButton } from "@nodegui/react-nodegui";
import React, { FunctionComponent, useState } from "react";
import { QIcon, QSize } from '@nodegui/nodegui';

export const Button: FunctionComponent<{
    clicked: () => void,
    styleSheet?: string,
    icon: string,
}> = (props) => {
    const [state] = useState({
        size: new QSize(40, 40),
        icon: new QIcon(props.icon),
    });

    return (
        <NativeButton
            icon={state.icon}
            iconSize={state.size}
            on={{ clicked: () => props.clicked() }}
            style={'background-color: #1e1e1e; height: 70px; width: 90px; margin: 0px 10px 0 10px' + (props.styleSheet || '')}
        />
    );
};
