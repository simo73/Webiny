import Webiny from 'Webiny';
const Ui = Webiny.Ui.Components;

class Field extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.bindMethods('getTdClasses');
    }

    getTdClasses(classes = {}) {
        const coreClasses = {};
        coreClasses[this.props.sortedClass] = this.props.sorted !== null;
        coreClasses[this.props.alignLeftClass] = this.props.align === 'left';
        coreClasses[this.props.alignRightClass] = this.props.align === 'right';
        coreClasses[this.props.alignCenterClass] = this.props.align === 'center';
        return this.classSet(coreClasses, this.props.className, classes);
    }
}

Field.defaultProps = {
    default: '-',
    includeTd: true,
    align: 'left',
    sortedClass: 'sorted',
    alignLeftClass: 'text-left',
    alignRightClass: 'text-right',
    alignCenterClass: 'text-center',
    route: null,
    params: null,
    renderer() {
        let content = _.get(this.props.data, this.props.name) || this.props.default;
        if (_.isFunction(this.props.children)) {
            content = this.props.children.call(this, this.props.data, this);
        }

        if (this.props.route) {
            content = (
                <Ui.List.Table.RouteAction route={this.props.route} data={this.props.data} params={this.props.params}>
                    {content}
                </Ui.List.Table.RouteAction>
            );
        }

        return this.props.includeTd ? <td className={this.getTdClasses()}>{content}</td> : content;
    }
};

export default Field;