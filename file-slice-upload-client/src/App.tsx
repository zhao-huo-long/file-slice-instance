import { Button, Upload, Modal, Progress, message } from 'antd'
import { useRef, useState } from 'react'
import fileSliceUpload from 'file-slice-upload'
import axios from 'axios'
import type { FileSliceUpload } from 'file-slice-upload'

type Props = {
  vis: boolean,
  onClose: () => void
}

const serverHost = 'http://120.25.173.175:9876'

function FileUpload(props: Props) {
  const { onClose } = props
  const file = useRef<File>()
  const upload = useRef<FileSliceUpload>()
  const [percent, setPer] = useState(0)
  const onOk = async () => {
    if (file.current) {
      console.log(file.current)
      upload.current = fileSliceUpload(1024 * 1024)
        .setFile(file.current)
        .setAjax(async({chunk, md5, all}) => {
          const formData = new FormData()
          formData.append('chunkFile', chunk)
          formData.append('hash', md5)
          formData.append('all', `${all}`)
          const res = await axios
            .post(`${serverHost}/sendChunkFile`, formData)
          return res.data.success
        })
        .on('progress', (e) => {
          if(e.type === 'md5'){
            setPer(Math.ceil(30 * e.done / e.all))
          }
          if(e.type === 'upload'){
            setPer(Math.ceil(30 + 49 * e.done / e.all))
          }
        })
        .on('finish', async ({ md5, file, all }) => {
          const formData = new FormData()
          formData.append('hash', md5)
          formData.append('fileName', file.name)
          formData.append('all', `${all}`)
          const res = await axios
            .post(`${serverHost}/mergeChunkFile`, formData)
          setPer(100)
          message.success('上传成功')
          window.open(`${serverHost}/getFile/` + res.data.fileName)
        })
      upload.current.start()
    }
  }
  return <Modal onCancel={() => {
      file.current = undefined
      upload.current?.cancel()
      onClose()
    }} cancelText="取消" okText="上传" onOk={onOk} visible={props.vis}>
      <div>
        演示服务器带宽小, 请选择10m左右大小的做测试文件
      </div>
      <Upload 
        onChange={(e) =>{ 
          setPer(0)
          upload.current?.cancel()
          file.current = e.file as unknown as File
        }}
        onDrop={() =>{ 
          setPer(0)
          file.current = undefined 
        }}
        maxCount={1} 
        showUploadList={{
          showRemoveIcon: false
        }}
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
      { vis && <FileUpload vis={vis} onClose={() => setVis(false)} /> }
    </div>
  )
}

export default App
