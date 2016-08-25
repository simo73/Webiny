import Webiny from 'Webiny';
import HtmlEditor from './HtmlEditor';

class Module extends Webiny.Module {

    init() {
        Webiny.Ui.Components.HtmlEditor = HtmlEditor;
    }
}

export default Module;
