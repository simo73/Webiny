import Webiny from 'Webiny';
const Ui = Webiny.Ui.Components;
const Table = Ui.List.Table;

class List extends Webiny.Ui.View {

}

List.defaultProps = {
    renderer: function render() {
        const listProps = {
            api: '/entities/core/user-roles',
            fields: 'id,name,slug,createdOn',
            connectToRouter: true,
            query: {_sort: 'name'},
            perPage: 25
        };

        return (
            <Ui.View.List>
                <Ui.View.Header title="ACL - Roles">
                    <Ui.Link type="primary" route="UserRoles.Create" align="right">
                        <Ui.Icon icon="icon-plus-circled"/>
                        Create user role
                    </Ui.Link>
                </Ui.View.Header>
                <Ui.View.Body>
                    <Ui.List.ApiContainer {...listProps}>
                        <Table.Table>
                            <Table.Row>
                                <Table.Field name="name" label="Name" sort="name" route="UserRoles.Edit">
                                    {data => (
                                        <span>
                                            <strong>{data.name}</strong><br/>{data.id}
                                        </span>
                                    )}
                                </Table.Field>
                                <Table.Field name="slug" label="Slug" sort="slug"/>
                                <Table.Actions>
                                    <Table.EditAction route="UserRoles.Edit"/>
                                    <Table.DeleteAction/>
                                </Table.Actions>
                            </Table.Row>
                        </Table.Table>
                        <Ui.List.Pagination/>
                    </Ui.List.ApiContainer>
                </Ui.View.Body>
            </Ui.View.List>
        );
    }
};

export default List;