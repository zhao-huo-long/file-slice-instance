const express = require('express')

const app = express()

const cors = require('cors')

const port = 9876

const fileUpload = require('express-fileupload')

app.use(cors())


app.use(fileUpload({
  limits: { fileSize: 500 * 1024 * 1024 },
  useTempFiles : false,
  safeFileNames: false,
}));


app.post('/sendChunkFile', (req, res) => {
  const chunkFile =  req.files.chunkFile
  chunkFile.mv('./chunkFile/' + `${req.body.hash}-${req.body.all}-${chunkFile.name}`, function(err) {
    if (err)
      return res.status(500).send(err);
    res.send({
      success: true,
      msg: 'ok'
    });
  });
})


app.post('/mergeChunkFile', (req, res) => {
  const { hash, fileName, all } = req.body
  const fs = require('fs')
  const target = fs.createWriteStream('./file/' + fileName)
  const fileList = new Array()
  fileList.length = all
  fileList.fill(`./chunkFile/${hash}-${all}-${fileName}`)
  const filePath = fileList.map( (i, index) => i + '-' + index )
  filePath.forEach( m => target.write(fs.readFileSync(m)))
  target.end();
  target.on('finish', () => {
    res.send({
      success: true,
      msg: 'ok',
      fileName
    });
    filePath.forEach( m => fs.unlinkSync(m))
  })
  target.on('error', function(err){
    return res.status(500).send(err);
  });
})


app.get('/getFile/:fileName', (req, res) => {
  const { fileName } = req.params
  const fs = require('fs')
  res.send(fs.readFileSync('./file/' + fileName))
})


app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})