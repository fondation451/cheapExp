
import { Map, List, Record, Set } from 'immutable'
import { generateRandomString } from 'random-gen'

import * as Cache from 'cache'
import * as Content from 'content'
import * as Arbitrary from 'test/arbitrary'
import * as Loop from 'test/loop'
import * as TT_ from 'table-tree'
const TT = Object.assign({},TT_)


import * as V5 from '../version/v5/src/file-system'


TT.arbitrary = TT.arbitrary(Content.update, Content.arbitrary)
TT.update = TT.update(Content.update)
const sortTTBySize = TT.sort(Content.compareSize)
const isTTSortedBySize = TT.isSorted(Content.compareSize)

const sortTTByDate = TT.sort(Content.compareDate)
const isTTSortedByDate = TT.isSorted(Content.compareDate)

TT.toStrList2 = TT.toStrList2(Content.toStrListHeader, Content.toStrList)
TT.toJson = TT.toJson(Content.toJson)
TT.fromJson = TT.fromJson(Content.fromJson)
TT.toJs = TT.toJs(Content.toJs)
TT.fromJs = TT.fromJs(Content.fromJs)



const QueueElem = Record({
  path:List(),
  content:null
})

const makeQueueElem = (path,content) => {
  return new QueueElem({
    path:List(path.split('/')),
    content: content
  })
}

const arbitraryPath = () => List(Arbitrary.array(
  () => 'p' + Math.round(Math.random() * 1)
))

export const arbitraryQe = () => {
  return new QueueElem({
    path:arbitraryPath(),
    content:Content.arbitrary()
  })
}

export const qeToJs = a => {
  a = a.update('path', a=>a.toJS())
  a = a.update('content', Content.toJs)
  a = a.toJS()
  return a
}

export const qeFromJs = a => {
  a = new QueueElem(a)
  a = a.update('path', List)
  a = a.update('content', Content.fromJs)
  return a
}

export const qeToJson = a => {
  a = a.update('path', a=>a.toJS())
  a = a.update('content', Content.toJson)
  a = JSON.stringify(a.toJS())
  return a
}

export const qeFromJson = a => {
  a = new QueueElem(JSON.parse(a))
  a = a.update('path', List)
  a = a.update('content', Content.fromJson)
  return a
}




const Fs = Record({
  session_name:'Untitled',
  version:8,
  content_queue:List(),
  tree:null,
  tags: Map(),
  tags_sizes: Map(),
  parent_path:List(),
})


export const arbitraryTags = () => {
  return Arbitrary.immutableMap(
    Arbitrary.string,
    ()=>Arbitrary.immutableSet(()=>generateRandomString(40))
  )
}

export const tagsToJs = a => {
  return a.toJS()
}

export const tagsFromJs = a => {
  a = Map(a)
  a = a.map(Set)
  return a
}

export const tagsSizesFromJs = a => {
  a = Map(a)
  return a
}

export const tagsToJson = a => {
  a = tagsToJs(a)
  a = JSON.stringify(a)
  return a
}

export const tagsFromJson = a => {
  a = JSON.parse(a)
  a = tagsFromJs(a)
  return a
}

export const tagsSizesFromJson = a => {
  a = JSON.parse(a)
  a = tagsSizesFromJs(a)
  return a
}


const arbitraryStrPath = () => arbitraryPath().join('/')

export const arbitrary = () => {
  let ans = empty()
  for (let i = Arbitrary.index()*2 - 1; i >= 0; i--) {
    ans = pushOnQueue(arbitraryStrPath(),Content.arbitrary(), ans)
  }
  ans = makeTree(ans)
  ans = sortBySize(ans)
  ans = ans.set('tags',arbitraryTags())
  return ans
}

export const empty = () => {
  let res = new Fs({
    tree:TT.init(Content.create())
  });
  return res
}

export const size_files = (state) => state.get('content_queue').size
export const size_overall = (state) => state.get('tree').get('table').size - 1

export const depth = (state) => TT.depth(state.get('tree'))

