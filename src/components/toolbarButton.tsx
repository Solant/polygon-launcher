import React, { FunctionComponent, useState } from 'react';
import { Button as NativeButton } from '@nodegui/react-nodegui';
import { QIcon, QSize } from '@nodegui/nodegui';

export const ToolbarButton: FunctionComponent<{
    clicked: () => void,
    styleSheet?: string,
    icon: string,
}> = (props) => {
    const [state] = useState({
        size: new QSize(40, 40),
        icon: new QIcon(props.icon),
    });

    return <NativeButton
        icon={state.icon}
        iconSize={state.size}
        on={{ clicked: () => props.clicked() }}
        style={'background-color: transparent;height: 12px; width: 12px;' + (props.styleSheet || '')}
    />
};
