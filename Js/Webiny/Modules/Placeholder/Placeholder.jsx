import Webiny from 'Webiny';

class Placeholder extends Webiny.Ui.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        if (this.props.onDidUpdate) {
            this.props.onDidUpdate();
        }
    }

    componentDidUpdate() {
        if (this.props.onDidUpdate) {
            this.props.onDidUpdate();
        }
    }
}

Placeholder.defaultProps = {
    renderer() {
        if (!Webiny.Router.getActiveRoute()) {
            return null;
        }

        const route = Webiny.Router.getActiveRoute();
        const components = route.getComponents(this.props.name);

        let defComponents = [];
        if (!route.skipDefaultComponents()) {
            defComponents = Webiny.Router.getDefaultComponents(this.props.name);
        }

        const cmps = [];
        _.compact(components.concat(defComponents)).forEach((item, index) => {
            const props = {key: index};
            if (!_.isFunction(item)) {
                _.assign(props, item[1]);
                item = item[0];
            }
            cmps.push(React.createElement(item, props));
        });

        if (!cmps.length) {
            return null;
        }

        return (
            <rad-placeholder>{cmps}</rad-placeholder>
        );
    }
};

export default Placeholder;