export const parentPath = (state) => {
  return state.get('parent_path').toArray()
}

const getVersion = (state) => state.get('version')
const setVersion = (a,state) => state.set('version',a)

export const getByID = (id, state) => TT.getEntryById(id, state.get('tree'))
export const setByID = (id, entry, state) =>
  state.update('tree',a=>TT.setEntryById(id, entry, a))
export const updateByID = (id, f, state) =>
  state.update('tree',a=>TT.updateEntryById(id, f, a))


export const getSessionName = (state) => state.get('session_name')
export const setSessionName = (a, state) => state.set('session_name',a)

export const getTagsByID = (state, id) => state.get('tags').reduce((acc, val, i) => {return (val.has(id) ? acc.add(i) : acc)}, Set.of())
export const getTagged = (state, tag) => state.get('tags').get(tag)
export const addTagged = (state, tag, id) => {
  let new_state = state.update('tags', a=>{
    return a.update(tag, b=>(b === undefined ? Set.of(id) : b.add(id)))
  })

  // new_state = new_state.update('tags_sizes', a=>{
  //   return a.update(tag, b=>{
  //     let size = getByID(id, state).get('content').get('size')
  //     if (b === undefined) return size;
  //     else return b + size;
  //   })
  // })

  new_state = updateTagsSizes(new_state, tag)

  return new_state
}
export const deleteTagged = (state, tag, id) => {
  if (state.get('tags').has(tag)) {
    state = state.update('tags', a=>{
      let new_tags = a.update(tag, b=>b.delete(id))
      if(new_tags.get(tag).size === 0)
        return a.delete(tag);
      else
        return new_tags;
    })

    // state = state.update('tags_sizes', a=>{
    //   let new_tags = a.update(tag, b=>b - getByID(id, state).get('content').get('size'))
    //   if(new_tags.get(tag) === 0)
    //     return a.delete(tag);
    //   else
    //     return new_tags;
    // })

    state = updateTagsSizes(state, tag)
  }

  return state
}

export const getAllChildren = (table, id) => {
  const direct_children = table.get(id).get('children')
  let init = Set.of(id)

  let res
  if(direct_children.size > 0)
    res = direct_children.reduce((acc, val) => acc.union(getAllChildren(table, val)), init);
  else
    res = init;

  return res
}

export const updateTagsSizes = (state, tag) => {
  if(state.get('tags').has(tag)) {
    const table = state.get('tree').get('table')
    let id_list = state.get('tags').get(tag).sortBy(id => -1*table.get(id).get('content').get('size'))

    let filtered_id_list = Set.of()

    while (id_list.size > 0){
      let potential_parent = id_list.first()
      filtered_id_list = filtered_id_list.add(potential_parent)
      
      let potential_children = getAllChildren(table, potential_parent)

      id_list = id_list.reduce((acc, val) => (potential_children.includes(val) ? acc : acc.add(val)), Set.of())
    }

    let tagged_size = filtered_id_list.reduce((acc, val) => (acc + table.get(val).get('content').get('size')), 0)

    state = state.update('tags_sizes', a => (tagged_size > 0 ? a.set(tag, tagged_size) : a.delete(tag)))
  }

  else {
    state = state.update('tags_sizes', a => a.delete(tag))
  }

  return state
}

export const getAllTags = (state) => state.get('tags')
export const getAllTagsSizes = (state) => state.get('tags_sizes')

export const renameTag = (state, old_tag, new_tag) => {
  if (state.get('tags').has(old_tag) && !state.get('tags').has(new_tag)){
    state = state.update('tags', a=>(a.mapKeys(k => (k === old_tag ? new_tag : k))))
    state = state.update('tags_sizes', a=>(a.mapKeys(k => (k === old_tag ? new_tag : k))))
  }

  return state
}
  
export const deleteTag = (state, tag) => {
  state = state.update('tags', a => a.delete(tag))
  state = state.update('tags_sizes', a => a.delete(tag))
  return state
}

