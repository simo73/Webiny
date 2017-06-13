import hoistNonReactStatics from 'hoist-non-react-statics';
import {Map} from 'immutable';
import LazyLoad from './Ui/LazyLoad';
import WebinyComponent from './Core/Component';
import ModalComponent from './Core/ModalComponent';
import Injector from './Core/Injector';

/**
 * This function creates a wrapper class around given component to allow component styling and lazy loading of dependencies
 *
 * @param Component
 * @param options
 * @returns {component}
 */
export default (Component, options = {}) => {
    // Create an immutable copy of styles to use as default styles
    const defaultStyles = Map(options.styles || {});

    // Automatically expose modal dialog methods
    if (Component.prototype instanceof ModalComponent) {
        _.assign(options, {api: ['show', 'hide', 'isAnimating', 'isShown', 'getDialog']});
    }

    class ComponentWrapper extends WebinyComponent {
        constructor(props) {
            super(props);
            if (options.api) {
                options.api.forEach((method) => {
                    Object.defineProperty(this, method, {
                        get: () => this.component[method]
                    });
                })
            }
        }

        componentWillMount() {
            // Do nothing since this is a proxy component
        }

        componentWillUnmount() {
            // Do nothing since this is a proxy component
        }

        componentDidMount() {
            // Do nothing since this is a proxy component
            // 'onComponentDidMount' prop only needs to be handled by the actual component
        }

        static configure(config) {
            // defaultProps are merged
            _.merge(ComponentWrapper.defaultProps, config.defaultProps || {});
            delete config.defaultProps;

            // modules are overwritten
            if (_.hasIn(config, 'options.modules')) {
                ComponentWrapper.options.modules = config.options.modules;
                delete config.options.modules;
            }

            // Merge the rest
            _.merge(ComponentWrapper.options, config.options || {});
        }

        render() {
            const props = _.omit(this.props, ['styles']);
            props.ref = c => this.component = c;

            // Detect if component override is possible
            if (props.context) {
                const overrides = Injector.getByTag(props.context);
                if (overrides.length) {
                    const props = _.pick(this.props, ['value', 'children', 'onChange']);
                    if (this.props.contextProps) {
                        _.merge(props, this.props.contextProps);
                    }
                    const RenderComponent = overrides.pop().value;
                    const options = RenderComponent.options;

                    // If lazy loaded modules are defined - return LazyLoad wrapper
                    const modules = options.modules || {};
                    if (Object.keys(modules).length > 0) {
                        return (
                            <LazyLoad modules={modules}>
                                {(modules) => {
                                    if (options.modulesProp) {
                                        props[options.modulesProp] = modules;
                                    } else {
                                        _.assign(props, modules);
                                    }
                                    return <RenderComponent {...props}/>;
                                }}
                            </LazyLoad>
                        );
                    }

                    return <RenderComponent {...props}/>
                }
            }

            props.styles = defaultStyles.toJS();
            // If new styles are given, merge them with default styles
            if (_.isPlainObject(this.props.styles)) {
                _.merge(props.styles, this.props.styles);
            }

            // If lazy loaded modules are defined - return LazyLoad wrapper
            const modules = options.modules || {};
            if (Object.keys(modules).length > 0) {
                return (
                    <LazyLoad modules={modules}>
                        {(modules) => {
                            if (options.modulesProp) {
                                props[options.modulesProp] = modules;
                            } else {
                                _.assign(props, modules);
                            }
                            return <Component {...props}/>;
                        }}
                    </LazyLoad>
                );
            }

            return <Component {...props}/>
        }
    }

    ComponentWrapper.__originalComponent = Component;
    ComponentWrapper.options = options;
    ComponentWrapper.defaultProps = _.assign({}, Component.defaultProps);

    return hoistNonReactStatics(ComponentWrapper, Component);
};