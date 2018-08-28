import React from 'react'

import Tag from 'components/tag'
import * as ObjectUtil from 'util/object-util'
import { Set } from 'immutable'

import { tr } from 'dict'

const input_style = {
  width: "7em",
  border: "none",
  background: "none",
  outline: "none",
  borderBottom: "3px solid rgb(10, 50, 100)"
}

class Presentational extends React.Component {
  constructor(props) {
    super(props)
    this.textInput = null
  }

  componentDidUpdate(){
    if(this.textInput) this.textInput.focus()
  }

  render() {
    const props = this.props
    const tag_ids = props.tag_ids
    const getTagByTagId = props.getTagByTagId
    const editing = props.editing

    const keyUp = (event) => {
      this.props.candidateTagCallback(event.target.value)

      if (event.keyCode === 8) { // Backspace
        if(event.target.value.length == 0 && tag_ids.size > 0){
          this.props.deleteTagged(this.props.node_id, tag_ids.last());
        }

      } else if (event.keyCode === 13) { // Enter
        event.preventDefault();
        if(event.target.value.length === 0) {
          this.props.endEditing();
        } else {
          this.props.createTagged(this.props.node_id, event.target.value);
          event.target.value = "";
        }

      } else if (event.keyCode === 27) { // Escape
        event.stopPropagation();
        this.props.endEditing();
      }
    }

    const handle_remove = (tag_id) => () => {this.props.deleteTagged(this.props.node_id, tag_id)}

    const tagIdsToElements = () => tag_ids.map(tag_id=>{
      const tag = getTagByTagId(tag_id)
      const name = tag.get('name')

      return (
        <Tag
          key={tag_id}
          text={name}
          node_id={this.props.node_id}
          editing={editing}
          remove_handler={handle_remove(tag_id)}
        />
      )
    }).reduce((acc,val)=>[...acc,val],[])


    if (editing) {
      this.props.candidateTagCallback('')
      const elements = tagIdsToElements()
      const input_box = (
        <input
          key="__input__"
          style={input_style}
          onMouseUp={(e) => {e.stopPropagation();}}
          onKeyUp={keyUp}
          placeholder={tr("New tag")}
          ref={(component) => {this.textInput = component;}}
        />
      )

      return [...elements, input_box]
    } else if (tag_ids.size > 0) {
      const elements = tagIdsToElements()
      return elements
    } else {
      return (
        <span key="__closing__">{tr("Click here to add some tags!")}</span>
      )
    }
  }
}


export default (props) => {
  const api = props.api
  const report_state = api.report_state
  const database = api.database

  const createTagged = (ff_id,tag_name) => {
    database.createTagged(ff_id,tag_name)
    api.undo.commit()
  }

  const deleteTagged = (ff_id,tag_id) => {
    database.deleteTagged(ff_id,tag_id)
    api.undo.commit()
  }

  props = ObjectUtil.compose({
    editing: report_state.editing_tags(),
    createTagged,
    deleteTagged,
    getTagByTagId:database.getTagByTagId,
    endEditing: report_state.stopEditingTags,
  },props)

  return (<Presentational {...props}/>)
}


// const Container = connect(
//   mapStateToProps,
//   mapDispatchToProps,
//   null,
//   {withRef:true}
// )(Presentational)

// export default Container