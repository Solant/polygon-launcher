import { Button as NativeButton } from "@nodegui/react-nodegui";
import React from "react";
import { QIcon, QSize } from '@nodegui/nodegui';

export class Button extends React.Component<{
    clicked: () => void,
    styleSheet?: string,
    icon: string,
}> {
    render() {
        return (
            <NativeButton
                icon={new QIcon(this.props.icon)}
                iconSize={new QSize(40, 40)}
                on={{ clicked: () => this.props.clicked() }}
                styleSheet={'background-color: #1e1e1e; height: 70px; width: 90px; margin: 0px 10px 0 10px' + (this.props.styleSheet || '')}
            />
        );
    }
}