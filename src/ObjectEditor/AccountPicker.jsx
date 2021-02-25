import React from 'react'
import { AccountTreeView, Modal } from '../components'

export default class AccountPicker extends React.Component {
  state = {
    accountTreeData: null,
    showingAccountModal: false,
  }

  loadAccountTreeData = async () => {
    const accountTreeData = await global.accountManager.getTreeData()
    this.setState({ accountTreeData })
  }

  pick = async () => {
    await this.loadAccountTreeData();
    this.setState({ showingAccountModal: true });

    return new Promise((resolve) => {
      this._resolve = resolve;
    })
  }

  closeAccountModal = (idOrNull) => {
    this.setState({ showingAccountModal: false });
    this._resolve(idOrNull);
  }

  render() {
    return (
      <Modal open={this.state.showingAccountModal} onModalRequestClose={() => this.closeAccountModal(null)}>
        <AccountTreeView
          treeData={this.state.accountTreeData}
          onDoubleClick={(id) => this.closeAccountModal(id)}
        />
      </Modal>
    )
  }
}