export const ghostTreeFromJs = (js, state) => {
  state = state.set('tree', TT.fromJs(js))
  return state
}



export const arbitraryContentQueue = () => {
  return Arbitrary.immutableList(arbitraryQe)
}


export const contentQueueToJson = (a) => {
  a = contentQueueToJs(a)
  a = JSON.stringify(a)
  return a
}

export const contentQueueFromJson = (a) => {
  a = JSON.parse(a)
  a = contentQueueFromJs(a)
  return a
}

export const contentQueueToJs = (a) => {
  a = a.map(qeToJs)
  a = a.toJS()
  return a
}

export const contentQueueFromJs = (a) => {
  a = List(a)
  a = a.map(qeFromJs)
  return a
}

export const volume = (state) => {
  return Content.getSize(getByID(rootId(state), state).get('content'))
}

export const rootId = (state) => TT.getRootId(state.get('tree'))

export const pushOnQueue = (path, content, state) => {
  state = state.update(
    'content_queue',
    a=> a.push(makeQueueElem(path,content))
  )

  return state
}

const updateTreeWithQueueElem = (queue_elem,tree) => {
  tree = TT.update(queue_elem.get('path').toJS(), queue_elem.get('content'), tree)
  return tree
}

export const makeTree = (state) => {
  state = state.update('tree', tree => {
    tree = tree.asMutable()
    state.get('content_queue').forEach(queue_elem => {
      tree = updateTreeWithQueueElem(queue_elem, tree)
    })
    return tree.asImmutable()
  })

  return state
}

export const computeDerivatedData = (state) => {
  state = state.update('tree', tree => {
    tree = TT.mapContent(Content.computeDerivatedData, tree)
    return tree
  })

  return state
}

export const sortBySize = Cache.make((state) => {
  state = state.update('tree', sortTTBySize)
  return state
})

export const sortByDate = Cache.make((state) => {
  state = state.update('tree', sortTTByDate)
  return state
})

export const sortByMaxRemainingPathLength = Cache.make((state) => {
  state = state.update('tree', TT.sortByMaxRemainingPathLength)

  return state
})

export const toJson = Cache.make((state) => {
  state = state.update('tree', TT.toJson)
  state = state.update('content_queue', contentQueueToJson)
  state = state.update('tags', tagsToJson)
  state = state.update('tags_sizes', tagsToJson)
  state = state.toJS()

  return JSON.stringify(state)
})
export const fromJson = (json) => {
  let state = JSON.parse(json)
  if (state.version === 5) {
    return fromJsonV5(json)
  } else if (state.version === 6) {
    // same structure as v7
  }

  state = new Fs(state)
  state = state.update('tags', tagsFromJson)
  state = state.update('tags_sizes', tagsSizesFromJson)
  state = state.update('content_queue', contentQueueFromJson)
  state = state.update('tree', TT.fromJson)
  state = state.update('parent_path', List)

  return state
}


export const toJs = (state) => {
  state = state.update('tree', TT.toJs)
  state = state.update('content_queue', contentQueueToJs)
  state = state.update('tags', tagsToJs)
  state = state.update('tags_sizes', tagsToJs)
  return state.toJS()
}
export const fromJs = (js) => {
  let state = new Fs(js)
  state = state.update('tags', tagsFromJs)
  state = state.update('tags_sizes', tagsFromJs)
  state = state.update('content_queue', contentQueueFromJs)
  state = state.update('tree', TT.fromJs)
  state = state.update('parent_path', List)

  return state
}


export const toStrList2 = Cache.make((state) => {
  return TT.toStrList2(state.get('tree'), state.get('tags'))
})

export const setParentPath = (parent_path, state) =>
  state.set('parent_path', List(parent_path))


