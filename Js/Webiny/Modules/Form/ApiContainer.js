import Webiny from 'Webiny';
import BaseContainer from './BaseContainer';

class ApiContainer extends BaseContainer {

    constructor(props) {
        super(props);
        Webiny.Mixins.ApiComponent.extend(this);
    }

    componentWillMount() {
        super.componentWillMount();

        if (this.props.loadData) {
            return this.props.loadData.call(this).then(data => {
                this.setState({model: data, loading: false});
            });
        }

        this.loadData(this.props.id);
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
    }

    showLoading() {
        this.setState({loading: true});
    }

    hideLoading() {
        this.setState({loading: false});
    }

    loadData(id = null) {
        if (!id) {
            if (this.props.connectToRouter) {
                id = Webiny.Router.getParams('id');
            }
        }

        if (id) {
            this.showLoading();
            return this.api.execute(this.api.httpMethod, id).then(apiResponse => {
                if (this.props.prepareLoadedData) {
                    return this.setState({model: this.props.prepareLoadedData(apiResponse.getData()), loading: false});
                }
                this.setState({model: apiResponse.getData(), loading: false});
            });
        }
    }

    onSubmit(data) {
        this.showLoading();
        if (data.id) {
            return this.api.execute('PATCH', data.id, data).then(ar => {
                this.hideLoading();
                const onSubmitSuccess = this.props.onSubmitSuccess;
                if (!ar.isError() && onSubmitSuccess) {
                    if (_.isFunction(onSubmitSuccess)) {
                        return onSubmitSuccess.bind(this)(ar);
                    }

                    if (_.isString(onSubmitSuccess)) {
                        Webiny.Router.goToRoute(onSubmitSuccess);
                    }
                }
            });
        }

        return this.api.execute('POST', '/', data).then(ar => {
            this.hideLoading();
            const onSubmitSuccess = this.props.onSubmitSuccess;
            if (!ar.isError() && onSubmitSuccess) {
                if (_.isFunction(onSubmitSuccess)) {
                    return onSubmitSuccess.bind(this)(ar);
                }

                if (_.isString(onSubmitSuccess)) {
                    Webiny.Router.goToRoute(onSubmitSuccess);
                }
            }
        });
    }
}

ApiContainer.defaultProps = _.assign({}, BaseContainer.defaultProps, {
    connectToRouter: false
});

export default ApiContainer;