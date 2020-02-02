import { Button as NativeButton } from "@nodegui/react-nodegui";
import React from "react";
import { QIcon, QSize } from '@nodegui/nodegui';

export class SocialButton extends React.Component<{
    clicked: () => void,
    icon: string,
}> {
    render() {
        return (
            <NativeButton
                icon={new QIcon(this.props.icon)}
                flat={true}
                iconSize={new QSize(40, 40)}
                on={{ clicked: () => this.props.clicked() }}
                styleSheet={'background-color: transparent'}
            />
        );
    }
}