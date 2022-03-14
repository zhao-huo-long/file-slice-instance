import { Button, Upload, Modal, Progress, message } from 'antd'
import { useRef, useState } from 'react'
import fileSliceUpload from 'file-slice-upload'
import axios from 'axios'
import md5 from './md5';

type Props = {
  vis: boolean,
  onClose: () => void
}

function FileUpload(props: Props) {
  const { onClose, vis } = props
  const file = useRef<File>()
  const upload = useRef<any>()
  const [percent, setPer] = useState(0)
  const onOk = async () => {
    if (file.current) {
      const hash = await md5(file.current, (p) => setPer(Math.ceil(30 * p)))
      if(!file.current) return 
      upload.current = fileSliceUpload(1)
        .file(file.current, '1M')
        .uploadFunc(async(chunk, index, chunks) => {
          const formData = new FormData()
          formData.append('chunkFile', chunk)
          formData.append('hash', hash)
          formData.append('all', `${chunks.length}`)
          const res = await axios
            .post('http://120.25.173.175:9876/sendChunkFile', formData)
          return res.data.success
        })
        .on('progress', (e) => setPer(Math.ceil(30 + 49 * e.done / e.all)))
        .on('finish', async ({ chunks }) => {
          const formData = new FormData()
          formData.append('hash', hash)
          formData.append('fileName', file.current!.name)
          formData.append('all', `${chunks.length}`)
          const res = await axios
            .post('http://120.25.173.175:9876/mergeChunkFile', formData)
          setPer(100)
          message.success('上传成功')
          window.open('http://120.25.173.175:9876/getFile/' + res.data.fileName)
        })
        .start()
    }
  }
  return <Modal onCancel={() => {
      file.current = undefined
      upload.current?.stop()
      onClose()
    }} cancelText="取消" okText="上传" onOk={onOk} visible={props.vis}>
    <Upload 
      onChange={(e) => file.current = e.file as unknown as File} 
      maxCount={1} 
      beforeUpload={() => false}>
      <Button>选择文件</Button>
    </Upload>
    <Progress percent={percent} status="active" />
  </Modal>
}


function App() {
  const [vis, setVis] = useState(false)
  return (
    <div className="App">
      <Button onClick={() => setVis(!vis)} >上传</Button>
      <FileUpload vis={vis} onClose={() => setVis(false)} />
    </div>
  )
}

export default App
