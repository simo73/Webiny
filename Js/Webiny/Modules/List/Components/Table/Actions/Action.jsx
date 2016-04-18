import Webiny from 'Webiny';
const Ui = Webiny.Ui.Components;

class Action extends Webiny.Ui.Component {

}

Action.defaultProps = {
    onClick: _.noop,
    renderer: function renderer() {
        return (
            <Ui.Link onClick={() => this.props.onClick(this.props.data)}>{this.props.label}</Ui.Link>
        );
    }
};

export default Action;