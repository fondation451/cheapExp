

const fs = require('fs')

const recTraverseFileTree = (path) => {
  const stats = fs.statSync(path)
  if (stats.isDirectory()) {
    return fs.readdirSync(path)
      .map(a=>recTraverseFileTree(path+'/'+a))
      .reduce((acc,val)=>acc.concat(val),[])
  } else {
    const file = {
      size:stats.size,
      lastModified:stats.mtimeMs,
    }
    return [[file,path]]
  }
}

const cdDotDot = path => path.split('/').slice(0,-1).join('/')


export const traverseFileTree = (dropped_folder_path) => {
  let origin = recTraverseFileTree(dropped_folder_path)
  dropped_folder_path = cdDotDot(dropped_folder_path)
  origin = origin.map(([file,path])=>[file,path.slice(dropped_folder_path.length)])
  return [dropped_folder_path,origin]
}


export function isJsonFile(path) {
  const stats = fs.statSync(path)
  return stats.isFile() && hasJsonExt(path)
}

function hasJsonExt(path) {
  const name = path.split('/').slice(-1)[0].split('.')
  if (name.length===2) {
    return name.slice(-1).pop() === 'json'
  } else {
    return false
  }
}

export const readFileSync = fs.readFileSync


// import { mkScheduler } from 'scheduler'
// import * as FileUti from 'file-uti'

// const sch = mkScheduler()

// export function asyncHandleDrop(event, insert2DB, loadJson2DB, loadLegacyCsv2DB) {
//   event.preventDefault()
//   const items = event.dataTransfer.items


//   const entry = items[0].webkitGetAsEntry()
//   if (isJsonFile(entry)) {
//     return readFileFromEntry(entry)
//       .then(loadJson2DB)
//       .then(()=>false)
//   } else if (isLegacyCsvFile(entry)) {
//     return readFileFromEntry(entry)
//       .then(loadLegacyCsv2DB)
//       .then(()=>false)
//   } else {
//     const promise_array = []
//     for (let i=0; i<items.length; i++) {
//       const entry = items[i].webkitGetAsEntry()
//       promise_array.push(traverseFileTree(insert2DB, entry, ''))
//     }
//     return Promise.all(promise_array)
//       .then(()=>true)
//   }
// }

// function isJsonFile(entry) {
//   return entry.isFile && hasJsonExt(entry.name)
// }

// function hasJsonExt(s) {
//   return s.split('.').slice(-1).pop() === 'json'
// }

// function isLegacyCsvFile(entry) {
//   return entry.isFile && hasLegacyCsvExt(entry.name)
// }

// function hasLegacyCsvExt(s) {
//   return s.split('.').slice(-1).pop() === 'csv'
// }


// function readFileFromEntry(entry) {
//   return new Promise((resolve, reject) => {
//     entry.file(file => {
//       FileUti.readAsText(file).then(content => {
//         resolve(content)
//       })
//     }, e => {
//       console.log(e)
//       resolve()
//     })
//   })
// }


// function traverseFileTree(insert2DB, entry, parent_path) {
//   if (entry.isFile) {
//     return traverseFile(insert2DB, entry, parent_path)
//   } else if (entry.isDirectory) {
//     return traverseFolder(insert2DB, entry, parent_path)
//   }
// }


// function traverseFile(insert2DB, entry, parent_path) {
//   return new Promise((resolve, reject) => sch.schedule(() => {
//     entry.file(file => {
//       insert2DB(parent_path, file)
//       resolve()
//     }, e => {
//       insert2DB(parent_path, new File([''], entry.name))
//       resolve()
//     })
//   }))
// }

// function traverseFolder(insert2DB, entry, parent_path) {
//   return new Promise((resolve, reject) => sch.schedule(() => {
//     let promise_array = []
//     let dirReader = entry.createReader()
//     const doBatch = () => {
//       dirReader.readEntries(entries => {
//         if (entries.length > 0) {
//           entries.forEach(e =>
//             promise_array.push(traverseFileTree(insert2DB, e, parent_path+entry.name+'/'))
//           )
//           doBatch()
//         } else {
//           Promise.all(promise_array).then(()=>resolve())
//         }
//       }, e => {
//         insert2DB(parent_path, new File([''], entry.name+'/'))
//         resolve()
//       })
//     }
//     doBatch()
//   }))
// }