export const fromLegacyCsv = (csv) => {
  const parseLine = (a) =>
    a.match(/(".*?")|([^,"\s]*)/g)
      .filter(a=>a!=="")
      .map(a=>a.replace(/"/g,''))
  let ans = setVersion(4, empty())
  const lines = csv.split('\n')
    .filter(a=>a!=='')
    .map(parseLine)
    .forEach(([path,size])=>{
      ans = pushOnQueue(path, Content.create({size:Number(size)}), ans)
    })
  ans = makeTree(ans)
  ans = sortBySize(ans)
  return ans
}

export const getIDPath = (id, state) => {
  return TT.getIdPath(id, state.get('tree'))
}

export const getLeafIdArray = (state) => {
  return TT.getLeafIdArray(state.get('tree'))
}

export const getSubIdList = (id, state) => {
  return TT.getSubIdList(id, state.get('tree'))
}










// v5 | v6,v7

TT.v5ToCommon = TT.v5ToCommon(Content.v5ToCommon)
TT.toCommon = TT.toCommon(Content.toCommon)
TT.fromV5 = TT.fromV5(Content.fromV5)
const contentQueueToCommon = (f,a) => {
  return a.map(e=>{
    const path = e.get('path')
    const content = e.update('content',f)
    return Map({
      path,
      content
    })
  })
}
const makeLastModifiedFromTreeRec = (id,table) => {
  let node = table.get(id)
  const children = node.get('children')
  if (children.size) {
    children.forEach(child_id=>{
      table = makeLastModifiedFromTreeRec(child_id,table)
    })
    let list = List()
    children.forEach(child_id=>{
      const child_node = table.get(child_id)
      list = list.concat(child_node.get('content').get('last_modified').get('list'))
    })
    let max = list.max()
    let min = list.min()
    node = node.update('content',a=>a.update('last_modified',last_modified=>{
      last_modified = last_modified.set('list',list)
      last_modified = last_modified.set('max',max)
      last_modified = last_modified.set('min',min)
      return last_modified
    }))
    table = table.set(id,node)
    return table
  } else {
    return table
  }
}
const makeLastModifiedFromTree = (tt) => {
  const table = tt.get('table')
  const root_id = tt.get('root_id')

  tt = tt.set('table', makeLastModifiedFromTreeRec(root_id,table))

  return tt
}
const makeTagsFromTree = (tt) => {
  let tags = Map()
  const insert = (id,tag) => {
    tags = tags.update(tag,s=>{
      if (s) {
        return s.add(id)
      } else {
        return Set([id])
      }
    })
  }
  tt.get('table').forEach((val,key) => {
    val.get('content').get('tags').forEach(tag=>{
      insert(key,tag)
    })
  })
  return tags
}
export const v5ToCommon = (a) => {
  const session_name = a.get('session_name')
  const content_queue = contentQueueToCommon(Content.v5ToCommon, a.get('content_queue'))
  const tree = TT.v5ToCommon(a.get('tree'))
  const tags = makeTagsFromTree(tree)
  const parent_path = a.get('parent_path')
  return Map({
    session_name,
    content_queue,
    tree,
    tags,
    parent_path
  })
}
export const toCommon = (a) => {
  const session_name = a.get('session_name')
  const content_queue = contentQueueToCommon(Content.toCommon, a.get('content_queue'))
  const tree = TT.toCommon(a.get('tree'))
  const parent_path = a.get('parent_path')
  const tags = a.get('tags')

  return Map({
    session_name,
    content_queue,
    tree,
    tags,
    parent_path
  })
}
export const fromV5 = (a) => {
  const session_name = a.get('session_name')
  const version = 6
  const content_queue = a.get('content_queue').map(a=>{
    return a.update('content',Content.fromV5)
  })
  const tree = TT.fromV5(a.get('tree'))
  const tags = makeTagsFromTree(tree)
  const parent_path = a.get('parent_path')

  return new Fs({
    session_name,
    version,
    content_queue,
    tree,
    tags,
    parent_path
  })
}

const fromJsonV5 = (a) => {
  a = fromV5(V5.fromJson(a))
  a = a.update('tree', makeLastModifiedFromTree)
  a = computeDerivatedData(a)
  return a
}
