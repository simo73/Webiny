import Webiny from 'Webiny';

// Find Webiny app or components and run them
function runWebiny() {
    const config = WebinyBootstrap.config;
    const appElement = document.querySelector('webiny-app');
    if (appElement) {
        const appName = config.app;
        const authenticationApp = config.authentication || 'Core.Backend';
        Webiny.Router.setBaseUrl(config.baseUrl);
        WebinyBootstrap.includeApp(appName).then(app => {
            // Filter modules
            const modules = app.config.modules;
            if (app.config.name !== authenticationApp) {
                delete modules['Authentication'];
            }
            app.instance.meta = app.config;
            app.instance.addModules(modules);
            _.set(Webiny.Apps, app.config.name, app.instance);
            app.instance.run(appElement);
        });
    }
}

class WebinyBootstrapClass {

    constructor() {
        this.meta = {};
    }

    import(path) {
        return System.import(path).catch(e => console.error(e));
    }

    run(config) {
        this.config = config;
        this.env = window.WebinyEnvironment;
        window._apiUrl = '/api';
        if (this.env === 'development') {
            window.Webiny = Webiny;
        }

        // First we need to import Core/Webiny
        this.includeApp('Core.Webiny').then(app => {
            app.instance.addModules(this.meta['Core.Webiny'].modules).run().then(() => {
                runWebiny(this.meta);
            });
        });
    }

    loadAssets(meta) {
        const assets = [];
        _.each(_.get(meta.assets, 'js', []), item => {
            const vendors = new RegExp('\/vendors([-0-9a-z]+)?.js');
            // Do NOT import Core.Webiny vendors.js
            if (meta.name === 'Core.Webiny' && vendors.test(item)) {
                return;
            }

            assets.push(this.import(item));
        });

        const vendors = new RegExp('\/vendors([-0-9a-z]+)?.css');
        _.each(_.get(meta.assets, 'css', []), item => {
            // Do NOT import Core.Webiny vendors.css
            if (meta.name === 'Core.Webiny' && vendors.test(item)) {
                return;
            }
            this.includeCss(item);
        });

        return Q.all(assets).then(() => {
            return this.import(meta.name).then(m => {
                return {
                    instance: m.default,
                    config: meta
                };
            });
        });
    }

    /**
     * Include app
     * @param appName
     * @param object|boolean meta If true, will load modules and run the app
     * @returns {*}
     */
    // TODO: add autoinitialize flag
    includeApp(appName, meta) {
        if (!meta || meta === true) {
            return axios({url: _apiUrl + '/services/core/apps/' + appName}).then(res => {
                this.meta[appName] = res.data.data;
                return this.loadAssets(this.meta[appName]).then(app => {
                    if (meta === true) {
                        app.instance.addModules(app.config.modules);
                        _.set(Webiny.Apps, app.config.name, app.instance);
                        return app.instance.run();
                    }
                    return app;
                });
            });
        }
        this.meta[appName] = meta;
        return this.loadAssets(meta);
    }

    includeCss(filename) {
        const file = document.createElement('link');
        file.rel = 'stylesheet';
        file.type = 'text/css';
        file.href = filename;

        if (typeof file !== 'undefined') {
            document.getElementsByTagName('head')[0].appendChild(file);
        }
    }
}

export default WebinyBootstrapClass;
