import { Button as NativeButton } from "@nodegui/react-nodegui";
import React, { FunctionComponent, useState } from "react";
import { QIcon, QSize } from '@nodegui/nodegui';

export const SocialButton: FunctionComponent<{
    clicked: () => void,
    icon: string,
}> = (props) => {
    const [state] = useState({
        size: new QSize(40, 40),
        icon: new QIcon(props.icon),
    });

    return (
        <NativeButton
            icon={state.icon}
            flat={true}
            iconSize={state.size}
            on={{ clicked: () => props.clicked() }}
            styleSheet={'background-color: transparent; margin: 5px;'}
        />
    );
};
