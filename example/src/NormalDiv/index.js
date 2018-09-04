/* eslint-disable max-len */
import React from 'react'
import Target from './Target'

const DragAroundNaive = React.createClass({
  getInitialState() {
    return {
      hideSourceOnDrag: true
    }
  },

  handleHideSourceClick() {
    this.setState({
      hideSourceOnDrag: !this.state.hideSourceOnDrag
    })
  },

  render() {
    const { hideSourceOnDrag } = this.state

    return (
      <div><div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3>Normal Div</h3>
        <Target hideSourceOnDrag={hideSourceOnDrag} />
        <p>
          <label>
            <input type="checkbox"
                   checked={hideSourceOnDrag}
                   onChange={this.handleHideSourceClick} />
            <small>Hide source while dragging</small>
          </label>
        </p>
      </div></div>
    )
  }
})

export default DragAroundNaive
